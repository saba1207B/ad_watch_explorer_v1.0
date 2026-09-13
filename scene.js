import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ============================================================
   STATE
   ============================================================ */
let scene, camera, renderer, controls;
let envMap = null;

// Layer groups: { group, baseY, meshes[], visible }
const layers = [];
const LAYER_NAMES = ['movement', 'dial', 'case', 'crystal'];

// Animation state
let spreadValue = 0;
let targetSpread = 0;
let animationSpeed = 1;
let highlightedLayer = 0;
let autoRotateEnabled = true;
let autoRotateTime = 0;
let cameraTarget = null; // { position, lookAt } for smooth transitions

// References for animated parts
const gears = [];     // { mesh, speed, axis }
let balanceWheel = null;
let hourHand = null;
let minuteHand = null;
let secondHand = null;

// Materials (will be themed)
const mat = {};

// Theme color configs for Three.js materials
const themeConfigs = {
  frost: {
    metal: 0xc8ccd4, darkMetal: 0x6b7280, dial: 0xf0f0f5,
    hand: 0x2d2d3d, accent: 0x6366f1, crystal: 0xe8eeff,
    ambientColor: 0xd0d5e0, ambientIntensity: 0.7,
    keyIntensity: 1.3, fillIntensity: 0.5,
  },
  'dark-luxury': {
    metal: 0xd4a853, darkMetal: 0x8b7230, dial: 0x1a1818,
    hand: 0xd4a853, accent: 0xd4a853, crystal: 0xfff5e0,
    ambientColor: 0x3d3520, ambientIntensity: 0.4,
    keyIntensity: 1.5, fillIntensity: 0.3,
  },
  midnight: {
    metal: 0x8ba8d4, darkMetal: 0x4a6080, dial: 0x0a0f1e,
    hand: 0xb0c4de, accent: 0x3b82f6, crystal: 0xd0e8ff,
    ambientColor: 0x152040, ambientIntensity: 0.4,
    keyIntensity: 1.4, fillIntensity: 0.3,
  },
  'rose-gold': {
    metal: 0xc8967a, darkMetal: 0x8b6650, dial: 0x1a1212,
    hand: 0xd4a88e, accent: 0xc8967a, crystal: 0xffe8e0,
    ambientColor: 0x2d1a15, ambientIntensity: 0.4,
    keyIntensity: 1.4, fillIntensity: 0.3,
  },
  monochrome: {
    metal: 0xb0b0b0, darkMetal: 0x606060, dial: 0x1a1a1a,
    hand: 0xd0d0d0, accent: 0xa0a0a0, crystal: 0xe8e8e8,
    ambientColor: 0x252525, ambientIntensity: 0.4,
    keyIntensity: 1.3, fillIntensity: 0.4,
  },
};

let currentTheme = 'dark-luxury';

/* ============================================================
   INIT
   ============================================================ */
function init() {
  const container = document.getElementById('viewport');
  if (!container) return;

  // --- Scene ---
  scene = new THREE.Scene();

  // --- Renderer ---
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  // --- Camera ---
  camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.set(6, 4, 8);

  // --- Controls ---
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.target.set(0, 0.8, 0);
  controls.minDistance = 3;
  controls.maxDistance = 20;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.4;

  // --- Environment for reflections ---
  createEnvironment();

  // --- Lighting ---
  setupLighting();

  // --- Materials ---
  createMaterials();

  // --- Watch layers ---
  createMovementCore();
  createDialAndHands();
  createCaseAndBezel();
  createSapphireCrystal();

  // --- Events ---
  window.addEventListener('resize', onResize);

  // --- Start ---
  animate();
}

/* ============================================================
   ENVIRONMENT (for metallic reflections)
   ============================================================ */
