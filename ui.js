/* ============================================================
   AURELION — Scroll-Driven Advertising UI Controller
   Drives the 3D exploded view via scroll position
   ============================================================ */

/* ----------------------------------------------------------
   WAIT FOR SCENE API
   ---------------------------------------------------------- */
function waitForScene() {
  return new Promise(resolve => {
    if (window.watchScene) return resolve(window.watchScene);
    const check = setInterval(() => {
      if (window.watchScene) {
        clearInterval(check);
        resolve(window.watchScene);
      }
    }, 16);
  });
}

/* ----------------------------------------------------------
   MAIN INIT
   ---------------------------------------------------------- */
async function initUI() {
  const api = await waitForScene();

  // Set advertising defaults
  api.setTheme('dark-luxury');
  api.setAutoRotate(true);
  api.setAnimationSpeed(0.7);

  // ---- Cache DOM elements ----
  const scrollProgress = document.getElementById('scroll-progress');
  const nav = document.getElementById('nav');
  const navBrand = document.getElementById('nav-brand');
  const hero = document.getElementById('hero');
  const explodeSection = document.getElementById('explode-section');
  const featureCards = document.querySelectorAll('.feature-card');
  const pricingCard = document.getElementById('pricing-card');
  const scrollHint = document.getElementById('scroll-hint');

  // Show nav brand after a delay
  setTimeout(() => navBrand.classList.add('visible'), 600);

  // ---- Scroll state ----
  let lastScrollY = 0;
  let ticking = false;

  // ---- Scroll listener (throttled via rAF) ----
  window.addEventListener('scroll', () => {
    lastScrollY = window.scrollY;
    if (!ticking) {
      requestAnimationFrame(() => {
        onScroll(lastScrollY);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  function onScroll(scrollY) {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;

    // ==============================
    // 1. Scroll Progress Bar
    // ==============================
    const progress = Math.min(1, scrollY / docHeight);
    scrollProgress.style.width = `${progress * 100}%`;

    // ==============================
    // 2. Nav Background
    // ==============================
    nav.classList.toggle('scrolled', scrollY > 60);

    // ==============================
    // 3. Hero Fade Out
    // ==============================
    const heroFade = Math.min(1, scrollY / (window.innerHeight * 0.45));
    hero.style.opacity = 1 - heroFade;
    hero.style.transform = `translateY(${heroFade * -40}px)`;

    // Hide scroll indicator early
    if (scrollHint) {
      scrollHint.style.opacity = Math.max(0, 1 - scrollY / (window.innerHeight * 0.15));
    }

    // ==============================
    // 4. Exploded View (scroll-driven)
    // ==============================
    const explodeRect = explodeSection.getBoundingClientRect();
    const sectionScrollable = explodeSection.offsetHeight - window.innerHeight;
    const explodeProgress = Math.max(0, Math.min(1, -explodeRect.top / sectionScrollable));

    // Drive 3D layer spread
    api.setSpread(explodeProgress);

    // Update camera to follow exploding watch
    if (api.setScrollProgress) {
      api.setScrollProgress(explodeProgress);
    }

    // ==============================
    // 5. Feature Cards (sequential reveal)
    // ==============================
    featureCards.forEach(card => {
      const order = parseInt(card.dataset.order);
      const totalCards = featureCards.length;
      const cardDuration = 1 / totalCards;      // Each card owns 25% of scroll
      const cardStart = order * cardDuration;
      const cardEnd = (order + 1) * cardDuration;

      // Card visible zone: from 8% into its segment to 8% past its end
      const isVisible = explodeProgress >= cardStart + 0.06 && explodeProgress <= cardEnd + 0.08;
      card.classList.toggle('visible', isVisible);
    });

    // ==============================
    // 6. Pricing Section Reveal
    // ==============================
    if (pricingCard) {
      const pricingRect = document.getElementById('pricing').getBoundingClientRect();
      const pricingVisible = pricingRect.top < window.innerHeight * 0.65;
      pricingCard.classList.toggle('visible', pricingVisible);
    }
  }

  // ---- CTA Button ----
  document.getElementById('reserve-btn')?.addEventListener('click', () => {
    // Pulse animation
    const btn = document.getElementById('reserve-btn');
    btn.style.transform = 'scale(0.96)';
    setTimeout(() => { btn.style.transform = ''; }, 150);

    setTimeout(() => {
      alert(
        '✦ Thank you for your interest in The Sovereign.\n\n' +
        'A personal horologist will contact you within 24 hours\n' +
        'to arrange your private consultation.\n\n' +
        '— AURELION'
      );
    }, 200);
  });

  // ---- Smooth scroll for nav CTA ----
  document.getElementById('nav-reserve')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  });

  // ---- Initial scroll trigger ----
  onScroll(window.scrollY);

  console.log('✦ AURELION advertising experience initialized');
}

/* ----------------------------------------------------------
   BOOT
   ---------------------------------------------------------- */
initUI();
