/**
 * Cinematic WebGL 3D AI Digital Universe Engine
 * Powered by Three.js
 * Features scroll-driven camera paths, section constellations, and activity sleep loops
 */
document.addEventListener('DOMContentLoaded', () => {
  initThreeScene();
});

function initThreeScene() {
  const container = document.querySelector('.ai-3d-scene');
  if (!container) return;

  const isMobile = window.innerWidth < 768;

  // Accessibility Check: Disable WebGL updates if prefers-reduced-motion is active
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    container.innerHTML = '<div class="orb-core" style="box-shadow: 0 0 45px var(--accent); width: 120px; height: 120px; border-radius: 50%; background: var(--grad-accent); margin: auto;"></div>';
    return;
  }

  // 1. Create Scene, Camera, and WebGL Renderer
  const scene = new THREE.Scene();
  
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 6);

  // 2. Ambient & Point Lighting systems
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.65);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  let themeColor = getActiveThemeColor();
  const pointLight = new THREE.PointLight(themeColor, 2, 15);
  scene.add(pointLight);

  // Material Arrays for theme syncs
  const syncMaterials = [];

  // Helper: Create sync materials
  function createSyncMaterial(options) {
    const mat = new THREE.MeshPhysicalMaterial(Object.assign({
      color: themeColor,
      roughness: 0.2,
      metalness: 0.8,
      transparent: true,
      opacity: 0.8
    }, options));
    syncMaterials.push(mat);
    return mat;
  }

  // 3. CONSTRUCT 3D CONSTELLATIONS & STRUCTURES
  // ─── Destination A: Hero Landing Zone (y = 0) ───
  const heroGroup = new THREE.Group();
  heroGroup.position.set(isMobile ? 0 : 2, 0, 0);

  const coreGeo = new THREE.SphereGeometry(0.7, 32, 32);
  const coreMat = createSyncMaterial({
    emissive: themeColor,
    emissiveIntensity: 1.5,
    roughness: 0.1,
    transmission: 0.6,
    thickness: 0.5
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  heroGroup.add(coreMesh);

  const outerRingGeo = new THREE.TorusGeometry(1.4, 0.03, 16, 100);
  const ringMat = createSyncMaterial({ metalness: 0.95 });
  const outerRing = new THREE.Mesh(outerRingGeo, ringMat);
  heroGroup.add(outerRing);

  const innerRingGeo = new THREE.TorusGeometry(1.0, 0.02, 16, 100);
  const innerRing = new THREE.Mesh(innerRingGeo, ringMat);
  innerRing.rotation.x = Math.PI / 3;
  heroGroup.add(innerRing);
  scene.add(heroGroup);

  // ─── Destination B: About Knowledge Chamber (y = -3) ───
  const aboutGroup = new THREE.Group();
  aboutGroup.position.set(isMobile ? -0.5 : -2.5, -3, 0);

  const platformGeo = new THREE.BoxGeometry(2.0, 0.05, 2.0);
  const platformMat = createSyncMaterial({
    roughness: 0.1,
    transmission: 0.9,
    thickness: 1.0,
    opacity: 0.4
  });
  const platform = new THREE.Mesh(platformGeo, platformMat);
  aboutGroup.add(platform);

  const floatingSphereGeo = new THREE.SphereGeometry(0.3, 16, 16);
  const floatingSphere = new THREE.Mesh(floatingSphereGeo, coreMat);
  floatingSphere.position.set(0, 0.6, 0);
  aboutGroup.add(floatingSphere);
  scene.add(aboutGroup);

  // ─── Destination C: Skills Technology Lab (y = -6) ───
  const skillsGroup = new THREE.Group();
  skillsGroup.position.set(isMobile ? 0.5 : 2.2, -6, 0);

  // Constellation Graph Nodes
  const nodeCount = 6;
  const nodes = [];
  const nodeGeo = new THREE.SphereGeometry(0.12, 16, 16);
  
  for (let i = 0; i < nodeCount; i++) {
    const node = new THREE.Mesh(nodeGeo, coreMat);
    const angle = (i / nodeCount) * Math.PI * 2;
    const r = 0.9 + Math.random() * 0.3;
    node.position.set(Math.cos(angle) * r, (Math.random() - 0.5) * 0.6, Math.sin(angle) * r);
    skillsGroup.add(node);
    nodes.push(node);
  }

  // Draw node connection links
  const linksGeo = new THREE.BufferGeometry();
  const linkPositions = [];
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      if (Math.random() > 0.35) {
        linkPositions.push(nodes[i].position.x, nodes[i].position.y, nodes[i].position.z);
        linkPositions.push(nodes[j].position.x, nodes[j].position.y, nodes[j].position.z);
      }
    }
  }
  linksGeo.setAttribute('position', new THREE.Float32BufferAttribute(linkPositions, 3));
  const linkMat = new THREE.LineBasicMaterial({ color: themeColor, transparent: true, opacity: 0.45 });
  const constellationLines = new THREE.LineSegments(linksGeo, linkMat);
  skillsGroup.add(constellationLines);
  scene.add(skillsGroup);

  // ─── Destination D: Projects Innovation Gallery (y = -9) ───
  const projectsGroup = new THREE.Group();
  projectsGroup.position.set(isMobile ? -0.4 : -2, -9, 0);

  const boxCount = 3;
  const boxes = [];
  const boxGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
  
  for (let i = 0; i < boxCount; i++) {
    const box = new THREE.Mesh(boxGeo, platformMat);
    box.position.set((i - 1) * 1.0, 0, (Math.random() - 0.5) * 0.4);
    projectsGroup.add(box);
    boxes.push(box);
  }
  scene.add(projectsGroup);

  // ─── Destination E: Experience/Education Corridor (y = -12) ───
  const corridorGroup = new THREE.Group();
  corridorGroup.position.set(0, -12, 0);

  const corridorGeo = new THREE.TorusGeometry(1.6, 0.02, 8, 4);
  const corridorRing1 = new THREE.Mesh(corridorGeo, ringMat);
  corridorRing1.rotation.x = Math.PI / 2;
  corridorGroup.add(corridorRing1);

  const corridorRing2 = corridorRing1.clone();
  corridorRing2.position.z = -1.5;
  corridorGroup.add(corridorRing2);

  const corridorRing3 = corridorRing1.clone();
  corridorRing3.position.z = -3.0;
  corridorGroup.add(corridorRing3);
  scene.add(corridorGroup);

  // ─── Destination F: Contact Communication Hub (y = -15) ───
  const contactGroup = new THREE.Group();
  contactGroup.position.set(isMobile ? 0.3 : 1.5, -15, 0);

  const finalCore = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 32), platformMat);
  contactGroup.add(finalCore);
  scene.add(contactGroup);

  // 4. Swirling Sparks particles (Universal Energy Mist)
  const particleCount = 180;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const speeds = [];

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20; // Spread vertically across all sections
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    speeds.push({
      vx: (Math.random() - 0.5) * 0.005,
      vy: 0.005 + Math.random() * 0.01,
      vz: (Math.random() - 0.5) * 0.005
    });
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: themeColor,
    size: 0.04,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending
  });
  const sparksCloud = new THREE.Points(particleGeo, particleMat);
  scene.add(sparksCloud);

  // 5. Scroll-driven Camera path bindings
  let scrollProgress = 0;
  let targetCameraY = 0;
  let targetCameraX = 0;
  let scrollBurstSpeed = 0; // Speed burst factor on scroll delta update

  window.addEventListener('scroll', () => {
    const scrollHeight = document.body.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    
    const prevScrollProgress = scrollProgress;
    scrollProgress = window.scrollY / scrollHeight;

    // Detect fast scroll burst energy
    const deltaScroll = Math.abs(scrollProgress - prevScrollProgress);
    scrollBurstSpeed = Math.min(2.5, scrollBurstSpeed + deltaScroll * 25);

    // Map scroll values to specific coordinates path
    targetCameraY = -scrollProgress * 15;

    // Map sections camera sways (sways left/right as user scrolls past sections)
    if (isMobile) {
      targetCameraX = 0; // Keep camera centered on mobile
    } else {
      if (scrollProgress < 0.18) {
        targetCameraX = scrollProgress * 1.5; // Sway right
      } else if (scrollProgress < 0.38) {
        targetCameraX = -1.8; // Sway left for About platform
      } else if (scrollProgress < 0.58) {
        targetCameraX = 1.6; // Sway right for Skills graph
      } else if (scrollProgress < 0.78) {
        targetCameraX = -1.5; // Sway left for Projects
      } else {
        targetCameraX = 0.5; // Centering for Corridor & Contact
      }
    }
  });

  // 6. Proximity attraction offsets LERP tracking
  let mouseX = 0;
  let mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;
    resetInactivityTimer();
  });

  // 7. Activity & Inactivity timers
  let isIdle = false;
  let idleTime = 0;
  let inactivityFactor = 0; // LERP value from 0 (awake) to 1 (sleep)

  function resetInactivityTimer() {
    isIdle = false;
    idleTime = 0;
  }

  // 8. Visual render loop ticks
  let floatTime = 0;
  let isSceneVisible = true;

  function animate() {
    if (!isSceneVisible) return;
    requestAnimationFrame(animate);

    floatTime += 0.015;
    idleTime += 0.015;

    // Update inactivity status
    if (idleTime > 4.0) {
      isIdle = true;
    }
    
    // LERP inactivity factor
    if (isIdle) {
      inactivityFactor = Math.min(1.0, inactivityFactor + 0.01);
    } else {
      inactivityFactor = Math.max(0.0, inactivityFactor - 0.05);
    }

    // Slowly decay scroll speed burst factor
    scrollBurstSpeed = Math.max(0.0, scrollBurstSpeed - 0.03);

    // Damping and interpolating camera position path
    camera.position.y += (targetCameraY - camera.position.y) * 0.06;
    camera.position.x += ((targetCameraX + mouseX * 1.2) - camera.position.x) * 0.06;
    camera.position.z += ((5.5 - mouseY * 0.8) - camera.position.z) * 0.06;

    // Apply lookAt adjustments based on position
    camera.lookAt(camera.position.x * 0.6, camera.position.y, camera.position.z - 6);

    // Pulse core spheres based on mouse proximity and activity levels
    const speedMultiplier = (1.0 - inactivityFactor * 0.7) * (1.0 + scrollBurstSpeed * 1.5);
    
    // Animate Core Orb
    coreMesh.rotation.y += 0.005 * speedMultiplier;
    const pulse = 1.0 + Math.sin(floatTime * 2.0) * 0.06;
    coreMesh.scale.set(pulse, pulse, pulse);
    outerRing.rotation.y += 0.006 * speedMultiplier;
    outerRing.rotation.x += 0.003 * speedMultiplier;
    innerRing.rotation.y -= 0.008 * speedMultiplier;

    // Animate About float sphere
    floatingSphere.position.y = -3.0 + 0.6 + Math.sin(floatTime * 2.0) * 0.08;
    floatingSphere.rotation.y += 0.008 * speedMultiplier;

    // Animate Skills constellation nodes
    nodes.forEach((n, idx) => {
      n.position.y += Math.sin(floatTime + idx) * 0.002 * speedMultiplier;
      n.rotation.y += 0.01 * speedMultiplier;
    });

    // Animate Projects boxes
    boxes.forEach((b, idx) => {
      b.rotation.y += 0.004 * (idx + 1) * speedMultiplier;
      b.rotation.x += 0.002 * (idx + 1) * speedMultiplier;
      b.position.y = Math.sin(floatTime + idx) * 0.05;
    });

    // Animate corridor rings
    corridorRing1.rotation.z += 0.002 * speedMultiplier;
    corridorRing2.rotation.z -= 0.003 * speedMultiplier;
    corridorRing3.rotation.z += 0.001 * speedMultiplier;

    // Point light tracking camera coordinates
    pointLight.position.set(camera.position.x, camera.position.y, camera.position.z - 2);
    pointLight.intensity = (2.0 - inactivityFactor * 1.2) * (1.0 + scrollBurstSpeed * 0.8);

    // Drifting particles updates
    const posArr = sparksCloud.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      // Apply speed translations
      posArr[i * 3 + 1] -= speeds[i].vy * speedMultiplier; // Drift downwards
      posArr[i * 3] += speeds[i].vx * speedMultiplier;
      posArr[i * 3 + 2] += speeds[i].vz * speedMultiplier;

      // Re-boundary bounds when particles scroll out vertically
      if (posArr[i * 3 + 1] < -18.0) {
        posArr[i * 3 + 1] = 2.0;
        posArr[i * 3] = (Math.random() - 0.5) * 12;
      }
    }
    sparksCloud.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }

  // 9. Watch theme state switches to transition color dynamically
  const themeObserver = new MutationObserver(() => {
    const newColor = getActiveThemeColor();
    const hex = parseInt(newColor.replace('#', '0x'));
    
    pointLight.color.setHex(hex);
    particleMat.color.setHex(hex);
    linkMat.color.setHex(hex);

    syncMaterials.forEach(mat => {
      mat.color.setHex(hex);
      if (mat.emissive) mat.emissive.setHex(hex);
    });
  });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // 10. Resizing handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // 11. Viewport Optimization: IntersectionObserver
  const visibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isSceneVisible = entry.isIntersecting;
      if (isSceneVisible) {
        animate();
      }
    });
  }, { threshold: 0.05 });
  visibilityObserver.observe(container);

  // Helpers
  function getActiveThemeColor() {
    const isLight = document.body.classList.contains('theme-light');
    return isLight ? '#0088cc' : '#ff0033';
  }
}