function createEnvironment() {
  // Create a simple gradient environment using a PMREMGenerator
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();

  // Gradient hemisphere
  const skyColor = new THREE.Color(0xd0d8e8);
  const groundColor = new THREE.Color(0x404050);
  const hemiLight = new THREE.HemisphereLight(skyColor, groundColor, 1);
  envScene.add(hemiLight);

  // Small emissive sphere to create specular highlights
  const lightSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  lightSphere.position.set(2, 3, 2);
  envScene.add(lightSphere);

  envMap = pmremGenerator.fromScene(envScene, 0.04).texture;
  pmremGenerator.dispose();
  envScene.clear();
}

/* ============================================================
   LIGHTING
   ============================================================ */
function setupLighting() {
  const cfg = themeConfigs[currentTheme];

  const ambient = new THREE.AmbientLight(cfg.ambientColor, cfg.ambientIntensity);
  ambient.name = 'ambient';
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, cfg.keyIntensity);
  key.position.set(5, 10, 5);
  key.name = 'key';
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, cfg.fillIntensity);
  fill.position.set(-4, 3, -4);
  fill.name = 'fill';
  scene.add(fill);

  const point = new THREE.PointLight(0xffffff, 0.5, 15);
  point.position.set(2, 5, 4);
  point.name = 'point';
  scene.add(point);
}

/* ============================================================
   MATERIALS
   ============================================================ */
function createMaterials() {
  const cfg = themeConfigs[currentTheme];

  mat.steel = new THREE.MeshStandardMaterial({
    color: cfg.metal,
    metalness: 0.95,
    roughness: 0.18,
    envMap,
    envMapIntensity: 0.8,
  });

  mat.darkSteel = new THREE.MeshStandardMaterial({
    color: cfg.darkMetal,
    metalness: 0.9,
    roughness: 0.3,
    envMap,
    envMapIntensity: 0.6,
  });

  mat.dial = new THREE.MeshStandardMaterial({
    color: cfg.dial,
    metalness: 0.05,
    roughness: 0.85,
  });

  mat.hand = new THREE.MeshStandardMaterial({
    color: cfg.hand,
    metalness: 0.6,
    roughness: 0.35,
    envMap,
    envMapIntensity: 0.5,
  });

  mat.accent = new THREE.MeshStandardMaterial({
    color: cfg.accent,
    metalness: 0.85,
    roughness: 0.25,
    envMap,
    envMapIntensity: 0.7,
  });

  mat.crystal = new THREE.MeshPhysicalMaterial({
    color: cfg.crystal,
    transmission: 0.92,
    thickness: 0.4,
    roughness: 0.04,
    ior: 1.76,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    envMap,
    envMapIntensity: 0.4,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
  });

  mat.jewel = new THREE.MeshPhysicalMaterial({
    color: 0xcc2244,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.6,
    thickness: 0.3,
    ior: 1.77,
    clearcoat: 1.0,
  });
}

/* ============================================================
   HELPER: Create a gear with teeth
   ============================================================ */
function createGear(radius, teethCount, toothWidth, toothHeight, thickness, material) {
  const group = new THREE.Group();

  // Base disc
  const baseGeom = new THREE.CylinderGeometry(radius, radius, thickness, 48);
  const base = new THREE.Mesh(baseGeom, material);
  group.add(base);

  // Center hole
  const holeGeom = new THREE.CylinderGeometry(radius * 0.15, radius * 0.15, thickness * 1.1, 16);
  const holeMat = mat.darkSteel.clone();
  const hole = new THREE.Mesh(holeGeom, holeMat);
  group.add(hole);

  // Teeth around the perimeter
  for (let i = 0; i < teethCount; i++) {
    const angle = (i / teethCount) * Math.PI * 2;
    const toothGeom = new THREE.BoxGeometry(toothWidth, thickness * 0.9, toothHeight);
    const tooth = new THREE.Mesh(toothGeom, material);
    tooth.position.set(
      Math.cos(angle) * (radius + toothHeight * 0.45),
      0,
      Math.sin(angle) * (radius + toothHeight * 0.45)
    );
    tooth.rotation.y = -angle;
    group.add(tooth);
  }

  return group;
}

