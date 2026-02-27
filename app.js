const STORAGE_KEYS = {
  clients: 'tacam_clients',
  appointments: 'tacam_appointments',
  users: 'tacam_users',
  session: 'tacam_session'
};

const state = {
  clients: load(STORAGE_KEYS.clients),
  appointments: load(STORAGE_KEYS.appointments),
  users: loadUsers(),
  session: loadSession()
};

function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function loadUsers() {
  const users = load(STORAGE_KEYS.users);
  if (users.length) return users;
  const defaults = [{ id: crypto.randomUUID(), username: 'admin', password: 'admin', role: 'admin', active: true }];
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(defaults));
  return defaults;
}

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || 'null');
  } catch {
    return null;
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(state.clients));
  localStorage.setItem(STORAGE_KEYS.appointments, JSON.stringify(state.appointments));
}

function saveUsers() {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(state.users));
}

function saveSession() {
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(state.session));
}

function isRutValid(rut) {
  const normalized = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  if (!/^[0-9]+[0-9K]$/.test(normalized)) return false;
  const body = normalized.slice(0, -1);
  const dv = normalized.slice(-1);
  let sum = 0, mul = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const expected = 11 - (sum % 11);
  const expectedDv = expected === 11 ? '0' : expected === 10 ? 'K' : String(expected);
  return dv === expectedDv;
}

function roleLabel(role) {
  return role === 'admin' ? 'Administrador' : role === 'operador' ? 'Operador' : 'Consulta';
}

function canEditClients() {
  return state.session && ['admin', 'operador'].includes(state.session.role);
}

function canSchedule() {
  return state.session && ['admin', 'operador'].includes(state.session.role);
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });
}

function renderTables() {
  const tbodyNo = document.getElementById('tabla-no-contrataron');
  const tbodySi = document.getElementById('tabla-contratados');

  const noContrataron = state.clients.filter(c => c.contrato === 'No Contrató');
  const contrataron = state.clients.filter(c => c.contrato === 'Contrató');

  tbodyNo.innerHTML = noContrataron.length ? noContrataron.map(c => `
    <tr>
      <td>${c.nombre}</td><td>${c.rut}</td><td>${c.area}</td><td>${c.materia}</td><td>${c.abogada}</td>
      <td>${canEditClients() ? `<button data-promote="${c.id}" class="primary">Marcar contrató</button>` : '<span class="muted">Sin permiso</span>'}</td>
    </tr>
  `).join('') : '<tr><td colspan="6" class="empty">Sin registros.</td></tr>';

  tbodySi.innerHTML = contrataron.length ? contrataron.map(c => `
    <tr><td>${c.nombre}</td><td>${c.rut}</td><td>${c.area}</td><td>${c.materia}</td><td>${c.abogada}</td></tr>
  `).join('') : '<tr><td colspan="5" class="empty">Sin registros.</td></tr>';

  tbodyNo.querySelectorAll('[data-promote]').forEach(btn => {
    btn.addEventListener('click', () => {
      const client = state.clients.find(c => c.id === btn.dataset.promote);
      if (!client || !canEditClients()) return;
      client.contrato = 'Contrató';
      saveData();
      renderAll();
    });
  });
}

function renderClientOptions() {
  const select = document.getElementById('cita-cliente');
  const contracted = state.clients.filter(c => c.contrato === 'Contrató');
  select.innerHTML = contracted.length
    ? `<option value="">Seleccione cliente...</option>${contracted.map(c => `<option value="${c.id}">${c.nombre} (${c.rut})</option>`).join('')}`
    : '<option value="">No hay clientes contratados</option>';
}

function renderVisits() {
  const tbody = document.getElementById('tabla-visitas');
  const ranking = document.getElementById('ranking');

  tbody.innerHTML = state.appointments.length
    ? state.appointments
      .slice().sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map(a => `<tr><td>${a.abogada}</td><td>${a.clienteNombre}</td><td>${a.fecha} ${a.hora}</td><td>${a.estado}</td></tr>`).join('')
    : '<tr><td colspan="4" class="empty">Sin citas agendadas.</td></tr>';

  const totals = state.appointments.reduce((acc, a) => {
    acc[a.abogada] = (acc[a.abogada] || 0) + 1;
    return acc;
  }, {});

  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  ranking.innerHTML = sorted.length
    ? sorted.map(([abogada, count]) => `<li>${abogada}: <strong>${count}</strong> visitas</li>`).join('')
    : '<li class="empty">Aún no hay visitas registradas.</li>';
}

