/**
 * AURELION — The Sovereign
 * ✦ Smooth 120fps scroll-driven image sequence
 *   - Standard canvas (no desynchronized / no alpha:false)
 *   - DPR capped at 2 for stable rendering
 *   - Delta-time lerp: frame-rate independent at 60/120/144fps
 *   - Frame blending between adjacent frames
 */

/* ============================================================
   CONFIG
   ============================================================ */
const TOTAL_FRAMES = 300;
const FRAME_PATH   = (n) => `images/ezgif-frame-${String(n).padStart(3,'0')}.webp`;

const LABEL_RANGES = {
  'label-skeleton':   { start: 0.05, end: 0.28 },
  'label-gears':      { start: 0.30, end: 0.52 },
  'label-explosion':  { start: 0.54, end: 0.75 },
  'label-reassemble': { start: 0.78, end: 0.96 },
};

// Time in ms to close 63% of the gap — tune for feel
const SMOOTH_MS = 180;

/* ============================================================
   CANVAS — clean standard context
   ============================================================ */
const canvas = document.getElementById('watch-canvas');
const ctx    = canvas.getContext('2d');

ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

/* ============================================================
   STATE
   ============================================================ */
const images = new Array(TOTAL_FRAMES).fill(null);

let loadedCount       = 0;
let currentFrame      = 0;   // fractional for smooth blending
let targetFrame       = 0;   // driven by scroll
let rafId             = null;
let lastTimestamp     = 0;
let lastScrubProgress = 0;
let uiTicking         = false;

/* ============================================================
   PRELOAD
   ============================================================ */
function preloadImages() {
  const overlay = createLoadingOverlay();

  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const idx = i - 1;
    const img = new Image();
    images[idx] = img;
    img.src = FRAME_PATH(i);

    img.onload = () => {
      loadedCount++;
      overlay.setProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
      if (loadedCount === 1) {
        drawBlendedFrame(0);
        startRenderLoop();
      }
      if (loadedCount === TOTAL_FRAMES) {
        overlay.hide();
        initScrollHandlers();
      }
    };

    img.onerror = () => { loadedCount++; };
  }
}

/* ============================================================
   CANVAS SIZING — DPR capped at 2 for stable clean rendering
   ============================================================ */
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width  = Math.round(window.innerWidth  * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  drawBlendedFrame(currentFrame);
}

/* ============================================================
   DRAW — blends two adjacent frames for sub-frame smoothness
   ============================================================ */
function drawBlendedFrame(fractionalIndex) {
  const cw = window.innerWidth;
  const ch = window.innerHeight;

  const indexA = Math.floor(fractionalIndex);
  const indexB = Math.min(indexA + 1, TOTAL_FRAMES - 1);
  const blend  = fractionalIndex - indexA;

  const imgA = images[indexA];
  const imgB = images[indexB];

  if (!imgA || !imgA.complete || imgA.naturalWidth === 0) return;

  ctx.clearRect(0, 0, cw, ch);
  drawImageCover(imgA, cw, ch, 1.0);

  if (blend > 0.01 && imgB && imgB.complete && imgB.naturalWidth > 0) {
    drawImageCover(imgB, cw, ch, blend);
  }
}

function drawImageCover(img, cw, ch, alpha) {
  const imgAspect    = img.naturalWidth / img.naturalHeight;
  const canvasAspect = cw / ch;

  let dw, dh, dx, dy;
  if (imgAspect > canvasAspect) {
    dh = ch; dw = dh * imgAspect;
    dx = (cw - dw) / 2; dy = 0;
  } else {
    dw = cw; dh = dw / imgAspect;
    dx = 0; dy = (ch - dh) / 2;
  }

  ctx.globalAlpha = alpha;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.globalAlpha = 1.0;
}

/* ============================================================
   RENDER LOOP — delta-time lerp (same feel at any refresh rate)
   ============================================================ */
function startRenderLoop() {
  if (rafId) return;

  function loop(timestamp) {
    const delta = lastTimestamp
      ? Math.min(timestamp - lastTimestamp, 50)
      : 16.67;
    lastTimestamp = timestamp;

    // Exponential decay — frame-rate independent
    const alpha = 1 - Math.pow(Math.E, -(delta / SMOOTH_MS));
    const diff  = targetFrame - currentFrame;

    if (Math.abs(diff) > 0.002) {
      currentFrame += diff * alpha;
      currentFrame = Math.max(0, Math.min(TOTAL_FRAMES - 1, currentFrame));
      drawBlendedFrame(currentFrame);
    }

    rafId = requestAnimationFrame(loop);
  }

  rafId = requestAnimationFrame(loop);
}

/* ============================================================
   SCROLL
   ============================================================ */
function initScrollHandlers() {
  const scrubSection = document.getElementById('scrub-section');
  const specsCards   = document.querySelectorAll('.spec-card');
  const luxuryQuote  = document.querySelector('.luxury-quote');
  const ctaInner     = document.querySelector('.cta-inner');
  const nav          = document.getElementById('nav');
  const scrollProg   = document.getElementById('scroll-progress');

  let lastScrollY = window.scrollY;

  function onScroll() {
    lastScrollY = window.scrollY;
    updateTargetFrame(lastScrollY, scrubSection);

    if (!uiTicking) {
      requestAnimationFrame(() => {
        updateUI(lastScrollY, specsCards, luxuryQuote,
                 ctaInner, nav, scrollProg);
        uiTicking = false;
      });
      uiTicking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    resizeCanvas();
    updateTargetFrame(window.scrollY, scrubSection);
  });

  updateTargetFrame(window.scrollY, scrubSection);
  updateUI(window.scrollY, specsCards, luxuryQuote,
           ctaInner, nav, scrollProg);
}