/* ============================================================
   LAYER 0: MOVEMENT CORE
   ============================================================ */
function createMovementCore() {
  const group = new THREE.Group();
  group.name = 'movement';

  // Main plate (base)
  const plateGeom = new THREE.CylinderGeometry(1.7, 1.7, 0.04, 64);
  const plate = new THREE.Mesh(plateGeom, mat.darkSteel);
  group.add(plate);

  // Mainspring barrel (center)
  const barrelGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.18, 32);
  const barrel = new THREE.Mesh(barrelGeom, mat.steel);
  barrel.position.y = 0.1;
  group.add(barrel);

  // Barrel cap ring
  const barrelRingGeom = new THREE.TorusGeometry(0.4, 0.03, 8, 32);
  const barrelRing = new THREE.Mesh(barrelRingGeom, mat.accent);
  barrelRing.position.y = 0.19;
  barrelRing.rotation.x = Math.PI / 2;
  group.add(barrelRing);

  // Gear 1: Escape wheel (large)
  const gear1 = createGear(0.55, 20, 0.04, 0.08, 0.035, mat.steel);
  gear1.position.set(0.9, 0.08, 0.3);
  group.add(gear1);
  gears.push({ mesh: gear1, speed: 2.0, axis: 'y' });

  // Gear 2: Third wheel
  const gear2 = createGear(0.4, 16, 0.035, 0.07, 0.03, mat.steel);
  gear2.position.set(-0.7, 0.08, 0.6);
  group.add(gear2);
  gears.push({ mesh: gear2, speed: -1.2, axis: 'y' });

  // Gear 3: Fourth wheel (small)
  const gear3 = createGear(0.28, 12, 0.03, 0.06, 0.025, mat.steel);
  gear3.position.set(0.3, 0.08, -0.8);
  group.add(gear3);
  gears.push({ mesh: gear3, speed: 3.0, axis: 'y' });

  // Balance wheel
  const balanceGeom = new THREE.TorusGeometry(0.5, 0.025, 8, 48);
  const balance = new THREE.Mesh(balanceGeom, mat.accent);
  balance.position.set(-0.5, 0.12, -0.5);
  balance.rotation.x = Math.PI / 2;
  group.add(balance);
  balanceWheel = balance;

  // Balance wheel spoke
  const spokeGeom = new THREE.BoxGeometry(1.0, 0.02, 0.02);
  const spoke = new THREE.Mesh(spokeGeom, mat.accent);
  spoke.position.copy(balance.position);
  group.add(spoke);

  // Jewels (red bearing stones)
  const jewelPositions = [
    [0.9, 0.15, 0.3],
    [-0.7, 0.15, 0.6],
    [0.3, 0.15, -0.8],
    [-0.5, 0.18, -0.5],
    [0, 0.15, 0],
  ];
  jewelPositions.forEach(pos => {
    const jewelGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
    const jewel = new THREE.Mesh(jewelGeom, mat.jewel);
    jewel.position.set(...pos);
    group.add(jewel);
  });

  // Bridge (decorative plate over gears)
  const bridgeGeom = new THREE.BoxGeometry(1.2, 0.025, 0.35);
  const bridge = new THREE.Mesh(bridgeGeom, mat.steel);
  bridge.position.set(0.1, 0.16, 0.45);
  bridge.rotation.y = 0.3;
  group.add(bridge);

  layers.push({ group, baseY: -0.15, meshes: group.children, visible: true });
  scene.add(group);
}

/* ============================================================
   LAYER 1: DIAL & HANDS
   ============================================================ */
