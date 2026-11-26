// GRAVITY ORBIT // N-Body Astrophysics Simulator
(function() {
  'use strict';

  const canvas = document.getElementById('cosmos-canvas');
  const ctx = canvas.getContext('2d');

  // Simulation State
  let bodies = [];
  let particles = [];
  let isPaused = false;
  let warpFactor = 1.0;
  let G = 1.0;
  let collisionMode = 'merge';
  let maxTrailLength = 80;
  let showVectors = true;
  let showGrid = true;

  // Spawner Settings
  let spawner = {
    mass: 5,
    radius: 6,
    color: '#00b4d8'
  };

  // Camera Pan & Zoom
  let camera = {
    x: 0,
    y: 0,
    zoom: 1.0
  };

  // Drag-to-spawn interaction
  let isSpawning = false;
  let spawnOrigin = { x: 0, y: 0 };
  let currentDrag = { x: 0, y: 0 };

  // Pan interaction
  let isPanning = false;
  let panStart = { x: 0, y: 0 };

  // FPS calculation
  let lastTime = performance.now();
  let frameCount = 0;
  let fps = 60;

  // Starfield background
  const stars = [];
  function initStars() {
    stars.length = 0;
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 4000,
        y: (Math.random() - 0.5) * 4000,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.7 + 0.3
      });
    }
  }

  // --- CELESTIAL BODY CLASS ---
  class CelestialBody {
    constructor(cfg) {
      this.name = cfg.name || 'Unnamed Body';
      this.mass = Number(cfg.mass) || 1;
      this.x = Number(cfg.x) || 0;
      this.y = Number(cfg.y) || 0;
      this.vx = Number(cfg.vx) || 0;
      this.vy = Number(cfg.vy) || 0;
      this.ax = 0;
      this.ay = 0;
      this.radius = Number(cfg.radius) || Math.max(3, Math.cbrt(this.mass) * 1.5);
      this.color = cfg.color || '#00f3ff';
      this.fixed = Boolean(cfg.fixed);
      this.trail = [];
    }

    addTrail() {
      if (maxTrailLength <= 0) {
        this.trail = [];
        return;
      }
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > maxTrailLength) {
        this.trail.shift();
      }
    }
  }

  // --- N-BODY GRAVITATIONAL PHYSICS ENGINE ---
  function computePhysics(dt) {
    const softening = 25; // Softening parameter to prevent singularity

    // Reset accelerations
    for (let i = 0; i < bodies.length; i++) {
      bodies[i].ax = 0;
      bodies[i].ay = 0;
    }

    // Mutual gravitational forces
    for (let i = 0; i < bodies.length; i++) {
      const b1 = bodies[i];
      for (let j = i + 1; j < bodies.length; j++) {
        const b2 = bodies[j];
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const distSq = dx * dx + dy * dy + softening;
        const dist = Math.sqrt(distSq);

        const force = (G * b1.mass * b2.mass) / distSq;
        const fX = force * (dx / dist);
        const fY = force * (dy / dist);

        if (!b1.fixed) {
          b1.ax += fX / b1.mass;
          b1.ay += fY / b1.mass;
        }
        if (!b2.fixed) {
          b2.ax -= fX / b2.mass;
          b2.ay -= fY / b2.mass;
        }
      }
    }

    // Integration step (Verlet-style update)
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (b.fixed) continue;
      b.vx += b.ax * dt;
      b.vy += b.ay * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.addTrail();
    }

    // Collision Resolution
    if (collisionMode !== 'ignore') {
      handleCollisions();
    }
  }

  function handleCollisions() {
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const b1 = bodies[i];
        const b2 = bodies[j];
        if (!b1 || !b2) continue;

        const dist = Math.hypot(b2.x - b1.x, b2.y - b1.y);
        const minDist = b1.radius + b2.radius;

        if (dist < minDist) {
          if (collisionMode === 'merge') {
            // Accrete smaller body into larger body
            const primary = b1.mass >= b2.mass ? b1 : b2;
            const absorbed = b1.mass >= b2.mass ? b2 : b1;

            spawnShockwave((primary.x + absorbed.x) / 2, (primary.y + absorbed.y) / 2, primary.color);

            // Conservation of momentum
            const totalMass = primary.mass + absorbed.mass;
            primary.vx = (primary.mass * primary.vx + absorbed.mass * absorbed.vx) / totalMass;
            primary.vy = (primary.mass * primary.vy + absorbed.mass * absorbed.vy) / totalMass;
            primary.mass = totalMass;
            primary.radius = Math.max(primary.radius, Math.cbrt(totalMass) * 1.5);

            bodies = bodies.filter(b => b !== absorbed);
            return handleCollisions(); // Recalculate
          } else if (collisionMode === 'bounce') {
            // Elastic 2D bounce
            const nx = (b2.x - b1.x) / dist;
            const ny = (b2.y - b1.y) / dist;
            const kx = b1.vx - b2.vx;
            const ky = b1.vy - b2.vy;
            const p = 2 * (nx * kx + ny * ky) / (b1.mass + b2.mass);

            if (!b1.fixed) {
              b1.vx -= p * b2.mass * nx;
              b1.vy -= p * b2.mass * ny;
            }
            if (!b2.fixed) {
              b2.vx += p * b1.mass * nx;
              b2.vy += p * b1.mass * ny;
            }
          }
        }
      }
    }
  }

  function spawnShockwave(x, y, color) {
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        maxLife: 30,
        color
      });
    }
  }

  // --- RENDERING ---
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Apply camera transformation
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // Draw Starfield
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.globalAlpha = s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r / camera.zoom, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Draw Spatial Grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.05)';
      ctx.lineWidth = 1 / camera.zoom;
      const gridSize = 100;
      const range = 2000;
      for (let gx = -range; gx <= range; gx += gridSize) {
        ctx.beginPath(); ctx.moveTo(gx, -range); ctx.lineTo(gx, range); ctx.stroke();
      }
      for (let gy = -range; gy <= range; gy += gridSize) {
        ctx.beginPath(); ctx.moveTo(-range, gy); ctx.lineTo(range, gy); ctx.stroke();
      }
    }

    // Draw Orbital Trails
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (b.trail.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 1.5 / camera.zoom;
        for (let t = 0; t < b.trail.length; t++) {
          const pt = b.trail[t];
          if (t === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.globalAlpha = 0.35;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    }

    // Draw Bodies
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];

      // Glow effect
      const gradient = ctx.createRadialGradient(b.x, b.y, b.radius * 0.2, b.x, b.y, b.radius * 2.5);
      gradient.addColorStop(0, b.color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Solid sphere
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Body Name label
      ctx.fillStyle = '#e2e8f0';
      ctx.font = `${Math.max(10, 11 / camera.zoom)}px Fira Code`;
      ctx.fillText(b.name, b.x + b.radius + 4, b.y + 4);

      // Velocity Vector
      if (showVectors && (Math.abs(b.vx) > 0.1 || Math.abs(b.vy) > 0.1)) {
        ctx.strokeStyle = 'rgba(255, 238, 0, 0.6)';
        ctx.lineWidth = 1.2 / camera.zoom;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + b.vx * 12, b.y + b.vy * 12);
        ctx.stroke();
      }
    }

    // Draw Shockwave Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2 / camera.zoom, 0, Math.PI * 2);
      ctx.fill();
      if (p.life <= 0) particles.splice(i, 1);
    }
    ctx.globalAlpha = 1.0;

    // Draw Spawning Vector Arrow
    if (isSpawning) {
      ctx.strokeStyle = spawner.color;
      ctx.lineWidth = 2 / camera.zoom;
      ctx.beginPath();
      ctx.arc(spawnOrigin.x, spawnOrigin.y, spawner.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(spawnOrigin.x, spawnOrigin.y);
      ctx.lineTo(currentDrag.x, currentDrag.y);
      ctx.strokeStyle = '#ffee00';
      ctx.stroke();
    }

    ctx.restore();
  }

  // --- SIMULATION LOOP ---
  function loop(timestamp) {
    // FPS counter
    frameCount++;
    if (timestamp - lastTime >= 1000) {
      fps = frameCount;
      frameCount = 0;
      lastTime = timestamp;
      document.getElementById('hud-fps').textContent = fps;
    }

    if (!isPaused) {
      const dt = 0.5 * warpFactor;
      computePhysics(dt);
    }

    render();
    updateTelemetry();
    requestAnimationFrame(loop);
  }

  // --- TELEMETRY ---
  function updateTelemetry() {
    document.getElementById('hud-body-count').textContent = bodies.length;

    if (bodies.length === 0) {
      document.getElementById('tel-com').textContent = '(0.0, 0.0)';
      document.getElementById('tel-ke').textContent = '0.00 J';
      document.getElementById('tel-pe').textContent = '0.00 J';
      return;
    }

    let totalMass = 0;
    let comX = 0, comY = 0;
    let ke = 0, pe = 0;

    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      totalMass += b.mass;
      comX += b.x * b.mass;
      comY += b.y * b.mass;
      ke += 0.5 * b.mass * (b.vx * b.vx + b.vy * b.vy);

      for (let j = i + 1; j < bodies.length; j++) {
        const b2 = bodies[j];
        const dist = Math.max(1, Math.hypot(b2.x - b.x, b2.y - b.y));
        pe -= (G * b.mass * b2.mass) / dist;
      }
    }

    if (totalMass > 0) {
      comX /= totalMass;
      comY /= totalMass;
    }

    document.getElementById('tel-com').textContent = `(${comX.toFixed(1)}, ${comY.toFixed(1)})`;
    document.getElementById('tel-ke').textContent = `${ke.toFixed(1)} J`;
    document.getElementById('tel-pe').textContent = `${pe.toFixed(1)} J`;

    const virial = Math.abs(pe) > 0 ? (2 * ke) / Math.abs(pe) : 1;
    const badge = document.getElementById('tel-virial');
    if (virial >= 0.8 && virial <= 1.25) {
      badge.textContent = 'Stable Bound';
      badge.style.color = '#00ff88';
    } else if (virial > 1.25) {
      badge.textContent = 'Escaping';
      badge.style.color = '#ffee00';
    } else {
      badge.textContent = 'Collapsing';
      badge.style.color = '#ff007f';
    }
  }

  // --- COORDINATE HELPERS ---
  function screenToWorld(sx, sy) {
    const rect = canvas.getBoundingClientRect();
    const cx = sx - rect.left - canvas.width / 2;
    const cy = sy - rect.top - canvas.height / 2;
    return {
      x: cx / camera.zoom + camera.x,
      y: cy / camera.zoom + camera.y
    };
  }

  // --- MOUSE & TOUCH INTERACTIONS ---
  canvas.addEventListener('mousedown', e => {
    if (e.button === 0) { // Left click: spawn
      isSpawning = true;
      const worldPos = screenToWorld(e.clientX, e.clientY);
      spawnOrigin = worldPos;
      currentDrag = worldPos;
    } else if (e.button === 2) { // Right click: pan
      isPanning = true;
      panStart = { x: e.clientX, y: e.clientY };
    }
  });

  window.addEventListener('mousemove', e => {
    if (isSpawning) {
      currentDrag = screenToWorld(e.clientX, e.clientY);
    } else if (isPanning) {
      const dx = (e.clientX - panStart.x) / camera.zoom;
      const dy = (e.clientY - panStart.y) / camera.zoom;
      camera.x -= dx;
      camera.y -= dy;
      panStart = { x: e.clientX, y: e.clientY };
    }
  });

  window.addEventListener('mouseup', e => {
    if (isSpawning) {
      isSpawning = false;
      const launchVx = (spawnOrigin.x - currentDrag.x) * 0.08;
      const launchVy = (spawnOrigin.y - currentDrag.y) * 0.08;

      bodies.push(new CelestialBody({
        name: `Body #${bodies.length + 1}`,
        mass: spawner.mass,
        radius: spawner.radius,
        color: spawner.color,
        x: spawnOrigin.x,
        y: spawnOrigin.y,
        vx: launchVx,
        vy: launchVy
      }));
    }
    if (isPanning) isPanning = false;
  });

  canvas.addEventListener('contextmenu', e => e.preventDefault());

  // Mouse wheel zoom
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    camera.zoom = Math.min(Math.max(camera.zoom * zoomFactor, 0.1), 5.0);
  });

  // --- API PRESET LOADER ---
  async function loadPreset(presetId) {
    try {
      const res = await fetch(`/api/presets/${presetId}`);
      if (!res.ok) throw new Error('Preset fetch failed');
      const data = await res.json();

      G = data.G || 1.0;
      document.getElementById('slider-gravity').value = G;
      document.getElementById('val-gravity').textContent = G.toFixed(1);

      bodies = data.bodies.map(b => new CelestialBody(b));
      camera.x = 0;
      camera.y = 0;
      camera.zoom = 1.0;
    } catch (err) {
      console.error(err);
    }
  }

  // --- UI EVENT BINDINGS ---
  document.getElementById('btn-play-pause').addEventListener('click', () => {
    isPaused = !isPaused;
    document.getElementById('btn-play-pause').textContent = isPaused ? '▶️ RESUME' : '⏸️ PAUSE';
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    const activeBtn = document.querySelector('.preset-btn.active');
    if (activeBtn) loadPreset(activeBtn.dataset.preset);
  });

  document.getElementById('btn-clear').addEventListener('click', () => {
    bodies = [];
  });

  document.getElementById('slider-warp').addEventListener('input', e => {
    warpFactor = parseFloat(e.target.value);
    document.getElementById('val-warp').textContent = `${warpFactor.toFixed(1)}x`;
  });

  document.getElementById('slider-gravity').addEventListener('input', e => {
    G = parseFloat(e.target.value);
    document.getElementById('val-gravity').textContent = G.toFixed(1);
  });

  document.getElementById('select-collision').addEventListener('change', e => {
    collisionMode = e.target.value;
  });

  document.getElementById('slider-trails').addEventListener('input', e => {
    maxTrailLength = parseInt(e.target.value, 10);
    document.getElementById('val-trails').textContent = maxTrailLength;
  });

  document.getElementById('check-vectors').addEventListener('change', e => {
    showVectors = e.target.checked;
  });

  document.getElementById('check-grid').addEventListener('change', e => {
    showGrid = e.target.checked;
  });

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadPreset(btn.dataset.preset);
    });
  });

  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      spawner.mass = parseFloat(chip.dataset.mass);
      spawner.radius = parseFloat(chip.dataset.radius);
      spawner.color = chip.dataset.color;
      document.getElementById('slider-spawn-mass').value = spawner.mass;
      document.getElementById('val-spawn-mass').textContent = spawner.mass.toFixed(1);
      document.getElementById('spawn-color').value = spawner.color;
    });
  });

  document.getElementById('slider-spawn-mass').addEventListener('input', e => {
    spawner.mass = parseFloat(e.target.value);
    spawner.radius = Math.max(3, Math.cbrt(spawner.mass) * 1.5);
    document.getElementById('val-spawn-mass').textContent = spawner.mass.toFixed(1);
  });

  document.getElementById('spawn-color').addEventListener('input', e => {
    spawner.color = e.target.value;
  });

  // Server-side stability validation
  document.getElementById('btn-server-validate').addEventListener('click', async () => {
    const btn = document.getElementById('btn-server-validate');
    btn.textContent = 'CHECKING MAIN-FRAME...';
    try {
      const res = await fetch('/api/simulate/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          G,
          bodies: bodies.map(b => ({
            name: b.name, mass: b.mass, x: b.x, y: b.y, vx: b.vx, vy: b.vy
          }))
        })
      });
      const data = await res.json();
      btn.textContent = `STATUS: ${data.stabilityState}`;
      setTimeout(() => { btn.textContent = 'API STABILITY CHECK'; }, 3000);
    } catch (_) {
      btn.textContent = 'OFFLINE';
      setTimeout(() => { btn.textContent = 'API STABILITY CHECK'; }, 2000);
    }
  });

  // Modal Share System
  document.getElementById('btn-share').addEventListener('click', () => {
    document.getElementById('modal-share').classList.add('active');
  });

  document.getElementById('btn-close-modal').addEventListener('click', () => {
    document.getElementById('modal-share').classList.remove('active');
  });

  document.getElementById('form-save-system').addEventListener('submit', async e => {
    e.preventDefault();
    const title = document.getElementById('input-sys-name').value.trim();
    const author = document.getElementById('input-author').value.trim() || 'Explorer';
    try {
      await fetch('/api/systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          author,
          bodies: bodies.map(b => ({
            name: b.name, mass: b.mass, x: b.x, y: b.y, vx: b.vx, vy: b.vy, radius: b.radius, color: b.color
          }))
        })
      });
      document.getElementById('modal-share').classList.remove('active');
      alert(`System '${title}' successfully saved to archive!`);
    } catch (_) {}
  });

  // Window resize handling
  function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    render();
  }
  window.addEventListener('resize', resize);

  // --- INIT ---
  initStars();
  resize();
  loadPreset('solar_system');
  requestAnimationFrame(loop);

})();
