import { useEffect, useState, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isDesktopWebsite(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(min-width: 1024px)').matches;
}

function getAppScroller(): HTMLElement | null {
  return document.querySelector('.app-main') as HTMLElement | null;
}

function forceRevealVisible(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('[data-reveal], [data-split] .website-split-unit').forEach((el) => {
    el.style.opacity = '';
    el.style.transform = '';
    el.style.visibility = '';
    try {
      gsap.set(el, { clearProps: 'opacity,visibility,transform' });
    } catch {
      /* ignore */
    }
  });
}

function clearStuckReveals(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('[data-reveal], [data-split] .website-split-unit').forEach((el) => {
    const opacity = Number.parseFloat(window.getComputedStyle(el).opacity);
    if (Number.isFinite(opacity) && opacity < 0.05) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      try {
        gsap.set(el, { clearProps: 'opacity,visibility,transform' });
      } catch {
        /* ignore */
      }
    }
  });
}

/**
 * Split an element's text into word (or char) spans for stagger reveals.
 * Leaves original text intact on failure; units start visible.
 */
export function splitText(
  el: HTMLElement,
  mode: 'words' | 'chars' = 'words',
): HTMLElement[] {
  const raw = el.textContent ?? '';
  if (!raw.trim()) return [];

  try {
    const units =
      mode === 'chars'
        ? Array.from(raw)
        : raw.split(/(\s+)/);

    el.setAttribute('aria-label', raw.trim());
    el.textContent = '';
    el.classList.add('website-split');

    const nodes: HTMLElement[] = [];
    units.forEach((unit) => {
      if (!unit) return;
      if (/^\s+$/.test(unit)) {
        el.appendChild(document.createTextNode(unit));
        return;
      }
      const span = document.createElement('span');
      span.className = 'website-split-unit';
      span.style.display = 'inline-block';
      span.textContent = unit;
      el.appendChild(span);
      nodes.push(span);
    });
    return nodes;
  } catch {
    el.textContent = raw;
    return [];
  }
}

/** Smooth scroll for desktop marketing — binds to `.app-main` scrollport. */
export function useDesktopMarketingScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled || prefersReducedMotion() || !isDesktopWebsite()) return;

    const wrapper = getAppScroller();
    if (!wrapper) return;

    let lenis: Lenis | null = null;
    let ticker: ((time: number) => void) | null = null;
    let onScroll: (() => void) | null = null;

    const updateProgress = () => {
      const bar = document.getElementById('website-scroll-progress');
      if (!bar || wrapper.scrollHeight <= wrapper.clientHeight) return;
      const p = wrapper.scrollTop / (wrapper.scrollHeight - wrapper.clientHeight);
      bar.style.width = `${Math.min(100, Math.max(0, p * 100))}%`;
    };

    try {
      lenis = new Lenis({
        wrapper,
        content: (wrapper.firstElementChild as HTMLElement) || wrapper,
        duration: 1.1,
        smoothWheel: true,
        autoRaf: false,
      });

      onScroll = () => {
        ScrollTrigger.update();
        updateProgress();
      };
      lenis.on('scroll', onScroll);

      ticker = (time: number) => {
        lenis?.raf(time * 1000);
      };
      gsap.ticker.add(ticker);
      gsap.ticker.lagSmoothing(0);
    } catch (err) {
      console.warn('[choir360] Lenis unavailable — native scroll fallback', err);
      lenis = null;
      const nativeScroll = () => {
        ScrollTrigger.update();
        updateProgress();
      };
      wrapper.addEventListener('scroll', nativeScroll, { passive: true });
      return () => {
        wrapper.removeEventListener('scroll', nativeScroll);
      };
    }

    wrapper.addEventListener('scroll', updateProgress, { passive: true });

    return () => {
      wrapper.removeEventListener('scroll', updateProgress);
      if (ticker) gsap.ticker.remove(ticker);
      if (lenis && onScroll) {
        try {
          lenis.off('scroll', onScroll);
          lenis.destroy();
        } catch {
          try {
            lenis.destroy();
          } catch {
            /* ignore */
          }
        }
      }
    };
  }, [enabled]);
}

/** Plan alias */
export const useDesktopSmoothScroll = useDesktopMarketingScroll;

/** Session enter veil — auto-dismisses; never traps users on a blank screen. */
export function useEnterVeil() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isDesktopWebsite() || prefersReducedMotion()) {
      setShow(false);
      return;
    }
    try {
      if (sessionStorage.getItem('choir360-entered') === '1') {
        setShow(false);
        return;
      }
    } catch {
      setShow(false);
      return;
    }

    setShow(true);

    const timer = window.setTimeout(() => {
      try {
        sessionStorage.setItem('choir360-entered', '1');
      } catch {
        /* ignore */
      }
      setShow(false);
    }, 2800);

    return () => window.clearTimeout(timer);
  }, []);

  const enter = () => {
    try {
      sessionStorage.setItem('choir360-entered', '1');
    } catch {
      /* ignore */
    }
    setShow(false);
  };

  return { show, enter };
}

