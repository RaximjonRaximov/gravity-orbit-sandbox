const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../server.js');

let server;
let baseUrl;

test.before((t, done) => {
  server = http.createServer(app);
  server.listen(0, () => {
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    done();
  });
});

test.after((t, done) => {
  server.close(done);
});

test('GET /api/health returns system telemetry', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.equal(data.service, 'gravity-orbit-api');
});

test('GET /api/presets lists astrophysical systems', async () => {
  const res = await fetch(`${baseUrl}/api/presets`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.count >= 4);
  const solar = data.presets.find(p => p.id === 'solar_system');
  assert.ok(solar);
  assert.ok(solar.bodyCount >= 5);
});

test('GET /api/presets/:id returns single preset details', async () => {
  const res = await fetch(`${baseUrl}/api/presets/binary_stars`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.id, 'binary_stars');
  assert.ok(Array.isArray(data.bodies));
});

test('POST /api/simulate/validate calculates center of mass and energies', async () => {
  const payload = {
    G: 1.0,
    bodies: [
      { name: 'Star', mass: 1000, x: 0, y: 0, vx: 0, vy: 0 },
      { name: 'Planet', mass: 10, x: 100, y: 0, vx: 0, vy: 3.16 }
    ]
  };

  const res = await fetch(`${baseUrl}/api/simulate/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.bodyCount, 2);
  assert.ok(data.totalMass > 1000);
  assert.ok(typeof data.kineticEnergy === 'number');
  assert.ok(typeof data.potentialEnergy === 'number');
  assert.ok(data.stabilityState);
});

test('POST /api/systems saves and retrieves custom cosmos configuration', async () => {
  const payload = {
    title: 'Alpha Centauri Trio',
    author: 'Commander Raximjon',
    bodies: [
      { name: 'Alpha', mass: 5000, x: -50, y: 0, vx: 0, vy: -2 },
      { name: 'Beta', mass: 4500, x: 50, y: 0, vx: 0, vy: 2 }
    ]
  };

  const postRes = await fetch(`${baseUrl}/api/systems`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.equal(postRes.status, 201);
  const postData = await postRes.json();
  assert.equal(postData.success, true);
  assert.equal(postData.system.title, 'Alpha Centauri Trio');

  const getRes = await fetch(`${baseUrl}/api/systems`);
  const getData = await getRes.json();
  assert.ok(getData.count >= 1);
});
