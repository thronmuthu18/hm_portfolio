/**
 * Minimalist WebGL Particle Constellation Background Engine
 * Powered by Three.js
 * Optimized for OpenAI/Apple-level design simplicity and 60 FPS performance
 */
document.addEventListener('DOMContentLoaded', () => {
  initThreeScene();
});

function initThreeScene() {
  const container = document.querySelector('.ai-3d-scene');
  if (!container) return;

  // Accessibility Check: Disable WebGL updates if prefers-reduced-motion is active
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    container.innerHTML = '<div class="orb-core" style="box-shadow: 0 0 45px var(--accent); width: 80px; height: 80px; border-radius: 50%; background: var(--grad-accent); margin: auto; opacity: 0.15;"></div>';
    return;
  }

  // 1. Create Scene, Camera, and WebGL Renderer (No lights needed for unlit particles)
  const scene = new THREE.Scene();
  
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 5.5);

  // 2. Setup Particle System (Tiny ambient sparks)
  const particleCount = 120;
  const positions = new Float32Array(particleCount * 3);
  const speeds = [];

  for (let i = 0; i < particleCount; i++) {
    // Spread particles vertically to cover the entire page height (-16 to 2 units)
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = Math.random() * 18 - 16;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6;

    speeds.push({
      vx: (Math.random() - 0.5) * 0.003,
      vy: -(0.001 + Math.random() * 0.003), // Gentle downward drift
      vz: (Math.random() - 0.5) * 0.003
    });
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  let themeColor = getActiveThemeColor();
  let isLightTheme = document.body.classList.contains('theme-light');

  const particleMat = new THREE.PointsMaterial({
    color: new THREE.Color(themeColor),
    size: 0.06,
    sizeAttenuation: true,
    transparent: true,
    opacity: isLightTheme ? 0.45 : 0.75,
    blending: THREE.AdditiveBlending
  });

  const particleSystem = new THREE.Points(particleGeo, particleMat);
  scene.add(particleSystem);

  // 3. Setup Connecting Constellation Lines (Pre-allocated static buffer for GC optimization)
  const maxConnections = 120;
  const linePositions = new Float32Array(maxConnections * 6); // 2 vertices per line (start + end)

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));

  const lineMat = new THREE.LineBasicMaterial({
    color: new THREE.Color(themeColor),
    transparent: true,
    opacity: isLightTheme ? 0.06 : 0.12,
    blending: THREE.AdditiveBlending
  });

  const lineSegments = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lineSegments);

  // 4. Scroll-driven Camera tracking variables
  let scrollProgress = 0;
  let targetCameraY = 0;

  window.addEventListener('scroll', () => {
    const scrollHeight = document.body.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    scrollProgress = window.scrollY / scrollHeight;
    targetCameraY = -scrollProgress * 15; // Map section scroll depth
  });

  // 5. Mouse Parallax Sway variables
  let mouseX = 0;
  let mouseY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;
  });

  // 6. Visual render loop ticks (Zero garbage collection allocations)
  let isSceneVisible = true;

  function animate() {
    if (!isSceneVisible) return;
    requestAnimationFrame(animate);

    // Update particle coordinates and handle boundary wrapping
    const posArr = particleGeo.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      posArr[i * 3] += speeds[i].vx;
      posArr[i * 3 + 1] += speeds[i].vy;
      posArr[i * 3 + 2] += speeds[i].vz;

      // Wrap vertically at Y boundary
      if (posArr[i * 3 + 1] < -17.0) {
        posArr[i * 3 + 1] = 2.0;
        posArr[i * 3] = (Math.random() - 0.5) * 10;
      }
      // Bounce gently on horizontal X boundaries
      if (Math.abs(posArr[i * 3]) > 5.5) {
        speeds[i].vx *= -1;
      }
    }
    particleGeo.attributes.position.needsUpdate = true;

    // Calculate constellation lines within threshold distance (O(N) bounds)
    let lineIdx = 0;
    const thresholdSq = 2.25; // 1.5 units squared distance

    for (let i = 0; i < particleCount; i++) {
      const x1 = posArr[i * 3];
      const y1 = posArr[i * 3 + 1];
      const z1 = posArr[i * 3 + 2];

      for (let j = i + 1; j < particleCount; j++) {
        const x2 = posArr[j * 3];
        const y2 = posArr[j * 3 + 1];
        const z2 = posArr[j * 3 + 2];

        const dx = x1 - x2;
        const dy = y1 - y2;
        const dz = z1 - z2;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < thresholdSq) {
          linePositions[lineIdx * 6] = x1;
          linePositions[lineIdx * 6 + 1] = y1;
          linePositions[lineIdx * 6 + 2] = z1;
          linePositions[lineIdx * 6 + 3] = x2;
          linePositions[lineIdx * 6 + 4] = y2;
          linePositions[lineIdx * 6 + 5] = z2;
          lineIdx++;

          if (lineIdx >= maxConnections) break;
        }
      }
      if (lineIdx >= maxConnections) break;
    }

    // Dynamic draw range update (extremely efficient rendering)
    lineGeo.setDrawRange(0, lineIdx * 2);
    lineGeo.attributes.position.needsUpdate = true;

    // Camera damping sways (gentle LERP update)
    camera.position.y += (targetCameraY - camera.position.y) * 0.05;
    camera.position.x += (mouseX * 0.8 - camera.position.x) * 0.05;
    camera.position.z += ((5.5 - mouseY * 0.5) - camera.position.z) * 0.05;
    
    // Look straight forward to center the particles cleanly
    camera.lookAt(0, camera.position.y, 0);

    renderer.render(scene, camera);
  }

  // 7. Theme change synchronization via MutationObserver
  const themeObserver = new MutationObserver(() => {
    const newColor = getActiveThemeColor();
    const hex = parseInt(newColor.replace('#', '0x'));
    const isLight = document.body.classList.contains('theme-light');

    // Update Materials styling details
    particleMat.color.setHex(hex);
    particleMat.opacity = isLight ? 0.45 : 0.75;
    lineMat.color.setHex(hex);
    lineMat.opacity = isLight ? 0.06 : 0.12;
  });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // 8. Viewport Resizing Handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // 9. Optimization: Pause rendering loop when viewport is hidden
  const visibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isSceneVisible = entry.isIntersecting;
      if (isSceneVisible) {
        animate();
      }
    });
  }, { threshold: 0.05 });
  visibilityObserver.observe(container);

  // Help selectors
  function getActiveThemeColor() {
    const isLight = document.body.classList.contains('theme-light');
    return isLight ? '#0088cc' : '#ff0033';
  }
}
