# 🪐 GRAVITY ORBIT // N-Body Astrophysics Simulator & Solar System Forge

[![CI Pipeline](https://github.com/RaximjonRaximov/gravity-orbit-sandbox/actions/workflows/ci.yml/badge.svg)](https://github.com/RaximjonRaximov/gravity-orbit-sandbox/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

> **GRAVITY ORBIT** is a real-time N-body gravitational physics simulator and celestial orbital mechanics sandbox. Features Newtonian gravity ($F = G \frac{m_1 m_2}{r^2}$), orbital trail tracing, relativistic mass accretion/fusion, velocity vector fields, and an Express REST API with analytical virial stability validation.

---

## 🌟 Key Features

- **🌌 Realistic N-body Gravitational Physics Engine:**
  - Direct pairwise Newtonian gravity calculation with Plummer softening kernel to prevent singularities.
  - Multi-body collision dynamics: **Mass Accretion (Merge & Grow)** or **Elastic Momentum Bounces**.
  - Dynamic orbital trail tracing with fading history buffers.
  - Velocity vector arrows showing real-time celestial momentum.

- **🚀 Interactive Celestial Forge (Spawner):**
  - Click & drag directly into space to project trajectory and initial velocity vectors.
  - Archetypes: *Terrestrial Planets*, *Gas Giants*, *Stars*, and *Singularities (Black Holes)*.
  - Continuous camera zoom (scroll wheel) and frictionless pan (Right-click or drag).

- **🪐 Astrophysical Presets Included:**
  1. **Inner Solar System:** Sun, Mercury, Venus, Earth-Moon system, Mars, and Jupiter.
  2. **Kepler-47 Binary Stars:** Two central barycenter-orbiting stars with circumbinary planets.
  3. **Euler-Chenciner Figure-8:** Periodic stable 3-body choreography.
  4. **Proto-Planetary Disc & Asteroid Belt:** Keplerian orbital swarm with 35+ chondrites.

- **⚡ Full-Stack REST API:**
  - `GET /api/health` — Microservice uptime and telemetry.
  - `GET /api/presets` — Catalog of pre-configured cosmic architectures.
  - `POST /api/simulate/validate` — Server-side orbital mechanics validator (Center of Mass, Kinetic Energy, Potential Energy, Virial Ratio $2K/|U|$).
  - `GET /api/systems` & `POST /api/systems` — Store and share custom community cosmos models.

- **🐳 Production Ready:**
  - Multi-stage Alpine Linux `Dockerfile`.
  - Zero-dependency automated test runner (`node:test`).
  - Automated CI workflow with GitHub Actions.

---

## 🚀 Quick Start

### 1. Local Run

```bash
# Clone the repository
git clone https://github.com/RaximjonRaximov/gravity-orbit-sandbox.git
cd gravity-orbit-sandbox

# Install dependencies
npm install

# Run automated tests
npm test

# Start the server
npm start
```

Now open **`http://localhost:3000`** in your browser.

---

### 2. Docker Run

```bash
docker build -t gravity-orbit-sandbox .
docker run -d -p 3000:3000 --name gravity-orbit gravity-orbit-sandbox
```

---

## 🕹️ Controls Guide

| Action | Control |
| :--- | :--- |
| **Spawn Celestial Body** | Left-Click & Drag to aim velocity arrow |
| **Pan Camera** | Right-Click & Drag across space |
| **Zoom Viewport** | Mouse Scroll Wheel |
| **Pause / Resume** | `PAUSE` button |
| **Adjust Warp Speed** | Warp slider (0.1x – 5.0x) |
| **API Stability Check** | Orbital Telemetry Deck -> `API STABILITY CHECK` |

---

## 📄 License

MIT © [Raximjon Raximov](https://github.com/RaximjonRaximov)