function createDialAndHands() {
  const group = new THREE.Group();
  group.name = 'dial';

  // Dial face
  const dialGeom = new THREE.CylinderGeometry(1.8, 1.8, 0.03, 64);
  const dial = new THREE.Mesh(dialGeom, mat.dial);
  group.add(dial);

  // Dial edge ring
  const dialRingGeom = new THREE.TorusGeometry(1.8, 0.02, 8, 64);
  const dialRing = new THREE.Mesh(dialRingGeom, mat.steel);
  dialRing.rotation.x = Math.PI / 2;
  dialRing.position.y = 0.015;
  group.add(dialRing);

  // Hour indices (12 markers)
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const isMainHour = i % 3 === 0;
    const length = isMainHour ? 0.2 : 0.12;
    const width = isMainHour ? 0.05 : 0.025;
    const markerGeom = new THREE.BoxGeometry(width, 0.025, length);
    const marker = new THREE.Mesh(markerGeom, mat.hand);
    const r = 1.55;
    marker.position.set(
      Math.sin(angle) * r,
      0.025,
      -Math.cos(angle) * r
    );
    marker.rotation.y = angle;
    group.add(marker);
  }

  // Minute ticks (60 small marks)
  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) continue; // skip hour positions
    const angle = (i / 60) * Math.PI * 2;
    const tickGeom = new THREE.BoxGeometry(0.01, 0.015, 0.06);
    const tick = new THREE.Mesh(tickGeom, mat.darkSteel);
    tick.position.set(
      Math.sin(angle) * 1.6,
      0.02,
      -Math.cos(angle) * 1.6
    );
    tick.rotation.y = angle;
    group.add(tick);
  }

  // Center post
  const postGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.12, 16);
  const post = new THREE.Mesh(postGeom, mat.steel);
  post.position.y = 0.06;
  group.add(post);

  // Hour hand
  const hourGeom = new THREE.BoxGeometry(0.065, 0.02, 0.85);
  hourHand = new THREE.Mesh(hourGeom, mat.hand);
  hourHand.geometry.translate(0, 0, -0.35); // pivot from end
  hourHand.position.y = 0.08;
  group.add(hourHand);

  // Minute hand
  const minuteGeom = new THREE.BoxGeometry(0.045, 0.018, 1.2);
  minuteHand = new THREE.Mesh(minuteGeom, mat.hand);
  minuteHand.geometry.translate(0, 0, -0.5);
  minuteHand.position.y = 0.1;
  group.add(minuteHand);

  // Second hand
  const secondGeom = new THREE.BoxGeometry(0.015, 0.012, 1.5);
  secondHand = new THREE.Mesh(secondGeom, mat.accent);
  secondHand.geometry.translate(0, 0, -0.55);
  secondHand.position.y = 0.12;
  group.add(secondHand);

  // Second hand counterweight
  const counterGeom = new THREE.CircleGeometry(0.05, 16);
  const counter = new THREE.Mesh(counterGeom, mat.accent);
  counter.rotation.x = -Math.PI / 2;
  counter.position.set(0, 0.125, 0.2);
  secondHand.add(counter); // attach to second hand so it rotates together

  layers.push({ group, baseY: 0, meshes: group.children, visible: true });
  scene.add(group);
}

/* ============================================================
   LAYER 2: CASE & BEZEL
   ============================================================ */
