/**
 * Export / print helpers for the Digital Choir ID card.
 * Captures only #choir-id-card (no app chrome) at wallet-pass proportions.
 */

import { toPng } from 'html-to-image';

/** Wallet / plastic badge short edge (portrait CR80 family). */
export const CHOIR_ID_PRINT_WIDTH_MM = 63.5;

/** Target CSS width when normalizing the live card for capture. */
export const CHOIR_ID_CAPTURE_WIDTH_PX = 380;

export interface CardExportResult {
  dataUrl: string;
  widthMm: number;
  heightMm: number;
  widthPx: number;
  heightPx: number;
}

function prepareCardForCapture(card: HTMLElement): () => void {
  const prev = {
    transform: card.style.transform,
    transition: card.style.transition,
    willChange: card.style.willChange,
  };
  card.classList.add('digital-pass--exporting');
  card.style.transform = 'none';
  card.style.transition = 'none';
  card.style.willChange = 'auto';

  return () => {
    card.classList.remove('digital-pass--exporting');
    card.style.transform = prev.transform;
    card.style.transition = prev.transition;
    card.style.willChange = prev.willChange;
  };
}

/** Wait a frame so layout/paint settles after style resets. */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Best-effort: rewrite <img> src to data URLs so html-to-image isn't blocked by CORS.
 * Restores original src attributes afterward.
 */
async function inlineCardImages(card: HTMLElement): Promise<() => void> {
  const imgs = Array.from(card.querySelectorAll('img'));
  const restores: Array<() => void> = [];

  await Promise.all(
    imgs.map(async (img) => {
      const original = img.getAttribute('src');
      if (!original || original.startsWith('data:')) return;
      try {
        const res = await fetch(original, { mode: 'cors', credentials: 'omit', cache: 'reload' });
        if (!res.ok) return;
        const dataUrl = await blobToDataUrl(await res.blob());
        img.setAttribute('src', dataUrl);
        restores.push(() => {
          if (original) img.setAttribute('src', original);
        });
      } catch {
        /* keep original src; capture may still succeed for same-origin assets */
      }
    }),
  );

  return () => {
    restores.forEach((fn) => fn());
  };
}

/**
 * Rasterize the ID card node to a high-DPI PNG data URL.
 * Dimensions follow the card's rendered aspect ratio at wallet-pass width.
 */
export async function captureChoirIdCard(card: HTMLElement): Promise<CardExportResult> {
  const restoreMotion = prepareCardForCapture(card);
  let restoreImages: (() => void) | undefined;
  try {
    restoreImages = await inlineCardImages(card);
    await nextFrame();

    // Normalize capture width so exports are consistent across viewports.
    // Height comes from layout (do not force — avoids squashing the pass).
    const captureWidth = CHOIR_ID_CAPTURE_WIDTH_PX;

    const dataUrl = await toPng(card, {
      cacheBust: true,
      pixelRatio: 3,
      width: captureWidth,
      style: {
        transform: 'none',
        width: `${captureWidth}px`,
        maxWidth: `${captureWidth}px`,
        height: 'auto',
      },
    });

    const dims = await readImageSize(dataUrl);
    const aspect = dims.height / Math.max(dims.width, 1);
    const widthMm = CHOIR_ID_PRINT_WIDTH_MM;
    const heightMm = Math.round(widthMm * aspect * 100) / 100;

    return {
      dataUrl,
      widthMm,
      heightMm,
      widthPx: dims.width,
      heightPx: dims.height,
    };
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(
      `Could not export Digital ID (${detail}). If the member photo is from an external site, try again or use a choir-hosted photo.`,
    );
  } finally {
    restoreImages?.();
    restoreMotion();
  }
}

function readImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Failed to decode exported ID image'));
    img.src = dataUrl;
  });
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Open a blank document containing only the card image, sized to ID dimensions, then print.
 */
export function printChoirIdCardImage(
  dataUrl: string,
  widthMm: number,
  heightMm: number,
  documentTitle = 'Choir360 Digital ID',
): void {
  const printWin = window.open('', '_blank', 'noopener,noreferrer,width=420,height=640');
  if (!printWin) {
    throw new Error('Pop-up blocked. Allow pop-ups to print your Digital ID.');
  }

  const safeTitle = documentTitle.replace(/[<>&"]/g, '');
  const w = widthMm.toFixed(2);
  const h = heightMm.toFixed(2);

  printWin.document.open();
  printWin.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <style>
    @page {
      size: ${w}mm ${h}mm;
      margin: 0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: ${w}mm;
      height: ${h}mm;
      background: #ffffff;
      overflow: hidden;
    }
    body {
      display: flex;
      align-items: stretch;
      justify-content: stretch;
    }
    img {
      display: block;
      width: ${w}mm;
      height: ${h}mm;
      object-fit: fill;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  </style>
</head>
<body>
  <img id="choir-id-print" alt="Choir360 Digital ID" />
  <script>
    (function () {
      var img = document.getElementById('choir-id-print');
      var printed = false;
      function runPrint() {
        if (printed) return;
        printed = true;
        setTimeout(function () {
          window.focus();
          window.print();
        }, 80);
      }
      img.onload = runPrint;
      img.onerror = function () {
        document.body.textContent = 'Could not load Digital ID image for print.';
      };
      window.onafterprint = function () { window.close(); };
      img.src = ${JSON.stringify(dataUrl)};
      if (img.complete) runPrint();
    })();
  </script>
</body>
</html>`);
  printWin.document.close();
}

export function buildChoirIdFilename(member: {
  firstName?: string;
  lastName?: string;
  id: string;
}): string {
  const slug = [member.firstName, member.lastName]
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'member';
  const idPart = member.id.slice(0, 8);
  return `choir360-id-${slug}-${idPart}.png`;
}