function renderUsers() {
  const tbody = document.getElementById('tabla-usuarios');
  const isAdmin = state.session?.role === 'admin';

  tbody.innerHTML = state.users.map(user => `
    <tr>
      <td>${user.username}</td>
      <td>${roleLabel(user.role)}</td>
      <td>${user.active ? 'Activo' : 'Inactivo'}</td>
      <td>${isAdmin && user.username !== 'admin' ? `<button class="secondary" data-toggle-user="${user.id}">${user.active ? 'Desactivar' : 'Activar'}</button>` : '<span class="muted">-</span>'}</td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-toggle-user]').forEach(button => {
    button.addEventListener('click', () => {
      if (state.session?.role !== 'admin') return;
      const user = state.users.find(u => u.id === button.dataset.toggleUser);
      if (!user) return;
      user.active = !user.active;
      saveUsers();
      renderUsers();
    });
  });
}

function applyAccessControl() {
  const isAdmin = state.session?.role === 'admin';
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });

  const clientFormInputs = document.querySelectorAll('#form-cliente input, #form-cliente select, #form-cliente textarea, #form-cliente button');
  clientFormInputs.forEach(el => {
    el.disabled = !canEditClients();
  });

  const citaFormInputs = document.querySelectorAll('#form-cita input, #form-cita select, #form-cita textarea, #form-cita button');
  citaFormInputs.forEach(el => {
    el.disabled = !canSchedule();
  });
}

function renderSessionInfo() {
  const info = document.getElementById('session-info');
  info.textContent = `Sesión activa: ${state.session.username} (${roleLabel(state.session.role)})`;
}

function renderAll() {
  applyAccessControl();
  renderSessionInfo();
  renderTables();
  renderClientOptions();
  renderVisits();
  renderUsers();
}

function setupLogin() {
  const loginForm = document.getElementById('login-form');
  const loginMsg = document.getElementById('login-msg');
  const loginScreen = document.getElementById('login-screen');
  const appShell = document.getElementById('app-shell');
  const logoutButton = document.getElementById('logout-btn');

  function openApp() {
    loginScreen.classList.add('hidden');
    appShell.classList.remove('hidden');
    renderAll();
  }

  function openLogin() {
    appShell.classList.add('hidden');
    loginScreen.classList.remove('hidden');
  }

  if (state.session) {
    const validUser = state.users.find(u => u.username === state.session.username && u.active);
    if (validUser) {
      state.session.role = validUser.role;
      saveSession();
      openApp();
    }
  }

  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(loginForm).entries());
    const user = state.users.find(
      u => u.username === data.username.trim() && u.password === data.password && u.active
    );

    if (!user) {
      loginMsg.textContent = 'Credenciales inválidas o usuario inactivo.';
      return;
    }

    state.session = { username: user.username, role: user.role };
    saveSession();
    loginForm.reset();
    loginMsg.textContent = '';
    openApp();
  });

  logoutButton.addEventListener('click', () => {
    state.session = null;
    saveSession();
    openLogin();
  });
}

function setupForms() {
  const clientForm = document.getElementById('form-cliente');
  const clientMsg = document.getElementById('cliente-msg');
  const citaForm = document.getElementById('form-cita');
  const citaMsg = document.getElementById('cita-msg');
  const userForm = document.getElementById('form-usuario');
  const userMsg = document.getElementById('user-msg');

  clientForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!canEditClients()) {
      clientMsg.textContent = 'No tienes permisos para crear clientes.';
      return;
    }

    const data = Object.fromEntries(new FormData(clientForm).entries());
    if (!data.nombre.trim()) {
      clientMsg.textContent = 'Nombre es obligatorio.';
      return;
    }
    if (!isRutValid(data.rut.trim())) {
      clientMsg.textContent = 'RUT inválido.';
      return;
    }

    state.clients.push({ id: crypto.randomUUID(), ...data, nombre: data.nombre.trim(), rut: data.rut.trim() });
    saveData();
    renderAll();
    clientForm.reset();
    clientMsg.textContent = 'Cliente guardado correctamente.';
  });

  citaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!canSchedule()) {
      citaMsg.textContent = 'No tienes permisos para agendar citas.';
      return;
    }

    const data = Object.fromEntries(new FormData(citaForm).entries());
    const client = state.clients.find(c => c.id === data.clienteId);
    if (!client) {
      citaMsg.textContent = 'Debe seleccionar un cliente contratado.';
      return;
    }

    state.appointments.push({ id: crypto.randomUUID(), ...data, clienteNombre: client.nombre, estado: 'Confirmada' });
    saveData();
    renderAll();
    citaForm.reset();
    citaMsg.textContent = 'Cita agendada y recordatorio configurado.';
  });

  userForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (state.session?.role !== 'admin') {
      userMsg.textContent = 'Solo administradores pueden crear usuarios.';
      return;
    }

    const data = Object.fromEntries(new FormData(userForm).entries());
    const username = data.username.trim().toLowerCase();
    if (!username || !data.password) {
      userMsg.textContent = 'Completa usuario y clave.';
      return;
    }

    if (state.users.some(u => u.username === username)) {
      userMsg.textContent = 'El usuario ya existe.';
      return;
    }

    state.users.push({
      id: crypto.randomUUID(),
      username,
      password: data.password,
      role: data.role,
      active: true
    });
    saveUsers();
    userForm.reset();
    userMsg.textContent = 'Usuario creado correctamente.';
    renderUsers();
  });
}

setupTabs();
setupForms();
setupLogin();
