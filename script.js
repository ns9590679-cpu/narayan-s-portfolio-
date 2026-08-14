import * as THREE from 'three';

/* ---------------------------------------------------------
   Preferences: skip 3D / custom cursor for reduced-motion,
   touch devices, or small screens.
--------------------------------------------------------- */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
const liteMode = prefersReducedMotion || isCoarsePointer || isSmallScreen;

/* ---------------------------------------------------------
   Loader
--------------------------------------------------------- */
const loader = document.getElementById('loader');
const loaderPath = document.getElementById('loaderPath');
const loaderPct = document.getElementById('loaderPct');
const loaderFill = document.getElementById('loaderFill');
const nav = document.getElementById('nav');

requestAnimationFrame(() => loaderPath.classList.add('draw'));

const loadStart = performance.now();
const loadDuration = 1600;
function tickLoader(t) {
  const pct = Math.min(100, Math.round(((t - loadStart) / loadDuration) * 100));
  loaderPct.textContent = `LOADING  ${String(pct).padStart(3, '0')}%`;
  loaderFill.style.width = pct + '%';
  if (pct < 100) {
    requestAnimationFrame(tickLoader);
  } else {
    setTimeout(() => {
      loader.classList.add('done');
      nav.classList.add('show');
    }, 250);
  }
}
requestAnimationFrame(tickLoader);

/* ---------------------------------------------------------
   Custom cursor (dot + trailing ring)
--------------------------------------------------------- */
if (!liteMode) {
  document.body.classList.add('cursor-active');
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
  });
  window.addEventListener('mouseover', (e) => {
    ring.classList.toggle('hover', !!e.target.closest('[data-hover]'));
  });
  (function raf() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(raf);
  })();
} else {
  document.getElementById('cursorDot').style.display = 'none';
  document.getElementById('cursorRing').style.display = 'none';
}

/* ---------------------------------------------------------
   Magnetic buttons
--------------------------------------------------------- */
if (!liteMode) {
  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = 'translate(0,0)'; });
  });
}

/* ---------------------------------------------------------
   Hero 3D scene — chrome "N" monolith (Three.js, vanilla)
--------------------------------------------------------- */
const heroCanvas = document.getElementById('heroCanvas');
if (liteMode) {
  heroCanvas.style.display = 'none';
} else {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070a);
  scene.fog = new THREE.Fog(0x05070a, 8, 16);

  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0, 7);

  const renderer = new THREE.WebGLRenderer({ canvas: heroCanvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(innerWidth, innerHeight);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  const spot = new THREE.SpotLight(0xf5f6f8, 60, 20, 0.5, 0.6);
  spot.position.set(4, 6, 5);
  scene.add(spot);
  const redPoint = new THREE.PointLight(0xe4133c, 25, 12);
  redPoint.position.set(-4, -1, -3);
  scene.add(redPoint);

  // Grid floor
  const grid = new THREE.GridHelper(40, 40, 0xe4133c, 0x1a1d24);
  grid.position.y = -2.4;
  scene.add(grid);

  // Build an extruded "N" shape
  function buildNGeometry() {
    const shape = new THREE.Shape();
    const w = 1.1, H = 3.2, W = 2.2;
    shape.moveTo(-W / 2, -H / 2);
    shape.lineTo(-W / 2 + w, -H / 2);
    shape.lineTo(W / 2 - w, H / 2 - w * 1.4);
    shape.lineTo(W / 2 - w, -H / 2);
    shape.lineTo(W / 2, -H / 2);
    shape.lineTo(W / 2, H / 2);
    shape.lineTo(W / 2 - w, H / 2);
    shape.lineTo(-W / 2 + w, -H / 2 + w * 1.4);
    shape.lineTo(-W / 2 + w, H / 2);
    shape.lineTo(-W / 2, H / 2);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.55, bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.045, bevelSegments: 6, curveSegments: 12,
    });
    geo.center();
    return geo;
  }

  const nMesh = new THREE.Mesh(
    buildNGeometry(),
    new THREE.MeshStandardMaterial({ color: 0xc7cdd6, metalness: 1, roughness: 0.18 })
  );
  nMesh.castShadow = true;
  scene.add(nMesh);

  // Simple reflective-feel environment via a large inverted sphere gradient
  const envGeo = new THREE.SphereGeometry(30, 32, 32);
  const envMat = new THREE.MeshBasicMaterial({ color: 0x0b0d12, side: THREE.BackSide });
  scene.add(new THREE.Mesh(envGeo, envMat));

  let pointerX = 0, pointerY = 0;
  window.addEventListener('mousemove', (e) => {
    pointerX = (e.clientX / innerWidth) * 2 - 1;
    pointerY = (e.clientY / innerHeight) * 2 - 1;
  });

  let floatT = 0;
  function animate() {
    floatT += 0.01;
    nMesh.rotation.y += 0.0035;
    nMesh.rotation.x += ((pointerY * 0.3) - nMesh.rotation.x) * 0.04;
    nMesh.rotation.z += ((-pointerX * 0.15) - nMesh.rotation.z) * 0.04;
    nMesh.position.y = Math.sin(floatT) * 0.15;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
}

