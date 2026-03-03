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

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function defaultAvatar(name) {
  const initials = (name || 'US').split(' ').filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' rx='32' fill='%238f203a'/><text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-family='Lato, Arial' font-size='24' fill='white'>${initials || 'U'}</text></svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
}

function ensureUserAvatars(users) {
  users.forEach(user => {
    if (!user.avatar) user.avatar = defaultAvatar(user.username);
  });
}

function loadUsers() {
  const users = load(STORAGE_KEYS.users);
  if (users.length) {
    ensureUserAvatars(users);
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
    return users;
  }
  const defaults = [{
    id: crypto.randomUUID(),
    username: 'admin',
    password: 'admin',
    role: 'admin',
    active: true,
    avatar: defaultAvatar('admin')
  }];
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
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-6px)';
    setTimeout(() => toast.remove(), 200);
  }, 2400);
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

function getClientById(id) {
  return state.clients.find(client => client.id === id);
}

function whatsappMessage(appointment, client) {
  return `Hola ${client.nombre}, te recordamos tu reunión TACAM el ${appointment.fecha} a las ${appointment.hora} con ${appointment.abogada}. Área: ${appointment.area}. Materia: ${appointment.materia}.`;
}

function emailLetterhead() {
  return [
    'TACAM Abogados',
    'Jorge Washington 2675, Oficinas 102 y 1003, Antofagasta',
    '+56 9 1234 5678 · www.tacam.cl',
    '----------------------------------------'
  ].join('\n');
}

function emailSubject(appointment, client) {
  return `Confirmación de reunión TACAM - ${client.nombre}`;
}

function emailBody(appointment, client) {
  return `${emailLetterhead()}\n\nEstimado/a ${client.nombre},\n\nTu reunión ha sido agendada con los siguientes datos:\n- Fecha: ${appointment.fecha}\n- Hora: ${appointment.hora}\n- Área: ${appointment.area}\n- Materia: ${appointment.materia}\n- Abogada: ${appointment.abogada}\n\nSi necesitas reagendar, responde este correo o contáctanos por WhatsApp.\n\nSaludos,\nTACAM Abogados`;
}

