const STORAGE_KEYS = {
  clients: 'tacam_clients',
  appointments: 'tacam_appointments',
  users: 'tacam_users',
  session: 'tacam_session'
};

const LAWYERS = ['Daniela Sierra', 'Natalie Gómez', 'Camila Vásquez', 'Carolina Contreras'];

const state = {
  clients: load(STORAGE_KEYS.clients),
  appointments: load(STORAGE_KEYS.appointments),
  users: loadUsers(),
  session: loadSession(),
  selectedLawyer: LAWYERS[0]
};

function load(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

function loadUsers() {
  const users = load(STORAGE_KEYS.users);
  if (users.length) return users;
  const defaults = [{ id: crypto.randomUUID(), username: 'admin', password: 'admin', role: 'admin', active: true }];
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(defaults));
  return defaults;
}

function loadSession() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || 'null'); } catch { return null; }
}

function saveData() {
  localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(state.clients));
  localStorage.setItem(STORAGE_KEYS.appointments, JSON.stringify(state.appointments));
}
function saveUsers() { localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(state.users)); }
function saveSession() { localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(state.session)); }

function showToast(message, type = 'success') {
  const c = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  c.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(-6px)'; setTimeout(() => el.remove(), 200); }, 2400);
}

function isRutValid(rut) {
  const normalized = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  if (!/^[0-9]+[0-9K]$/.test(normalized)) return false;
  const body = normalized.slice(0, -1);
  const dv = normalized.slice(-1);
  let sum = 0;
  let mul = 2;
  for (let i = body.length - 1; i >= 0; i -= 1) {
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
function canEditClients() { return state.session && ['admin', 'operador'].includes(state.session.role); }
function canSchedule() { return state.session && ['admin', 'operador'].includes(state.session.role); }

function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(item => item.classList.remove('active'));
      panels.forEach(panel => panel.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });
}