function createCaseAndBezel() {
  const group = new THREE.Group();
  group.name = 'case';

  // Main case body (thick ring)
  const caseGeom = new THREE.TorusGeometry(2.0, 0.2, 16, 64);
  const caseMesh = new THREE.Mesh(caseGeom, mat.steel);
  caseMesh.rotation.x = Math.PI / 2;
  group.add(caseMesh);

  // Bezel (top ring, slightly larger)
  const bezelGeom = new THREE.TorusGeometry(2.0, 0.12, 12, 64);
  const bezel = new THREE.Mesh(bezelGeom, mat.steel);
  bezel.rotation.x = Math.PI / 2;
  bezel.position.y = 0.18;
  group.add(bezel);

  // Fluted bezel detail (small ridges around)
  for (let i = 0; i < 40; i++) {
    const angle = (i / 40) * Math.PI * 2;
    const fluteGeom = new THREE.BoxGeometry(0.02, 0.1, 0.04);
    const flute = new THREE.Mesh(fluteGeom, mat.darkSteel);
    flute.position.set(
      Math.cos(angle) * 2.12,
      0.18,
      Math.sin(angle) * 2.12
    );
    flute.rotation.y = -angle;
    group.add(flute);
  }

  // Crown (at 3 o'clock)
  const crownGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.35, 16);
  const crown = new THREE.Mesh(crownGeom, mat.steel);
  crown.rotation.z = Math.PI / 2;
  crown.position.set(2.4, 0.05, 0);
  group.add(crown);

  // Crown guard (top)
  const guardGeom1 = new THREE.BoxGeometry(0.2, 0.12, 0.1);
  const guard1 = new THREE.Mesh(guardGeom1, mat.steel);
  guard1.position.set(2.25, 0.05, 0.15);
  group.add(guard1);

  // Crown guard (bottom)
  const guard2 = new THREE.Mesh(guardGeom1.clone(), mat.steel);
  guard2.position.set(2.25, 0.05, -0.15);
  group.add(guard2);

  // Crown knurling (ridges)
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const kGeom = new THREE.BoxGeometry(0.015, 0.35, 0.015);
    const k = new THREE.Mesh(kGeom, mat.darkSteel);
    k.rotation.z = Math.PI / 2;
    k.position.set(
      2.4,
      0.05 + Math.sin(angle) * 0.1,
      Math.cos(angle) * 0.1
    );
    group.add(k);
  }

  // Lugs (4 lugs at 12 and 6 o'clock)
  const lugGeom = new THREE.BoxGeometry(0.35, 0.18, 0.6);
  const lugPositions = [
    { x: 0.55, z: -2.1 },
    { x: -0.55, z: -2.1 },
    { x: 0.55, z: 2.1 },
    { x: -0.55, z: 2.1 },
  ];
  lugPositions.forEach(pos => {
    const lug = new THREE.Mesh(lugGeom, mat.steel);
    lug.position.set(pos.x, 0, pos.z);
    group.add(lug);
  });

  // Case back (bottom ring)
  const caseBackGeom = new THREE.CylinderGeometry(1.9, 1.9, 0.04, 64);
  const caseBack = new THREE.Mesh(caseBackGeom, mat.darkSteel);
  caseBack.position.y = -0.2;
  group.add(caseBack);

  layers.push({ group, baseY: 0.0, meshes: group.children, visible: true });
  scene.add(group);
}

/* ============================================================
   LAYER 3: SAPPHIRE CRYSTAL
   ============================================================ */
function createSapphireCrystal() {
  const group = new THREE.Group();
  group.name = 'crystal';

  // Dome (flattened hemisphere)
  const domeGeom = new THREE.SphereGeometry(1.85, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2);
  const dome = new THREE.Mesh(domeGeom, mat.crystal);
  dome.scale.y = 0.08;
  dome.position.y = 0.0;
  group.add(dome);

  // Flat bottom disc (seals the dome)
  const discGeom = new THREE.CircleGeometry(1.85, 64);
  const disc = new THREE.Mesh(discGeom, mat.crystal);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.0;
  group.add(disc);

  // Crystal edge gasket ring
  const gasketGeom = new THREE.TorusGeometry(1.86, 0.02, 8, 64);
  const gasketMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.3,
    roughness: 0.8,
  });
  const gasket = new THREE.Mesh(gasketGeom, gasketMat);
  gasket.rotation.x = Math.PI / 2;
  gasket.position.y = 0.0;
  group.add(gasket);

  // Cyclops lens (magnifier at 3 o'clock / date position)
  const cyclopsGeom = new THREE.SphereGeometry(0.15, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const cyclops = new THREE.Mesh(cyclopsGeom, mat.crystal);
  cyclops.scale.y = 0.3;
  cyclops.position.set(0, 0.02, -1.05);
  group.add(cyclops);

  layers.push({ group, baseY: 0.15, meshes: group.children, visible: true });
  scene.add(group);
}

