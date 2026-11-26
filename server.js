const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Astrophysical presets database
const presets = {
  solar_system: {
    id: 'solar_system',
    name: 'Heliosphere (Inner Solar System)',
    description: 'Central G-type star with terrestrial planets in Keplerian elliptical orbits.',
    G: 0.8,
    bodies: [
      { name: 'Sun', mass: 12000, x: 0, y: 0, vx: 0, vy: 0, radius: 22, color: '#ffcc00', fixed: false },
      { name: 'Mercury', mass: 1.5, x: 70, y: 0, vx: 0, vy: 11.5, radius: 4, color: '#aaaaaa' },
      { name: 'Venus', mass: 4, x: 130, y: 0, vx: 0, vy: 8.6, radius: 6, color: '#e3bb7b' },
      { name: 'Earth', mass: 5, x: 200, y: 0, vx: 0, vy: 6.9, radius: 7, color: '#00b4d8' },
      { name: 'Moon', mass: 0.2, x: 215, y: 0, vx: 0, vy: 7.9, radius: 2.5, color: '#f8f9fa' },
      { name: 'Mars', mass: 2.5, x: 290, y: 0, vx: 0, vy: 5.7, radius: 5, color: '#e63946' },
      { name: 'Jupiter', mass: 80, x: 440, y: 0, vx: 0, vy: 4.6, radius: 14, color: '#f4a261' }
    ]
  },
  binary_stars: {
    id: 'binary_stars',
    name: 'Kepler-47 Binary Star System',
    description: 'Two mutual barycenter orbiting stars with circumbinary planets.',
    G: 1.0,
    bodies: [
      { name: 'Alpha Primary', mass: 6500, x: -75, y: 0, vx: 0, vy: -4.5, radius: 18, color: '#00f3ff' },
      { name: 'Beta Secondary', mass: 5500, x: 75, y: 0, vx: 0, vy: 5.3, radius: 16, color: '#ff007f' },
      { name: 'Planet A', mass: 3, x: 260, y: 0, vx: 0, vy: 6.8, radius: 5, color: '#00ff66' },
      { name: 'Planet B', mass: 6, x: -380, y: 0, vx: 0, vy: -5.6, radius: 8, color: '#ffee00' }
    ]
  },
  three_body_figure8: {
    id: 'three_body_figure8',
    name: 'Euler-Chenciner Figure-8 Choreography',
    description: 'Famous zero-angular-momentum 3-body solution traveling along a single figure-eight path.',
    G: 1.2,
    bodies: [
      { name: 'Singularity 1', mass: 4000, x: -160, y: 0, vx: 0.93240737, vy: 0.86473146, radius: 12, color: '#00f3ff' },
      { name: 'Singularity 2', mass: 4000, x: 160, y: 0, vx: 0.93240737, vy: 0.86473146, radius: 12, color: '#ffee00' },
      { name: 'Singularity 3', mass: 4000, x: 0, y: 0, vx: -1.86481474, vy: -1.72946292, radius: 12, color: '#ff007f' }
    ]
  },
  asteroid_belt: {
    id: 'asteroid_belt',
    name: 'Proto-Planetary Disc & Asteroid Swarm',
    description: 'Central protostar surrounded by stable Keplerian orbital rings.',
    G: 0.9,
    bodies: (function() {
      const list = [{ name: 'Protostar', mass: 15000, x: 0, y: 0, vx: 0, vy: 0, radius: 25, color: '#ff9900', fixed: true }];
      for (let i = 0; i < 35; i++) {
        const r = 120 + Math.random() * 260;
        const theta = Math.random() * Math.PI * 2;
        const v = Math.sqrt((0.9 * 15000) / r);
        list.push({
          name: `Chondrite #${i + 1}`,
          mass: 0.5 + Math.random() * 1.5,
          x: Math.cos(theta) * r,
          y: Math.sin(theta) * r,
          vx: -Math.sin(theta) * v,
          vy: Math.cos(theta) * v,
          radius: 2 + Math.random() * 2,
          color: ['#8ecae6', '#219ebc', '#023047', '#ffb703', '#fb8500'][i % 5]
        });
      }
      return list;
    })()
  }
};