function googleCalendarUrl(appointment) {
  const start = new Date(`${appointment.fecha}T${appointment.hora}:00`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const text = encodeURIComponent(`Reunión TACAM - ${appointment.clienteNombre}`);
  const details = encodeURIComponent(`Área: ${appointment.area}\nMateria: ${appointment.materia}\nAbogada: ${appointment.abogada}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${fmt(start)}/${fmt(end)}&details=${details}`;
}

function renderClientTables() {
  const tbodyNo = document.getElementById('tabla-no-contrataron');
  const tbodySi = document.getElementById('tabla-contratados');
  const noContrataron = state.clients.filter(client => client.contrato === 'No Contrató');
  const contrataron = state.clients.filter(client => client.contrato === 'Contrató');

  const actions = client => {
    const editBtn = canEditClients() ? `<button class="secondary" data-edit-client="${client.id}">Editar</button>` : '<span class="muted">Sin permiso</span>';
    const promoteBtn = canEditClients() && client.contrato === 'No Contrató' ? `<button class="primary" data-promote="${client.id}">Marcar contrató</button>` : '';
    return `${editBtn} ${promoteBtn}`;
  };

  tbodyNo.innerHTML = noContrataron.length
    ? noContrataron.map(client => `<tr><td>${client.nombre}</td><td>${client.rut}</td><td>${client.area}</td><td>${client.abogada}</td><td>${actions(client)}</td></tr>`).join('')
    : '<tr><td colspan="5" class="empty">Sin registros.</td></tr>';

  tbodySi.innerHTML = contrataron.length
    ? contrataron.map(client => `<tr><td>${client.nombre}</td><td>${client.rut}</td><td>${client.area}</td><td>${client.abogada}</td><td>${actions(client)}</td></tr>`).join('')
    : '<tr><td colspan="5" class="empty">Sin registros.</td></tr>';

  document.querySelectorAll('[data-promote]').forEach(button => {
    button.addEventListener('click', () => {
      const client = state.clients.find(item => item.id === button.dataset.promote);
      if (!client || !canEditClients()) return;
      client.contrato = 'Contrató';
      saveData();
      renderAll();
      showToast('Cliente actualizado OK');
    });
  });

  document.querySelectorAll('[data-edit-client]').forEach(button => {
    button.addEventListener('click', () => openEditClient(button.dataset.editClient));
  });
}

function renderClientOptions() {
  const select = document.getElementById('cita-cliente');
  const contracted = state.clients.filter(client => client.contrato === 'Contrató');
  select.innerHTML = contracted.length
    ? `<option value="">Seleccione cliente...</option>${contracted.map(client => `<option value="${client.id}">${client.nombre} (${client.rut})</option>`).join('')}`
    : '<option value="">No hay clientes contratados</option>';
}

function renderVisits() {
  const tbody = document.getElementById('tabla-visitas');
  tbody.innerHTML = state.appointments.length
    ? state.appointments
      .slice()
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))
      .map(appointment => `
        <tr>
          <td>${appointment.abogada}</td>
          <td>${appointment.clienteNombre}</td>
          <td>${appointment.fecha} ${appointment.hora}</td>
          <td>${appointment.estado}</td>
          <td>
            ${canSchedule() ? `<button class="secondary" data-reschedule="${appointment.id}">Reagendar</button>` : '<span class="muted">Sin permiso</span>'}
            <a class="link-btn" target="_blank" rel="noreferrer" href="${googleCalendarUrl(appointment)}">Google Calendar</a>
          </td>
        </tr>
      `).join('')
    : '<tr><td colspan="5" class="empty">Sin citas agendadas.</td></tr>';

  document.querySelectorAll('[data-reschedule]').forEach(button => {
    button.addEventListener('click', () => {
      const item = state.appointments.find(a => a.id === button.dataset.reschedule);
      if (!item || !canSchedule()) return;
      const newDate = prompt('Nueva fecha (YYYY-MM-DD):', item.fecha);
      if (!newDate) return;
      const newTime = prompt('Nueva hora (HH:MM):', item.hora);
      if (!newTime) return;
      item.fecha = newDate;
      item.hora = newTime;
      item.estado = 'Reagendada';
      saveData();
      renderAll();
      showToast('Horario de reunión actualizado OK');
    });
  });
}

function renderLawyerModule() {
  const select = document.getElementById('selector-abogada');
  select.innerHTML = LAWYERS.map(name => `<option value="${name}">${name}</option>`).join('');
  select.value = state.selectedLawyer;

  const scopedAppointments = state.appointments.filter(a => a.abogada === state.selectedLawyer);
  const upcoming = scopedAppointments.filter(a => new Date(`${a.fecha}T${a.hora}`) >= new Date()).length;
  const clients = new Set(scopedAppointments.map(a => a.clienteId)).size;

  document.getElementById('stats-abogada').innerHTML = `
    <div class="stat"><span>Total reuniones</span><strong>${scopedAppointments.length}</strong></div>
    <div class="stat"><span>Próximas</span><strong>${upcoming}</strong></div>
    <div class="stat"><span>Clientes únicos</span><strong>${clients}</strong></div>
    <div class="stat"><span>Completadas/confirmadas</span><strong>${scopedAppointments.filter(a => a.estado !== 'Reagendada').length}</strong></div>
  `;

  document.getElementById('tabla-abogada-citas').innerHTML = scopedAppointments.length
    ? scopedAppointments
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))
      .map(a => `<tr><td>${a.clienteNombre}</td><td>${a.fecha} ${a.hora}</td><td>${a.estado}</td><td><a class="link-btn" target="_blank" rel="noreferrer" href="${googleCalendarUrl(a)}">Crear evento</a></td></tr>`)
      .join('')
    : '<tr><td colspan="4" class="empty">Sin reuniones para esta abogada.</td></tr>';
}