function googleCalendarUrl(appointment) {
  const start = new Date(`${appointment.fecha}T${appointment.hora}:00`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = date => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const text = encodeURIComponent(`Reunión TACAM - ${appointment.clienteNombre}`);
  const details = encodeURIComponent(`Área: ${appointment.area}\nMateria: ${appointment.materia}\nAbogada: ${appointment.abogada}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${fmt(start)}/${fmt(end)}&details=${details}`;
}

function whatsappUrl(appointment) {
  const client = getClientById(appointment.clienteId);
  const rawPhone = (client?.telefono || '').replace(/\D/g, '');
  const phone = rawPhone.startsWith('56') ? rawPhone : (rawPhone ? `56${rawPhone}` : '');
  const message = encodeURIComponent(whatsappMessage(appointment, client || { nombre: appointment.clienteNombre }));
  return phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;
}

function mailtoUrl(appointment) {
  const client = getClientById(appointment.clienteId);
  const to = encodeURIComponent(client?.email || '');
  const subject = encodeURIComponent(emailSubject(appointment, client || { nombre: appointment.clienteNombre }));
  const body = encodeURIComponent(emailBody(appointment, client || { nombre: appointment.clienteNombre }));
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

function renderPreviews() {
  const form = document.getElementById('form-cita');
  const data = Object.fromEntries(new FormData(form).entries());
  const client = getClientById(data.clienteId) || { nombre: 'Cliente' };
  const appointment = {
    fecha: data.fecha || 'AAAA-MM-DD',
    hora: data.hora || 'HH:MM',
    area: data.area || '-',
    materia: data.materia || '-',
    abogada: data.abogada || '-',
    clienteNombre: client.nombre
  };
  document.getElementById('preview-whatsapp').textContent = whatsappMessage(appointment, client);
  document.getElementById('preview-email').textContent = emailBody(appointment, client);
}

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

function renderClientTables() {
  const tbodyNo = document.getElementById('tabla-no-contrataron');
  const tbodyYes = document.getElementById('tabla-contratados');
  const noContract = state.clients.filter(client => client.contrato === 'No Contrató');
  const contracted = state.clients.filter(client => client.contrato === 'Contrató');

  const actions = client => {
    const editBtn = canEditClients() ? `<button class="secondary" data-edit-client="${client.id}">Editar</button>` : '<span class="muted">Sin permiso</span>';
    const promoteBtn = canEditClients() && client.contrato === 'No Contrató' ? `<button class="primary" data-promote="${client.id}">Marcar contrató</button>` : '';
    return `${editBtn} ${promoteBtn}`;
  };

  tbodyNo.innerHTML = noContract.length
    ? noContract.map(client => `<tr><td>${client.nombre}</td><td>${client.rut}</td><td>${client.area}</td><td>${client.abogada}</td><td>${actions(client)}</td></tr>`).join('')
    : '<tr><td colspan="5" class="empty">Sin registros.</td></tr>';

  tbodyYes.innerHTML = contracted.length
    ? contracted.map(client => `<tr><td>${client.nombre}</td><td>${client.rut}</td><td>${client.area}</td><td>${client.abogada}</td><td>${actions(client)}</td></tr>`).join('')
    : '<tr><td colspan="5" class="empty">Sin registros.</td></tr>';

  document.querySelectorAll('[data-promote]').forEach(button => {
    button.addEventListener('click', () => {
      const client = getClientById(button.dataset.promote);
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
            <a class="link-btn" target="_blank" rel="noreferrer" href="${whatsappUrl(appointment)}">WhatsApp</a>
            <a class="link-btn" href="${mailtoUrl(appointment)}">Correo</a>
            <a class="link-btn" target="_blank" rel="noreferrer" href="${googleCalendarUrl(appointment)}">Google Calendar</a>
          </td>
        </tr>
      `).join('')
    : '<tr><td colspan="5" class="empty">Sin citas agendadas.</td></tr>';

  document.querySelectorAll('[data-reschedule]').forEach(button => {
    button.addEventListener('click', () => {
      const item = state.appointments.find(appointment => appointment.id === button.dataset.reschedule);
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

  const scoped = state.appointments.filter(appointment => appointment.abogada === state.selectedLawyer);
  const upcoming = scoped.filter(appointment => new Date(`${appointment.fecha}T${appointment.hora}`) >= new Date()).length;
  const uniqueClients = new Set(scoped.map(appointment => appointment.clienteId)).size;

  document.getElementById('stats-abogada').innerHTML = `
    <div class="stat"><span>Total reuniones</span><strong>${scoped.length}</strong></div>
    <div class="stat"><span>Próximas</span><strong>${upcoming}</strong></div>
    <div class="stat"><span>Clientes únicos</span><strong>${uniqueClients}</strong></div>
    <div class="stat"><span>Reagendadas</span><strong>${scoped.filter(appointment => appointment.estado === 'Reagendada').length}</strong></div>
  `;

  document.getElementById('tabla-abogada-citas').innerHTML = scoped.length
    ? scoped
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`))
      .map(appointment => `<tr><td>${appointment.clienteNombre}</td><td>${appointment.fecha} ${appointment.hora}</td><td>${appointment.estado}</td><td><a class="link-btn" target="_blank" rel="noreferrer" href="${whatsappUrl(appointment)}">WhatsApp</a> · <a class="link-btn" href="${mailtoUrl(appointment)}">Correo</a></td></tr>`)
      .join('')
    : '<tr><td colspan="4" class="empty">Sin reuniones para esta abogada.</td></tr>';
}

function renderAdminCalendar() {
  const container = document.getElementById('calendar-grid');
  const grouped = state.appointments.reduce((acc, appointment) => {
    acc[appointment.fecha] = acc[appointment.fecha] || [];
    acc[appointment.fecha].push(appointment);
    return acc;
  }, {});

  const days = Object.keys(grouped).sort();
  container.innerHTML = days.length
    ? days.map(day => `
      <article class="day-card">
        <h4>${day}</h4>
        <ul>
          ${grouped[day].sort((a, b) => a.hora.localeCompare(b.hora)).map(appointment => `<li>${appointment.hora} · ${appointment.clienteNombre} · ${appointment.abogada} · <a class="link-btn" target="_blank" rel="noreferrer" href="${whatsappUrl(appointment)}">WhatsApp</a> / <a class="link-btn" href="${mailtoUrl(appointment)}">Correo</a></li>`).join('')}
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
      <td><img class="avatar" src="${user.avatar || defaultAvatar(user.username)}" alt="Foto de ${user.username}" /></td>
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
  document.querySelectorAll('#form-cliente input, #form-cliente select, #form-cliente textarea, #form-cliente button').forEach(element => {
    element.disabled = !canEditClients();
  });
  document.querySelectorAll('#form-cita input, #form-cita select, #form-cita textarea, #form-cita button').forEach(element => {
    element.disabled = !canSchedule();
  });
}

function renderSessionInfo() {
  const user = state.users.find(item => item.username === state.session.username);
  const avatar = user?.avatar || defaultAvatar(state.session.username);
  document.getElementById('session-info').innerHTML = `<span class="session-chip"><img class="avatar avatar-sm" src="${avatar}" alt="perfil" /> Sesión: ${state.session.username} (${roleLabel(state.session.role)})</span>`;
}

function renderAll() {
  applyAccessControl();
  renderSessionInfo();
  renderClientTables();
  renderClientOptions();
  renderPreviews();
  renderVisits();
  renderLawyerModule();
  renderAdminCalendar();
  renderUsers();
}

function openEditClient(id) {
  if (!canEditClients()) return;
  const client = getClientById(id);
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
    const client = getClientById(data.clienteId);
    if (!client) return citaMsg.textContent = 'Debe seleccionar un cliente contratado.';

    const appointment = { id: crypto.randomUUID(), ...data, clienteNombre: client.nombre, estado: 'Confirmada' };
    state.appointments.push(appointment);
    saveData();
    renderAll();
    citaForm.reset();
    citaMsg.textContent = 'Cita agendada y recordatorio configurado.';
    showToast('Cita agendada OK');
  });

  userForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (state.session?.role !== 'admin') {
      userMsg.textContent = 'Solo administradores pueden crear usuarios.';
      showToast('Sin permisos para crear usuarios', 'error');
      return;
    }

    const formData = new FormData(userForm);
    const username = String(formData.get('username')).trim().toLowerCase();
    const password = String(formData.get('password'));
    const role = String(formData.get('role'));
    const avatarFile = formData.get('avatar');

    if (!username || !password) return userMsg.textContent = 'Completa usuario y clave.';
    if (state.users.some(user => user.username === username)) return userMsg.textContent = 'El usuario ya existe.';

    let avatar = defaultAvatar(username);
    if (avatarFile && avatarFile.size) {
      try {
        avatar = await toDataUrl(avatarFile);
      } catch {
        showToast('No se pudo cargar la foto, se usó avatar por defecto', 'error');
      }
    }

    state.users.push({ id: crypto.randomUUID(), username, password, role, active: true, avatar });
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
    const client = getClientById(data.id);
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
    link.download = `tacam-backup-${new Date().toISOString().slice(0, 10)}.json`;
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
      if (!Array.isArray(data.clients) || !Array.isArray(data.appointments) || !Array.isArray(data.users)) throw new Error('Formato inválido');
      state.clients = data.clients;
      state.appointments = data.appointments;
      state.users = data.users;
      ensureUserAvatars(state.users);
      saveData();
      saveUsers();
      renderAll();
      showToast('Respaldo importado OK');
    } catch {
      showToast('Error al importar respaldo', 'error');
    }
  });

  document.querySelectorAll('#form-cita input, #form-cita select, #form-cita textarea').forEach(el => {
    el.addEventListener('input', renderPreviews);
    el.addEventListener('change', renderPreviews);
  });
}

setupTabs();
setupForms();
setupLogin();