// In-memory user saved systems
const savedSystems = [];

// System Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'gravity-orbit-api',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Presets list
app.get('/api/presets', (req, res) => {
  const summary = Object.keys(presets).map(key => ({
    id: presets[key].id,
    name: presets[key].name,
    description: presets[key].description,
    bodyCount: presets[key].bodies.length,
    gravitationalConstant: presets[key].G
  }));
  res.json({ count: summary.length, presets: summary });
});

// Single preset details
app.get('/api/presets/:id', (req, res) => {
  const preset = presets[req.params.id];
  if (!preset) {
    return res.status(404).json({ error: 'Astrophysical preset not found.' });
  }
  res.json(preset);
});

// Orbital Mechanics Simulation Validator
app.post('/api/simulate/validate', (req, res) => {
  const { bodies, G = 1.0 } = req.body || {};
  if (!Array.isArray(bodies) || bodies.length === 0) {
    return res.status(400).json({ error: 'Array of celestial bodies required.' });
  }

  let totalMass = 0;
  let comX = 0;
  let comY = 0;
  let kineticEnergy = 0;
  let potentialEnergy = 0;

  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    const m = Number(b.mass) || 1;
    totalMass += m;
    comX += (Number(b.x) || 0) * m;
    comY += (Number(b.y) || 0) * m;

    const vx = Number(b.vx) || 0;
    const vy = Number(b.vy) || 0;
    kineticEnergy += 0.5 * m * (vx * vx + vy * vy);

    for (let j = i + 1; j < bodies.length; j++) {
      const b2 = bodies[j];
      const m2 = Number(b2.mass) || 1;
      const dx = (Number(b2.x) || 0) - (Number(b.x) || 0);
      const dy = (Number(b2.y) || 0) - (Number(b.y) || 0);
      const dist = Math.max(1, Math.hypot(dx, dy));
      potentialEnergy -= (G * m * m2) / dist;
    }
  }

  comX = totalMass > 0 ? comX / totalMass : 0;
  comY = totalMass > 0 ? comY / totalMass : 0;
  const totalMechanicalEnergy = kineticEnergy + potentialEnergy;
  const virialRatio = Math.abs(potentialEnergy) > 0 ? (2 * kineticEnergy) / Math.abs(potentialEnergy) : 1;

  res.json({
    bodyCount: bodies.length,
    totalMass: Math.round(totalMass * 100) / 100,
    centerOfMass: { x: Math.round(comX * 100) / 100, y: Math.round(comY * 100) / 100 },
    kineticEnergy: Math.round(kineticEnergy * 100) / 100,
    potentialEnergy: Math.round(potentialEnergy * 100) / 100,
    totalMechanicalEnergy: Math.round(totalMechanicalEnergy * 100) / 100,
    virialRatio: Math.round(virialRatio * 1000) / 1000,
    stabilityState: virialRatio >= 0.8 && virialRatio <= 1.2 ? 'Stable Bound Orbit' : (virialRatio > 1.2 ? 'Hyperbolic Expansion' : 'Gravitational Collapse')
  });
});

// Community custom systems
app.get('/api/systems', (req, res) => {
  res.json({ count: savedSystems.length, systems: savedSystems });
});

app.post('/api/systems', (req, res) => {
  const { title, bodies, author = 'Explorer' } = req.body || {};
  if (!title || !Array.isArray(bodies) || bodies.length === 0) {
    return res.status(400).json({ error: 'System title and valid bodies array required.' });
  }

  const system = {
    id: `sys_${Date.now()}`,
    title: title.slice(0, 40),
    author: author.slice(0, 25),
    bodiesCount: bodies.length,
    bodies,
    createdAt: new Date().toISOString()
  };

  savedSystems.unshift(system);
  res.status(201).json({ success: true, system });
});

// Stats
app.get('/api/stats', (req, res) => {
  res.json({
    activePresets: Object.keys(presets).length,
    customSystemsCount: savedSystems.length,
    defaultGravitationalConstant: 1.0,
    astrophysicsEngine: 'Runge-Kutta 4th / Verlet Hybrid'
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Gravity Orbit Server] Running at http://localhost:${PORT}`);
  });
}

module.exports = app;
