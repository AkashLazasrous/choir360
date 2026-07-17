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

/** Smooth scroll for desktop marketing — binds to `.app-main` scrollport. */
export function useDesktopMarketingScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled || prefersReducedMotion() || !isDesktopWebsite()) return;

    const wrapper = document.querySelector('.app-main') as HTMLElement | null;
    if (!wrapper) return;

    const lenis = new Lenis({
      wrapper,
      content: (wrapper.firstElementChild as HTMLElement) || wrapper,
      duration: 1.1,
      smoothWheel: true,
    });

    const onScroll = () => {
      ScrollTrigger.update();
      const bar = document.getElementById('website-scroll-progress');
      if (bar && wrapper.scrollHeight > wrapper.clientHeight) {
        const p = wrapper.scrollTop / (wrapper.scrollHeight - wrapper.clientHeight);
        bar.style.width = `${Math.min(100, Math.max(0, p * 100))}%`;
      }
    };

    lenis.on('scroll', onScroll);
    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(ticker);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [enabled]);
}

/** Session enter veil — skip when reduced motion or already entered. */
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
      /* ignore */
    }
    setShow(true);
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

/** Stagger children of `[data-reveal]` sections on desktop. */
export function useSectionReveals(rootRef: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    if (!enabled || prefersReducedMotion() || !isDesktopWebsite()) return;
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 48 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              scroller: '.app-main',
              start: 'top 88%',
              toggleActions: 'play none none none',
            },
          },
        );
      });

      const heroImg = root.querySelector<HTMLElement>('[data-hero-parallax]');
      if (heroImg) {
        gsap.to(heroImg, {
          yPercent: 12,
          ease: 'none',
          scrollTrigger: {
            trigger: heroImg.parentElement,
            scroller: '.app-main',
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }
    }, root);

    return () => ctx.revert();
  }, [rootRef, enabled]);
}