/* ============================================================
   ANIMATION LOOP
   ============================================================ */
function animate() {
  requestAnimationFrame(animate);

  const dt = 0.016; // ~60fps assumed delta

  // --- Smooth spread interpolation ---
  spreadValue += (targetSpread - spreadValue) * 0.06;
  updateLayerPositions();

  // --- Animate gears ---
  const gearSpeed = dt * animationSpeed;
  gears.forEach(g => {
    g.mesh.rotation.y += g.speed * gearSpeed;
  });

  // --- Balance wheel oscillation ---
  if (balanceWheel) {
    const t = performance.now() * 0.003 * animationSpeed;
    balanceWheel.rotation.z = Math.sin(t * 4) * 0.4;
    // Also rotate the spoke attached at the same position
    const spoke = balanceWheel.parent?.children.find(
      c => c.geometry?.type === 'BoxGeometry' &&
           Math.abs(c.position.x - balanceWheel.position.x) < 0.01
    );
    if (spoke) spoke.rotation.y = Math.sin(t * 4) * 0.4;
  }

  // --- Animate watch hands (real time) ---
  animateHands();

  // --- Auto rotate ---
  if (autoRotateEnabled) {
    autoRotateTime += dt * 0.3;
    // Gentle vertical drift
    const driftY = Math.sin(autoRotateTime * 0.5) * 0.5 + 4;
    const driftDist = camera.position.length();
    if (!cameraTarget) {
      // Only apply drift if not transitioning to a preset
      camera.position.y += (driftY - camera.position.y) * 0.01;
    }
    controls.autoRotate = true;
  } else {
    controls.autoRotate = false;
  }

  // --- Camera smooth transition ---
  if (cameraTarget) {
    const posTarget = new THREE.Vector3(...cameraTarget.position);
    const lookTarget = new THREE.Vector3(...cameraTarget.lookAt);
    camera.position.lerp(posTarget, 0.04);
    controls.target.lerp(lookTarget, 0.04);
    if (camera.position.distanceTo(posTarget) < 0.05) {
      cameraTarget = null;
    }
  }

  // --- Update controls ---
  controls.update();

  // --- Render ---
  renderer.render(scene, camera);
}

/* ============================================================
   UPDATE HELPERS
   ============================================================ */
function updateLayerPositions() {
  layers.forEach((layer, i) => {
    const targetY = layer.baseY + i * spreadValue * 2.0;
    layer.group.position.y = targetY;
  });
}

function animateHands() {
  const now = new Date();
  const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
  const minutes = now.getMinutes() + seconds / 60;
  const hours = (now.getHours() % 12) + minutes / 60;

  if (secondHand) {
    // Smooth sweep (mechanical watch style)
    secondHand.rotation.y = -(seconds / 60) * Math.PI * 2;
  }
  if (minuteHand) {
    minuteHand.rotation.y = -(minutes / 60) * Math.PI * 2;
  }
  if (hourHand) {
    hourHand.rotation.y = -(hours / 12) * Math.PI * 2;
  }
}