/* ---------------------------------------------------------
   Scroll reveals (IntersectionObserver, replaces whileInView)
--------------------------------------------------------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.25 }
);
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

/* ---------------------------------------------------------
   Data: projects, skills, showcase strip, testimonials
   Placeholder content — see comments for what to swap.
--------------------------------------------------------- */
const projects = [
  { title: 'Velocity — EV Brand System', category: 'Branding / Motion', year: '2025',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80',
    problem: 'A new EV manufacturer needed a visual identity that felt as engineered as the product — most automotive branding at the time leaned soft and lifestyle-driven.',
    solution: 'Built a kinetic identity system around a single geometric mark, a condensed type family, and a motion language borrowed from wind-tunnel diagrams and HUD interfaces.',
    result: 'System shipped across showroom, app, and launch film; adopted as the template for three subsequent regional sub-brands.' },
  { title: 'Monolith — Architecture Studio', category: 'Identity / Print', year: '2024',
    image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&q=80',
    problem: "The studio's previous identity read as generic minimalism and didn't differentiate them from competitors in pitch decks.",
    solution: 'Developed a brutalist-influenced mark and a modular grid system referencing structural blueprints, paired with a restrained monochrome palette.',
    result: 'Win rate on RFPs increased following rollout; identity featured in two design annuals.' },
  { title: 'Nightshift — Streaming Platform', category: 'UI / Brand', year: '2024',
    image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&q=80',
    problem: 'A late-night streaming app needed an identity that worked equally well as a dark-mode UI and a stand-alone brand mark.',
    solution: 'Designed a single-color neon system tuned specifically for OLED displays, with a custom icon set built on a strict 4px grid.',
    result: 'Identity carried through launch marketing and the in-app UI without a single deviation from the design tokens.' },
  { title: 'Cast — Manufacturing Rebrand', category: 'Branding / Packaging', year: '2023',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&q=80',
    problem: 'A decades-old metal fabrication company needed to modernize without losing the industrial credibility their name carried.',
    solution: "Kept the original wordmark's bones but rebuilt it in a precision-cut condensed face, and introduced a chrome-and-red palette across packaging and signage.",
    result: 'Rebrand rolled out across 40+ facilities; internal survey showed strong staff approval of the update.' },
];

const skillsList = ['Photoshop', 'Illustrator', 'InDesign', 'After Effects', 'Blender', 'Cinema 4D', 'Figma', 'Premiere Pro'];