/**
 * Section reveals + split-text + chapter scrub — content visible by default.
 * Animation only applies when ScrollTrigger fires (`immediateRender: false`).
 */
export function useSectionReveals(rootRef: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    if (!enabled || prefersReducedMotion() || !isDesktopWebsite()) return;
    const root = rootRef.current;
    if (!root) return;

    forceRevealVisible(root);

    const scroller = getAppScroller() || undefined;
    let ctx: gsap.Context | null = null;
    let safetyTimer = 0;

    try {
      ctx = gsap.context(() => {
        // Word/letter stagger on [data-split]
        root.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
          const mode = el.getAttribute('data-split') === 'chars' ? 'chars' : 'words';
          const units = splitText(el, mode);
          if (!units.length) return;
          gsap.from(units, {
            opacity: 0,
            y: 28,
            duration: 0.85,
            stagger: mode === 'chars' ? 0.02 : 0.045,
            ease: 'power3.out',
            immediateRender: false,
            clearProps: 'opacity,transform',
            scrollTrigger: {
              trigger: el,
              scroller: scroller || undefined,
              start: 'top 88%',
              once: true,
            },
            onComplete() {
              units.forEach((u) => gsap.set(u, { clearProps: 'opacity,transform' }));
            },
          });
        });

        root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
          gsap.from(el, {
            opacity: 0,
            y: 40,
            duration: 0.95,
            ease: 'power3.out',
            immediateRender: false,
            clearProps: 'opacity,visibility,transform',
            scrollTrigger: {
              trigger: el,
              scroller: scroller || undefined,
              start: 'top 90%',
              toggleActions: 'play none none none',
              once: true,
            },
            onComplete() {
              gsap.set(el, { clearProps: 'opacity,visibility,transform' });
            },
          });
        });

        const heroImg = root.querySelector<HTMLElement>('[data-hero-parallax]');
        if (heroImg && heroImg.parentElement) {
          gsap.to(heroImg, {
            yPercent: 10,
            ease: 'none',
            scrollTrigger: {
              trigger: heroImg.parentElement,
              scroller: scroller || undefined,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
            },
          });
        }

        // How-it-works: scrubbed chapter storytelling (no hard pin — safer with Lenis)
        const how = root.querySelector<HTMLElement>('[data-how-chapter]');
        if (how) {
          const steps = how.querySelectorAll<HTMLElement>('[data-how-step]');
          const rail = how.querySelector<HTMLElement>('[data-how-progress]');
          if (steps.length) {
            ScrollTrigger.create({
              trigger: how,
              scroller: scroller || undefined,
              start: 'top 70%',
              end: 'bottom 40%',
              scrub: true,
              onUpdate(self) {
                how.classList.add('is-scrubbing');
                const idx = Math.min(
                  steps.length - 1,
                  Math.floor(self.progress * steps.length),
                );
                steps.forEach((step, i) => {
                  step.classList.toggle('is-step-active', i === idx);
                });
                if (rail) {
                  rail.style.height = `${Math.round(self.progress * 100)}%`;
                }
              },
            });
          }
        }

        // Chapter rail active state from section visibility
        const chapterBtns = root.querySelectorAll<HTMLElement>('[data-chapter]');
        chapterBtns.forEach((btn) => {
          const targetId = btn.getAttribute('data-chapter');
          if (!targetId) return;
          const section = root.querySelector(`#${CSS.escape(targetId)}`);
          if (!section) return;
          ScrollTrigger.create({
            trigger: section,
            scroller: scroller || undefined,
            start: 'top 45%',
            end: 'bottom 45%',
            onToggle(self) {
              if (self.isActive) {
                chapterBtns.forEach((b) => b.classList.remove('is-chapter-active'));
                btn.classList.add('is-chapter-active');
              }
            },
          });
        });
      }, root);

      requestAnimationFrame(() => {
        try {
          ScrollTrigger.refresh();
        } catch {
          forceRevealVisible(root);
        }
      });
    } catch (err) {
      console.warn('[choir360] ScrollTrigger reveals failed — keeping content visible', err);
      forceRevealVisible(root);
    }

    safetyTimer = window.setTimeout(() => {
      clearStuckReveals(root);
    }, 2500);

    return () => {
      window.clearTimeout(safetyTimer);
      try {
        ctx?.revert();
      } catch {
        forceRevealVisible(root);
      }
      // Kill only triggers created for this root's session via context.revert;
      // do not wipe unrelated ScrollTriggers if Lenis cleanup already ran.
    };
  }, [rootRef, enabled]);
}

/** Plan alias */
export const sectionReveal = useSectionReveals;