function updateTargetFrame(scrollY, scrubSection) {
  const r  = scrubSection.getBoundingClientRect();
  const sh = scrubSection.offsetHeight - window.innerHeight;
  const sp = Math.max(0, Math.min(1, -r.top / sh));
  lastScrubProgress = sp;
  targetFrame = sp * (TOTAL_FRAMES - 1);
}

function updateUI(scrollY, specsCards, luxuryQuote,
                  ctaInner, nav, scrollProg) {
  const docH = document.documentElement.scrollHeight - window.innerHeight;
  scrollProg.style.width = `${(scrollY / docH) * 100}%`;
  nav.classList.toggle('scrolled', scrollY > 60);

  const sp = lastScrubProgress;
  Object.entries(LABEL_RANGES).forEach(([id, range]) =>
    document.getElementById(id)
      ?.classList.toggle('active', sp >= range.start && sp <= range.end)
  );

  specsCards.forEach(card => {
    if (card.getBoundingClientRect().top < window.innerHeight * 0.85)
      setTimeout(() => card.classList.add('visible'),
                 parseInt(card.dataset.delay || '0'));
  });

  if (luxuryQuote?.getBoundingClientRect().top < window.innerHeight * 0.8)
    luxuryQuote.classList.add('visible');

  if (ctaInner?.getBoundingClientRect().top < window.innerHeight * 0.75)
    ctaInner.classList.add('visible');
}

/* ============================================================
   LOADING OVERLAY
   ============================================================ */
function createLoadingOverlay() {
  const el = document.createElement('div');
  el.style.cssText = `
    position:fixed;inset:0;z-index:9999;background:#070707;
    display:flex;flex-direction:column;align-items:center;
    justify-content:center;gap:1.5rem;transition:opacity 0.8s ease;
  `;
  const logo = document.createElement('div');
  logo.style.cssText = `font-family:'Cormorant Garamond',Georgia,serif;
    font-size:1.4rem;letter-spacing:0.4em;color:#c8a84b;`;
  logo.textContent = 'AURELION';

  const track = document.createElement('div');
  track.style.cssText = `width:200px;height:1px;
    background:rgba(200,168,75,0.15);position:relative;overflow:hidden;`;

  const fill = document.createElement('div');
  fill.style.cssText = `position:absolute;left:0;top:0;bottom:0;width:0%;
    background:#c8a84b;transition:width 0.15s ease;
    box-shadow:0 0 8px rgba(200,168,75,0.5);`;
  track.appendChild(fill);

  const label = document.createElement('div');
  label.style.cssText = `font-size:0.6rem;letter-spacing:0.3em;
    color:rgba(200,168,75,0.5);text-transform:uppercase;`;
  label.textContent = 'Loading Experience…';

  el.append(logo, track, label);
  document.body.appendChild(el);

  return {
    setProgress(pct) { fill.style.width = pct + '%'; label.textContent = pct + '%'; },
    hide() { el.style.opacity = '0'; setTimeout(() => el.remove(), 900); }
  };
}

/* ============================================================
   MODAL
   ============================================================ */
function initModal() {
  const modal    = document.getElementById('reserve-modal');
  const openBtns = [document.getElementById('main-reserve-btn'),
                    document.getElementById('nav-reserve-btn')];
  const closeBtn = document.getElementById('modal-close');
  const form     = document.getElementById('reserve-form');

  openBtns.forEach(b => b?.addEventListener('click', () => modal.classList.add('open')));
  closeBtn?.addEventListener('click', () => modal.classList.remove('open'));
  modal?.addEventListener('click', e => {
    if (e.target === modal) modal.classList.remove('open');
  });

  form?.addEventListener('submit', e => {
    e.preventDefault();
    modal.classList.remove('open');
    setTimeout(() => {
      const t = document.createElement('div');
      t.style.cssText = `position:fixed;bottom:2rem;right:2rem;z-index:9999;
        background:#0e0c0a;border:1px solid rgba(200,168,75,0.3);
        padding:1.2rem 2rem;max-width:340px;font-size:0.75rem;
        color:#f0ebe0;line-height:1.7;box-shadow:0 8px 32px rgba(0,0,0,0.5);`;
      t.innerHTML = `<span style="color:#c8a84b;font-family:'Cormorant Garamond',serif;
        font-size:1rem;display:block;margin-bottom:0.5rem">✦ Reservation Received</span>
        A personal horologist will contact you within 24 hours.`;
      document.body.appendChild(t);
      setTimeout(() => {
        t.style.cssText += 'opacity:0;transition:opacity 0.6s';
        setTimeout(() => t.remove(), 600);
      }, 5000);
    }, 200);
  });
}

document.querySelectorAll('a[href^="#"]').forEach(a =>
  a.addEventListener('click', e => {
    const t = document.querySelector(a.getAttribute('href'));
    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
  })
);

/* ============================================================
   BOOT
   ============================================================ */
resizeCanvas();
preloadImages();
initModal();
