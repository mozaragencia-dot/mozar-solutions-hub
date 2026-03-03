const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.API_PORT || 8787);
const DB_PATH = path.join(__dirname, 'db.json');
const SECRET = process.env.API_SECRET || 'tacam-secret-dev';
const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${PORT}`;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WHATSAPP_VERSION = process.env.WHATSAPP_VERSION || 'v21.0';

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

function sign(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function parseSigned(token) {
  if (!token || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const validSig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  if (sig !== validSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function readDb() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const admin = db.users.find(user => user.username === 'admin');
  if (admin && !admin.passwordHash) {
    admin.passwordHash = hashPassword('admin');
    admin.createdAt = admin.createdAt || nowIso();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  }
  return db;
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function send(res, status, data, contentType = 'application/json; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  });
  if (contentType.includes('application/json')) {
    res.end(JSON.stringify(data));
  } else {
    res.end(data);
  }
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
  const payload = parseSigned(token);
  if (!payload) return null;
  return db.users.find(user => user.id === payload.sub && user.active);
}

function requireRole(user, roles) {
  return user && roles.includes(user.role);
}

function appointmentResponseToken(appointment, client) {
  return sign({
    typ: 'visit_response',
    appointmentId: appointment.id,
    clientId: client.id || '',
    exp: Date.now() + 1000 * 60 * 60 * 24 * 30
  });
}

function buildNotificationPayload(appointment, client) {
  const token = appointmentResponseToken(appointment, client);
  const confirmUrl = `${APP_BASE_URL}/api/public/visits/respond?appointmentId=${encodeURIComponent(appointment.id)}&decision=confirm&token=${encodeURIComponent(token)}`;
  const rejectUrl = `${APP_BASE_URL}/api/public/visits/respond?appointmentId=${encodeURIComponent(appointment.id)}&decision=reject&token=${encodeURIComponent(token)}`;

  const whatsappText = [
    `Hola ${client.nombre},`,
    `te recordamos tu reunión TACAM el ${appointment.fecha} a las ${appointment.hora} con ${appointment.abogada}.`,
    `Confirma aquí: ${confirmUrl}`,
    `Si no podrás asistir, rechaza aquí: ${rejectUrl}`
  ].join(' ');

  const emailBody = [
    'TACAM Abogados',
    'Jorge Washington 2675, Oficinas 102 y 1003, Antofagasta',
    '+56 9 1234 5678 · www.tacam.cl',
    '--------------------------------------------------',
    `Estimado/a ${client.nombre},`,
    '',
    'Tu reunión está agendada con la siguiente información:',
    `• Fecha: ${appointment.fecha}`,
    `• Hora: ${appointment.hora}`,
    `• Área: ${appointment.area}`,
    `• Materia: ${appointment.materia}`,
    `• Abogada: ${appointment.abogada}`,
    '',
    `Confirmar asistencia: ${confirmUrl}`,
    `Rechazar asistencia: ${rejectUrl}`,
    '',
    'Saludos cordiales,',
    'TACAM Abogados'
  ].join('\n');

  return {
    whatsapp: { to: client.telefono || '', message: whatsappText },
    email: {
      to: client.email || '',
      subject: `Confirmación reunión TACAM - ${client.nombre}`,
      body: emailBody,
      confirmUrl,
      rejectUrl
    }
  };
}

async function sendWhatsappCloud(to, text) {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    return { ok: false, reason: 'MISSING_WHATSAPP_CONFIG' };
  }
  const normalized = String(to || '').replace(/\D/g, '');
  if (!normalized) return { ok: false, reason: 'MISSING_PHONE_NUMBER' };

  const endpoint = `https://graph.facebook.com/${WHATSAPP_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: normalized,
      type: 'text',
      text: { body: text }
    })
  });

  const data = await resp.json().catch(() => ({}));
  return { ok: resp.ok, status: resp.status, data };
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 200, { ok: true });

  const db = readDb();
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathName = url.pathname;

  if (pathName === '/api/health' && req.method === 'GET') {
    return send(res, 200, { ok: true, time: nowIso() });
  }

  if (pathName === '/api/auth/login' && req.method === 'POST') {
    const body = await parseBody(req);
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    const user = db.users.find(item => item.username === username && item.active);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return send(res, 401, { error: 'Credenciales inválidas' });
    }

    const token = sign({ sub: user.id, role: user.role, exp: Date.now() + 1000 * 60 * 60 * 8 });
    return send(res, 200, {
      token,
      user: { id: user.id, username: user.username, role: user.role, active: user.active, avatar: user.avatar || '' }
    });
  }

  if (pathName === '/api/public/visits/respond' && req.method === 'GET') {
    const appointmentId = url.searchParams.get('appointmentId');
    const decision = url.searchParams.get('decision');
    const token = url.searchParams.get('token');
    const payload = parseSigned(token || '');

    if (!payload || payload.typ !== 'visit_response' || payload.appointmentId !== appointmentId) {
      return send(res, 401, '<h1>Enlace inválido o expirado</h1>', 'text/html; charset=utf-8');
    }
    if (!['confirm', 'reject'].includes(decision)) {
      return send(res, 400, '<h1>Decisión inválida</h1>', 'text/html; charset=utf-8');
    }

    const appointment = db.appointments.find(item => item.id === appointmentId);
    if (!appointment) return send(res, 404, '<h1>Cita no encontrada</h1>', 'text/html; charset=utf-8');

    appointment.estado = decision === 'confirm' ? 'Confirmada por cliente' : 'Rechazada por cliente';
    appointment.respondedAt = nowIso();
    writeDb(db);

    const html = `<!doctype html><html><body style="font-family:Arial;padding:24px"><h2>${decision === 'confirm' ? '✅ Visita confirmada' : '❌ Visita rechazada'}</h2><p>Gracias, registramos tu respuesta para la cita del ${appointment.fecha} a las ${appointment.hora}.</p></body></html>`;
    return send(res, 200, html, 'text/html; charset=utf-8');
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
      id: id('u'),
      username,
      passwordHash: hashPassword(password),
      role,
      active: true,
      avatar: String(body.avatar || ''),
      createdAt: nowIso()
    };
    db.users.push(newUser);
    writeDb(db);
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
    db.clients.push(client);
    writeDb(db);
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
    db.appointments.push(appointment);
    writeDb(db);
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
    const client = db.clients.find(c => c.id === appointment.clienteId) || { id: '', nombre: appointment.clienteNombre, telefono: '', email: '' };

    const payload = buildNotificationPayload(appointment, client);
    return send(res, 200, payload);
  }

  if (pathName.startsWith('/api/notifications/appointment/') && req.method === 'POST') {
    if (!requireRole(user, ['admin', 'operador'])) return send(res, 403, { error: 'Sin permisos' });
    const aid = pathName.split('/').pop();
    const appointment = db.appointments.find(a => a.id === aid);
    if (!appointment) return send(res, 404, { error: 'Cita no encontrada' });
    const client = db.clients.find(c => c.id === appointment.clienteId) || { id: '', nombre: appointment.clienteNombre, telefono: '', email: '' };
    const payload = buildNotificationPayload(appointment, client);

    const body = await parseBody(req);
    if (body.channel === 'whatsapp') {
      const result = await sendWhatsappCloud(payload.whatsapp.to, payload.whatsapp.message);
      if (!result.ok) return send(res, 400, { error: 'No se pudo enviar WhatsApp', detail: result });
      return send(res, 200, { ok: true, channel: 'whatsapp', provider: result.data });
    }

    return send(res, 200, { ok: true, channel: 'preview', payload });
  }

  return send(res, 404, { error: 'Ruta no encontrada' });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`TACAM API corriendo en http://localhost:${PORT}`);
  });
}

module.exports = {
  server,
  readDb,
  writeDb,
  hashPassword,
  verifyPassword,
  sign,
  parseSigned,
  buildNotificationPayload
};