function onResize() {
  const container = document.getElementById('viewport');
  if (!container || !camera || !renderer) return;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

/* ============================================================
   PUBLIC API (exposed to ui.js via window.watchScene)
   ============================================================ */
window.watchScene = {
  /**
   * Set the exploded-view spread factor.
   * @param {number} value 0–1 normalized
   */
  setSpread(value) {
    targetSpread = value;
  },

  /**
   * Toggle visibility of a specific layer.
   * @param {number} index 0–3
   * @param {boolean} visible
   */
  setLayerVisible(index, visible) {
    if (layers[index]) {
      layers[index].visible = visible;
      layers[index].group.visible = visible;
    }
  },

  /**
   * Highlight (glow) a specific layer; -1 for none.
   * @param {number} index -1 to 3
   */
  highlightLayer(index) {
    // Remove previous highlight
    layers.forEach((layer, i) => {
      layer.group.traverse(child => {
        if (child.isMesh && child.material) {
          const m = child.material;
          if (m.emissive) {
            m.emissive.setHex(0x000000);
            m.emissiveIntensity = 0;
          }
        }
      });
    });

    // Apply highlight to selected layer
    if (index >= 0 && index < layers.length) {
      highlightedLayer = index;
      const cfg = themeConfigs[currentTheme];
      const glowColor = new THREE.Color(cfg.accent);
      layers[index].group.traverse(child => {
        if (child.isMesh && child.material && child.material.emissive) {
          child.material.emissive.copy(glowColor);
          child.material.emissiveIntensity = 0.15;
        }
      });
    } else {
      highlightedLayer = -1;
    }
  },

  /**
   * Toggle auto-rotate.
   * @param {boolean} enabled
   */
  setAutoRotate(enabled) {
    autoRotateEnabled = enabled;
    if (!enabled) {
      controls.autoRotate = false;
    }
  },

  /**
   * Set animation speed multiplier.
   * @param {number} speed 0–2
   */
  setAnimationSpeed(speed) {
    animationSpeed = speed;
  },

  /**
   * Switch the color theme.
   * @param {string} name theme name
   */
  setTheme(name) {
    if (!themeConfigs[name]) return;
    currentTheme = name;
    const cfg = themeConfigs[name];

    // Update materials
    mat.steel.color.setHex(cfg.metal);
    mat.darkSteel.color.setHex(cfg.darkMetal);
    mat.dial.color.setHex(cfg.dial);
    mat.hand.color.setHex(cfg.hand);
    mat.accent.color.setHex(cfg.accent);
    mat.crystal.color.setHex(cfg.crystal);

    // Update lighting
    const ambient = scene.getObjectByName('ambient');
    if (ambient) {
      ambient.color.setHex(cfg.ambientColor);
      ambient.intensity = cfg.ambientIntensity;
    }
    const key = scene.getObjectByName('key');
    if (key) key.intensity = cfg.keyIntensity;
    const fill = scene.getObjectByName('fill');
    if (fill) fill.intensity = cfg.fillIntensity;

    // Reapply highlight if one is active
    if (highlightedLayer >= 0) {
      window.watchScene.highlightLayer(highlightedLayer);
    }
  },

  /**
   * Animate camera to a preset position.
   * @param {string} preset 'perspective' | 'top' | 'side' | 'front'
   */
  setCameraPreset(preset) {
    const currentSpreadY = spreadValue * 3; // approximate center shift
    const centerY = 0.8 + currentSpreadY;
    const presets = {
      perspective: { position: [6, 4 + currentSpreadY, 8], lookAt: [0, centerY, 0] },
      top:         { position: [0.01, 12 + currentSpreadY * 2, 0.01], lookAt: [0, centerY, 0] },
      side:        { position: [12, centerY, 0], lookAt: [0, centerY, 0] },
      front:       { position: [0, centerY, 12], lookAt: [0, centerY, 0] },
    };
    if (presets[preset]) {
      cameraTarget = presets[preset];
    }
  },

  /** Get current layer visibility states. */
  getLayerVisibility() {
    return layers.map(l => l.visible);
  },

  /**
   * Update camera to track the center of the exploding watch.
   * Called by the scroll-driven UI.
   * @param {number} progress 0–1 scroll progress through explode section
   */
  setScrollProgress(progress) {
    // Center Y of exploding watch rises as layers spread
    const centerY = 0.8 + progress * 2.8;
    controls.target.y += (centerY - controls.target.y) * 0.08;

    // Gentle camera pullback so all layers stay in frame
    const baseY = 4;
    const maxY = 7;
    const desiredCamY = baseY + progress * (maxY - baseY);
    camera.position.y += (desiredCamY - camera.position.y) * 0.04;
  },
};

/* ============================================================
   BOOT
   ============================================================ */
init();