const stripItems = [
  { src: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=900&q=80', label: 'Render Study 01' },
  { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=900&q=80', label: 'Type Exploration' },
  { src: 'https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=900&q=80', label: 'Packaging Concept' },
  { src: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=900&q=80', label: 'Motion Frame' },
  { src: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=900&q=80', label: 'Surface Study' },
];

const quotes = [
  { quote: 'Narayan treats every deliverable like it has to survive a wind tunnel. The precision shows in the final work every time.', author: 'Creative Director, Velocity' },
  { quote: "We came in expecting a logo refresh and left with an entire visual language. Genuinely transformative for the brand.", author: 'Founder, Monolith Studio' },
  { quote: "The tightest design handoff we've ever received — zero ambiguity, every token documented.", author: 'Product Lead, Nightshift' },
];

const logos = ['VELOCITY', 'MONOLITH', 'NIGHTSHIFT', 'CAST&CO', 'ORBITAL', 'FERRO'];

/* ---------------------------------------------------------
   Render: Projects grid
--------------------------------------------------------- */
const projectGrid = document.getElementById('projectGrid');
projects.forEach((p, i) => {
  const card = document.createElement('div');
  card.className = 'project-card reveal';
  card.setAttribute('data-hover', '');
  card.innerHTML = `
    <img src="${p.image}" alt="${p.title}" loading="lazy" />
    <div class="project-scrim"></div>
    <div class="project-tint"></div>
    <div class="project-num">${String(i + 1).padStart(2, '0')}</div>
    <div class="project-meta">
      <div class="kicker">${p.category}</div>
      <h3>${p.title}</h3>
    </div>`;
  card.addEventListener('click', () => openModal(p));
  if (!liteMode) {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateX(${(-py * 10).toFixed(2)}deg) rotateY(${(px * 12).toFixed(2)}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = 'perspective(900px) rotateX(0) rotateY(0)'; });
  }
  projectGrid.appendChild(card);
  revealObserver.observe(card);
});

/* Modal */
const modalBackdrop = document.getElementById('modalBackdrop');
const modalImg = document.getElementById('modalImg');
const modalMeta = document.getElementById('modalMeta');
const modalTitle = document.getElementById('modalTitle');
const modalProblem = document.getElementById('modalProblem');
const modalSolution = document.getElementById('modalSolution');
const modalResult = document.getElementById('modalResult');

function openModal(p) {
  modalImg.src = p.image;
  modalImg.alt = p.title;
  modalMeta.textContent = `${p.category} — ${p.year}`;
  modalTitle.textContent = p.title;
  modalProblem.textContent = p.problem;
  modalSolution.textContent = p.solution;
  modalResult.textContent = p.result;
  modalBackdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  modalBackdrop.classList.remove('open');
  document.body.style.overflow = '';
}
document.getElementById('modalClose').addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

/* ---------------------------------------------------------
   Render: Skills marquee + grid
--------------------------------------------------------- */
const skillsMarquee = document.getElementById('skillsMarquee');
[...skillsList, ...skillsList].forEach((s) => {
  const span = document.createElement('span');
  span.textContent = s;
  skillsMarquee.appendChild(span);
});
if (liteMode) skillsMarquee.style.animation = 'none';

const skillGrid = document.getElementById('skillGrid');
skillsList.forEach((s, i) => {
  const card = document.createElement('div');
  card.className = 'skill-card reveal';
  card.setAttribute('data-hover', '');
  card.innerHTML = `<span class="skill-num">${String(i + 1).padStart(2, '0')}</span><span class="skill-name">${s}</span>`;
  skillGrid.appendChild(card);
  revealObserver.observe(card);
});

/* ---------------------------------------------------------
   Render: Showcase strip (scroll-linked horizontal parallax)
--------------------------------------------------------- */
const stripTrack = document.getElementById('stripTrack');
stripItems.forEach((item) => {
  const el = document.createElement('div');
  el.className = 'strip-item';
  el.innerHTML = `
    <img src="${item.src}" alt="${item.label}" loading="lazy" />
    <div class="strip-scrim"></div>
    <div class="strip-label">${item.label}</div>`;
  stripTrack.appendChild(el);
});

const showcaseSection = document.getElementById('showcase');
if (!liteMode) {
  function updateStripParallax() {
    const rect = showcaseSection.getBoundingClientRect();
    const vh = innerHeight;
    // progress: 0 when section top hits bottom of viewport, 1 when bottom hits top
    const total = rect.height + vh;
    const progress = Math.min(1, Math.max(0, (vh - rect.top) / total));
    const shift = -28 * progress + 4; // matches the -28%/4% range from the React version
    stripTrack.style.transform = `translateX(${shift}%)`;
    requestAnimationFrame(updateStripParallax);
  }
  requestAnimationFrame(updateStripParallax);
}

/* ---------------------------------------------------------
   Render: Testimonials (fading pull-quotes) + logo marquee
--------------------------------------------------------- */
const quoteBox = document.getElementById('quoteBox');
let quoteIndex = 0;
function renderQuote() {
  quoteBox.innerHTML = '';
  const el = document.createElement('div');
  el.className = 'quote';
  el.innerHTML = `&ldquo;${quotes[quoteIndex].quote}&rdquo;<div class="quote-author">${quotes[quoteIndex].author}</div>`;
  quoteBox.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
}
renderQuote();
setInterval(() => {
  quoteIndex = (quoteIndex + 1) % quotes.length;
  renderQuote();
}, 4500);

const logoMarquee = document.getElementById('logoMarquee');
[...logos, ...logos].forEach((l) => {
  const span = document.createElement('span');
  span.textContent = l;
  logoMarquee.appendChild(span);
});
if (liteMode) logoMarquee.style.animation = 'none';

/* ---------------------------------------------------------
   Contact form (placeholder submit handler)
--------------------------------------------------------- */
const contactForm = document.getElementById('contactForm');
const submitLabel = document.getElementById('submitLabel');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  // Placeholder submit handler — wire up to Formspree, Resend, etc.
  submitLabel.textContent = 'Sending…';
  contactForm.querySelector('button').disabled = true;
  setTimeout(() => { submitLabel.textContent = 'Sent ✓'; }, 900);
});

/* ---------------------------------------------------------
   Footer back-to-top + year
--------------------------------------------------------- */
document.getElementById('year').textContent = new Date().getFullYear();
document.getElementById('backTop').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
