const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.API_PORT || 8787);
const DB_PATH = path.join(__dirname, 'db.json');
const SECRET = process.env.API_SECRET || 'tacam-secret-dev';

function nowIso() { return new Date().toISOString(); }
function id(prefix) { return `${prefix}_${crypto.randomBytes(8).toString('hex')}`; }
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const calc = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(calc, 'hex'));
}
function signToken(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}
function parseToken(token) {
  if (!token || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const validSig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  if (sig !== validSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch { return null; }
}

function readDb() {
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  const db = JSON.parse(raw);

  const admin = db.users.find(user => user.username === 'admin');
  if (admin && !admin.passwordHash) {
    admin.passwordHash = hashPassword('admin');
    admin.createdAt = admin.createdAt || nowIso();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  }
  return db;
}
function writeDb(db) { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }

function send(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch { resolve({}); }
    });
  });
}

function authUser(req, db) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = parseToken(token);
  if (!payload) return null;
  return db.users.find(user => user.id === payload.sub && user.active);
}

function requireRole(user, roles = []) {
  return user && roles.includes(user.role);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 200, { ok: true });

  const db = readDb();
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathName = url.pathname;

  if (pathName === '/api/health' && req.method === 'GET') return send(res, 200, { ok: true, time: nowIso() });

  if (pathName === '/api/auth/login' && req.method === 'POST') {
    const body = await parseBody(req);
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    const user = db.users.find(item => item.username === username && item.active);
    if (!user || !verifyPassword(password, user.passwordHash)) return send(res, 401, { error: 'Credenciales inválidas' });

    const token = signToken({ sub: user.id, role: user.role, exp: Date.now() + 1000 * 60 * 60 * 8 });
    return send(res, 200, {
      token,
      user: { id: user.id, username: user.username, role: user.role, active: user.active, avatar: user.avatar || '' }
    });
  }

  const user = authUser(req, db);

  if (pathName === '/api/users' && req.method === 'GET') {
    if (!user) return send(res, 401, { error: 'No autorizado' });
    return send(res, 200, db.users.map(u => ({ id: u.id, username: u.username, role: u.role, active: u.active, avatar: u.avatar || '' })));
  }

  if (pathName === '/api/users' && req.method === 'POST') {
    if (!requireRole(user, ['admin'])) return send(res, 403, { error: 'Sin permisos' });
    const body = await parseBody(req);
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    const role = ['admin', 'operador', 'consulta'].includes(body.role) ? body.role : 'consulta';
    if (!username || !password) return send(res, 400, { error: 'Datos incompletos' });
    if (db.users.some(u => u.username === username)) return send(res, 409, { error: 'Usuario ya existe' });

    const newUser = {
      id: id('u'), username, passwordHash: hashPassword(password), role,
      active: true, avatar: String(body.avatar || ''), createdAt: nowIso()
    };
    db.users.push(newUser); writeDb(db);
    return send(res, 201, { id: newUser.id, username: newUser.username, role: newUser.role, active: newUser.active, avatar: newUser.avatar });
  }

  if (pathName.startsWith('/api/users/') && req.method === 'PATCH') {
    if (!requireRole(user, ['admin'])) return send(res, 403, { error: 'Sin permisos' });
    const uid = pathName.split('/').pop();
    const target = db.users.find(u => u.id === uid);
    if (!target) return send(res, 404, { error: 'Usuario no encontrado' });
    const body = await parseBody(req);
    if (typeof body.active === 'boolean') target.active = body.active;
    if (body.role && ['admin', 'operador', 'consulta'].includes(body.role)) target.role = body.role;
    writeDb(db);
    return send(res, 200, { ok: true });
  }

  if (pathName === '/api/clients' && req.method === 'GET') {
    if (!user) return send(res, 401, { error: 'No autorizado' });
    return send(res, 200, db.clients);
  }

  if (pathName === '/api/clients' && req.method === 'POST') {
    if (!requireRole(user, ['admin', 'operador'])) return send(res, 403, { error: 'Sin permisos' });
    const body = await parseBody(req);
    if (!body.nombre || !body.rut) return send(res, 400, { error: 'Nombre y RUT requeridos' });
    const client = { id: id('c'), ...body, createdAt: nowIso(), updatedAt: nowIso() };
    db.clients.push(client); writeDb(db);
    return send(res, 201, client);
  }

  if (pathName.startsWith('/api/clients/') && req.method === 'PUT') {
    if (!requireRole(user, ['admin', 'operador'])) return send(res, 403, { error: 'Sin permisos' });
    const cid = pathName.split('/').pop();
    const body = await parseBody(req);
    const client = db.clients.find(c => c.id === cid);
    if (!client) return send(res, 404, { error: 'Cliente no encontrado' });
    Object.assign(client, body, { updatedAt: nowIso() });
    writeDb(db);
    return send(res, 200, client);
  }

  if (pathName === '/api/appointments' && req.method === 'GET') {
    if (!user) return send(res, 401, { error: 'No autorizado' });
    return send(res, 200, db.appointments);
  }

  if (pathName === '/api/appointments' && req.method === 'POST') {
    if (!requireRole(user, ['admin', 'operador'])) return send(res, 403, { error: 'Sin permisos' });
    const body = await parseBody(req);
    if (!body.clienteId || !body.fecha || !body.hora) return send(res, 400, { error: 'Datos incompletos' });
    const client = db.clients.find(c => c.id === body.clienteId);
    if (!client) return send(res, 404, { error: 'Cliente no encontrado' });

    const appointment = {
      id: id('a'),
      ...body,
      clienteNombre: client.nombre,
      estado: body.estado || 'Confirmada',
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
    db.appointments.push(appointment); writeDb(db);
    return send(res, 201, appointment);
  }

  if (pathName.startsWith('/api/appointments/') && req.method === 'PUT') {
    if (!requireRole(user, ['admin', 'operador'])) return send(res, 403, { error: 'Sin permisos' });
    const aid = pathName.split('/').pop();
    const body = await parseBody(req);
    const appointment = db.appointments.find(a => a.id === aid);
    if (!appointment) return send(res, 404, { error: 'Cita no encontrada' });
    Object.assign(appointment, body, { updatedAt: nowIso() });
    writeDb(db);
    return send(res, 200, appointment);
  }

  if (pathName.startsWith('/api/notifications/appointment/') && req.method === 'GET') {
    if (!user) return send(res, 401, { error: 'No autorizado' });
    const aid = pathName.split('/').pop();
    const appointment = db.appointments.find(a => a.id === aid);
    if (!appointment) return send(res, 404, { error: 'Cita no encontrada' });
    const client = db.clients.find(c => c.id === appointment.clienteId) || { nombre: appointment.clienteNombre, telefono: '', email: '' };

    const whatsappText = `Hola ${client.nombre}, te recordamos tu reunión TACAM el ${appointment.fecha} a las ${appointment.hora} con ${appointment.abogada}.`;
    const emailText = [
      'TACAM Abogados',
      'Jorge Washington 2675, Oficinas 102 y 1003, Antofagasta',
      '+56 9 1234 5678 · www.tacam.cl',
      '----------------------------------------',
      `Estimado/a ${client.nombre},`,
      `Tu reunión está confirmada para ${appointment.fecha} a las ${appointment.hora}.`,
      'Saludos, TACAM Abogados'
    ].join('\n');

    return send(res, 200, {
      whatsapp: { to: client.telefono || '', message: whatsappText },
      email: { to: client.email || '', subject: `Confirmación reunión TACAM - ${client.nombre}`, body: emailText }
    });
  }

  return send(res, 404, { error: 'Ruta no encontrada' });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`TACAM API corriendo en http://localhost:${PORT}`);
  });
}

module.exports = { server, readDb, writeDb, hashPassword, verifyPassword, signToken, parseToken };