function renderAdminCalendar() {
  const container = document.getElementById('calendar-grid');
  const grouped = state.appointments.reduce((acc, a) => {
    acc[a.fecha] = acc[a.fecha] || [];
    acc[a.fecha].push(a);
    return acc;
  }, {});
  const days = Object.keys(grouped).sort();
  container.innerHTML = days.length
    ? days.map(day => `
      <article class="day-card">
        <h4>${day}</h4>
        <ul>
          ${grouped[day].sort((a, b) => a.hora.localeCompare(b.hora)).map(a => `<li>${a.hora} · ${a.clienteNombre} · ${a.abogada} · ${a.estado}</li>`).join('')}
        </ul>
      </article>
    `).join('')
    : '<p class="empty">No hay reservas aún.</p>';
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
      if (!isAdmin) return;
      const user = state.users.find(item => item.id === button.dataset.toggleUser);
      if (!user) return;
      user.active = !user.active;
      saveUsers();
      renderUsers();
      showToast(`Usuario ${user.active ? 'activado' : 'desactivado'} OK`);
    });
  });
}

function applyAccessControl() {
  const isAdmin = state.session?.role === 'admin';
  document.querySelectorAll('.admin-only').forEach(element => {
    element.style.display = isAdmin ? '' : 'none';
  });

  document.querySelectorAll('#form-cliente input, #form-cliente select, #form-cliente textarea, #form-cliente button').forEach(el => {
    el.disabled = !canEditClients();
  });
  document.querySelectorAll('#form-cita input, #form-cita select, #form-cita textarea, #form-cita button').forEach(el => {
    el.disabled = !canSchedule();
  });
}

function renderSessionInfo() {
  document.getElementById('session-info').textContent = `Sesión activa: ${state.session.username} (${roleLabel(state.session.role)})`;
}

function renderAll() {
  applyAccessControl();
  renderSessionInfo();
  renderClientTables();
  renderClientOptions();
  renderVisits();
  renderLawyerModule();
  renderAdminCalendar();
  renderUsers();
}

function openEditClient(id) {
  if (!canEditClients()) return;
  const client = state.clients.find(c => c.id === id);
  if (!client) return;
  const dialog = document.getElementById('edit-dialog');
  const form = document.getElementById('edit-form');
  form.id.value = client.id;
  form.nombre.value = client.nombre || '';
  form.rut.value = client.rut || '';
  form.telefono.value = client.telefono || '';
  form.email.value = client.email || '';
  form.direccion.value = client.direccion || '';
  form.abogada.value = client.abogada || '';
  dialog.showModal();
}

function setupLogin() {
  const loginForm = document.getElementById('login-form');
  const loginMsg = document.getElementById('login-msg');
  const loginScreen = document.getElementById('login-screen');
  const appShell = document.getElementById('app-shell');

  const openApp = () => { loginScreen.classList.add('hidden'); appShell.classList.remove('hidden'); renderAll(); };
  const openLogin = () => { appShell.classList.add('hidden'); loginScreen.classList.remove('hidden'); };

  if (state.session) {
    const validUser = state.users.find(user => user.username === state.session.username && user.active);
    if (validUser) {
      state.session.role = validUser.role;
      saveSession();
      openApp();
    }
  }

  loginForm.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(loginForm).entries());
    const username = data.username.trim().toLowerCase();
    const user = state.users.find(item => item.username === username && item.password === data.password && item.active);
    if (!user) {
      loginMsg.textContent = 'Credenciales inválidas o usuario inactivo.';
      showToast('Error de acceso', 'error');
      return;
    }
    state.session = { username: user.username, role: user.role };
    saveSession();
    loginForm.reset();
    loginMsg.textContent = '';
    openApp();
    showToast('Ingreso correcto al sistema');
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    state.session = null;
    saveSession();
    openLogin();
    showToast('Sesión cerrada');
  });
}

