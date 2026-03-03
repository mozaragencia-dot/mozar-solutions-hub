const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DB_PATH = path.join(__dirname, '..', 'backend', 'db.json');
const seed = {
  users: [{ id: 'u-admin', username: 'admin', passwordHash: '', role: 'admin', active: true, avatar: '', createdAt: '' }],
  clients: [],
  appointments: []
};

fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2));
process.env.API_PORT = '9898';
process.env.APP_BASE_URL = 'http://127.0.0.1:9898';
const { server } = require('../backend/server');

let token = '';
let appointmentId = '';

test('start server', async () => {
  await new Promise(resolve => server.listen(9898, resolve));
  const res = await fetch('http://127.0.0.1:9898/api/health');
  assert.equal(res.status, 200);
});

test('login admin', async () => {
  const res = await fetch('http://127.0.0.1:9898/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin' })
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.token);
  token = data.token;
});

test('create client and appointment', async () => {
  const cRes = await fetch('http://127.0.0.1:9898/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ nombre: 'Cliente API', rut: '11.111.111-1', telefono: '912345678', email: 'c@x.com' })
  });
  assert.equal(cRes.status, 201);
  const client = await cRes.json();

  const aRes = await fetch('http://127.0.0.1:9898/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ clienteId: client.id, fecha: '2026-12-10', hora: '10:00', area: 'Penal', materia: 'Demo', abogada: 'Daniela Sierra' })
  });
  assert.equal(aRes.status, 201);
  const appointment = await aRes.json();
  appointmentId = appointment.id;
});

test('notification payload includes confirm/reject links', async () => {
  const res = await fetch(`http://127.0.0.1:9898/api/notifications/appointment/${appointmentId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(res.status, 200);
  const payload = await res.json();
  assert.ok(payload.whatsapp.message.includes('Confirma aquí'));
  assert.ok(payload.email.confirmUrl.includes('/api/public/visits/respond'));
  assert.ok(payload.email.rejectUrl.includes('decision=reject'));
});

test('public confirmation link updates appointment status', async () => {
  const nRes = await fetch(`http://127.0.0.1:9898/api/notifications/appointment/${appointmentId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const payload = await nRes.json();
  const confirmUrl = payload.email.confirmUrl;

  const cRes = await fetch(confirmUrl);
  assert.equal(cRes.status, 200);

  const apptRes = await fetch(`http://127.0.0.1:9898/api/appointments`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const list = await apptRes.json();
  const updated = list.find(item => item.id === appointmentId);
  assert.equal(updated.estado, 'Confirmada por cliente');
});

test('shutdown', async () => {
  await new Promise(resolve => server.close(resolve));
  assert.ok(true);
});
