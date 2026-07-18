/**
 * Interactive Neural Network Backdrop Grid Canvas
 * Lightweight 2D Particle Connection Engine
 * Optimized with Accessibility, Motion, and Gravity Flow System
 */
document.addEventListener('DOMContentLoaded', () => {
  initNeuralNetwork();
});

function initNeuralNetwork() {
  const canvas = document.getElementById('neural-network-canvas');
  if (!canvas) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d');
  let animationFrameId;
  let isCanvasVisible = true;

  // Particle Settings
  const particles = [];
  const particleCount = Math.min(45, Math.floor(window.innerWidth / 30));
  const connectionDistance = 110;
  
  let mouse = { x: null, y: null, radius: 150 };

  // Setup sizes
  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    updateCoreCenter();
  }
  
  // Gravitational attraction coordinates towards AI Core
  const coreEl = document.querySelector('.ai-3d-scene');
  let coreCenter = { x: canvas.width * 0.75, y: canvas.height * 0.5 }; // Default right-center fallback

  function updateCoreCenter() {
    if (coreEl && canvas) {
      const coreRect = coreEl.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      coreCenter.x = (coreRect.left - canvasRect.left) + coreRect.width / 2;
      coreCenter.y = (coreRect.top - canvasRect.top) + coreRect.height / 2;
    }
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Track mouse coordinates
  window.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  // Particle Class
  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.45;
      this.vy = (Math.random() - 0.5) * 0.45;
      this.radius = 1.5 + Math.random() * 2;
    }

    update() {
      // Re-boundary bounds
      if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
      if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

      this.x += this.vx;
      this.y += this.vy;

      // Pull particles gently towards AI Core scene center coordinates
      const coreDx = coreCenter.x - this.x;
      const coreDy = coreCenter.y - this.y;
      const coreDist = Math.sqrt(coreDx * coreDx + coreDy * coreDy);
      if (coreDist > 80) {
        this.x += (coreDx / coreDist) * 0.06;
        this.y += (coreDy / coreDist) * 0.06;
      }

      // Mouse interactive push force
      if (mouse.x !== null && mouse.y !== null) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          this.x += (dx / dist) * force * 1.5;
          this.y += (dy / dist) * force * 1.5;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = getThemeColor(0.25);
      ctx.fill();
    }
  }

  // Populate particles
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  // Draw connection paths
  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDistance) {
          const alpha = (1 - (dist / connectionDistance)) * 0.12;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = getThemeColor(alpha);
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  }

  // Main Render Ticks Loop
  function tick() {
    if (!isCanvasVisible) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.update();
      p.draw();
    });

    drawLines();

    animationFrameId = requestAnimationFrame(tick);
  }

  // Helper
  function getThemeColor(alpha) {
    const isLight = document.body.classList.contains('theme-light');
    return isLight ? `rgba(0, 136, 204, ${alpha})` : `rgba(255, 0, 51, ${alpha})`;
  }

  // IntersectionObserver to stop loop when not in view
  const visibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isCanvasVisible = entry.isIntersecting;
      if (isCanvasVisible) {
        tick();
      } else {
        cancelAnimationFrame(animationFrameId);
      }
    });
  }, { threshold: 0.05 });
  
  visibilityObserver.observe(canvas);
}