function setupForms() {
  const clientForm = document.getElementById('form-cliente');
  const clientMsg = document.getElementById('cliente-msg');
  const citaForm = document.getElementById('form-cita');
  const citaMsg = document.getElementById('cita-msg');
  const userForm = document.getElementById('form-usuario');
  const userMsg = document.getElementById('user-msg');

  clientForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!canEditClients()) {
      clientMsg.textContent = 'No tienes permisos para crear clientes.';
      showToast('Sin permisos para crear cliente', 'error');
      return;
    }
    const data = Object.fromEntries(new FormData(clientForm).entries());
    if (!data.nombre.trim()) return clientMsg.textContent = 'Nombre es obligatorio.';
    if (!isRutValid(data.rut.trim())) return clientMsg.textContent = 'RUT inválido.';
    state.clients.push({ id: crypto.randomUUID(), ...data, nombre: data.nombre.trim(), rut: data.rut.trim() });
    saveData();
    renderAll();
    clientForm.reset();
    clientMsg.textContent = 'Cliente guardado correctamente.';
    showToast('Cliente creado OK');
  });

  citaForm.addEventListener('submit', event => {
    event.preventDefault();
    if (!canSchedule()) {
      citaMsg.textContent = 'No tienes permisos para agendar citas.';
      showToast('Sin permisos para agendar', 'error');
      return;
    }
    const data = Object.fromEntries(new FormData(citaForm).entries());
    const client = state.clients.find(item => item.id === data.clienteId);
    if (!client) return citaMsg.textContent = 'Debe seleccionar un cliente contratado.';
    state.appointments.push({ id: crypto.randomUUID(), ...data, clienteNombre: client.nombre, estado: 'Confirmada' });
    saveData();
    renderAll();
    citaForm.reset();
    citaMsg.textContent = 'Cita agendada y recordatorio configurado.';
    showToast('Cita agendada OK');
  });

  userForm.addEventListener('submit', event => {
    event.preventDefault();
    if (state.session?.role !== 'admin') {
      userMsg.textContent = 'Solo administradores pueden crear usuarios.';
      showToast('Sin permisos para crear usuarios', 'error');
      return;
    }
    const data = Object.fromEntries(new FormData(userForm).entries());
    const username = data.username.trim().toLowerCase();
    if (!username || !data.password) return userMsg.textContent = 'Completa usuario y clave.';
    if (state.users.some(user => user.username === username)) return userMsg.textContent = 'El usuario ya existe.';
    state.users.push({ id: crypto.randomUUID(), username, password: data.password, role: data.role, active: true });
    saveUsers();
    userForm.reset();
    userMsg.textContent = 'Usuario creado correctamente.';
    renderUsers();
    showToast('Usuario creado OK');
  });

  document.getElementById('selector-abogada').addEventListener('change', event => {
    state.selectedLawyer = event.target.value;
    renderLawyerModule();
  });

  const editDialog = document.getElementById('edit-dialog');
  const editForm = document.getElementById('edit-form');
  document.getElementById('cancel-edit').addEventListener('click', () => editDialog.close());
  editForm.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(editForm).entries());
    const client = state.clients.find(c => c.id === data.id);
    if (!client) return;
    if (!isRutValid(data.rut.trim())) return showToast('RUT inválido', 'error');
    Object.assign(client, data, { nombre: data.nombre.trim(), rut: data.rut.trim() });
    saveData();
    renderAll();
    editDialog.close();
    showToast('Ficha de cliente actualizada OK');
  });

  document.getElementById('btn-export').addEventListener('click', () => {
    const payload = JSON.stringify({ clients: state.clients, appointments: state.appointments, users: state.users }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tacam-backup-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    showToast('Respaldo exportado OK');
  });

  document.getElementById('import-file').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data.clients) || !Array.isArray(data.appointments) || !Array.isArray(data.users)) {
        throw new Error('Formato inválido');
      }
      state.clients = data.clients;
      state.appointments = data.appointments;
      state.users = data.users;
      saveData();
      saveUsers();
      renderAll();
      showToast('Respaldo importado OK');
    } catch {
      showToast('Error al importar respaldo', 'error');
    }
  });
}

setupTabs();
setupForms();
setupLogin();
