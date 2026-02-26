const STORAGE_KEYS = {
  clients: 'tacam_clients',
  appointments: 'tacam_appointments'
};

const state = {
  clients: load(STORAGE_KEYS.clients),
  appointments: load(STORAGE_KEYS.appointments)
};

function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(state.clients));
  localStorage.setItem(STORAGE_KEYS.appointments, JSON.stringify(state.appointments));
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

function renderTables() {
  const tbodyNo = document.getElementById('tabla-no-contrataron');
  const tbodySi = document.getElementById('tabla-contratados');

  const noContrataron = state.clients.filter(c => c.contrato === 'No Contrató');
  const contrataron = state.clients.filter(c => c.contrato === 'Contrató');

  tbodyNo.innerHTML = noContrataron.length ? noContrataron.map(c => `
    <tr>
      <td>${c.nombre}</td><td>${c.rut}</td><td>${c.area}</td><td>${c.materia}</td><td>${c.abogada}</td>
      <td><button data-promote="${c.id}" class="primary">Marcar contrató</button></td>
    </tr>
  `).join('') : '<tr><td colspan="6" class="empty">Sin registros.</td></tr>';

  tbodySi.innerHTML = contrataron.length ? contrataron.map(c => `
    <tr><td>${c.nombre}</td><td>${c.rut}</td><td>${c.area}</td><td>${c.materia}</td><td>${c.abogada}</td></tr>
  `).join('') : '<tr><td colspan="5" class="empty">Sin registros.</td></tr>';

  tbodyNo.querySelectorAll('[data-promote]').forEach(btn => {
    btn.addEventListener('click', () => {
      const client = state.clients.find(c => c.id === btn.dataset.promote);
      if (client) {
        client.contrato = 'Contrató';
        save();
        renderAll();
      }
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
      .slice().sort((a,b) => a.fecha.localeCompare(b.fecha))
      .map(a => `<tr><td>${a.abogada}</td><td>${a.clienteNombre}</td><td>${a.fecha} ${a.hora}</td><td>${a.estado}</td></tr>`).join('')
    : '<tr><td colspan="4" class="empty">Sin citas agendadas.</td></tr>';

  const totals = state.appointments.reduce((acc, a) => {
    acc[a.abogada] = (acc[a.abogada] || 0) + (a.estado === 'Realizada' ? 1 : 0);
    return acc;
  }, {});

  const sorted = Object.entries(totals).sort((a,b) => b[1]-a[1]);
  ranking.innerHTML = sorted.length
    ? sorted.map(([abogada, count]) => `<li>${abogada}: <strong>${count}</strong> visitas</li>`).join('')
    : '<li class="empty">Aún no hay visitas realizadas.</li>';
}

function renderAll() {
  renderTables();
  renderClientOptions();
  renderVisits();
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

function setupForms() {
  const clientForm = document.getElementById('form-cliente');
  const clientMsg = document.getElementById('cliente-msg');
  const citaForm = document.getElementById('form-cita');
  const citaMsg = document.getElementById('cita-msg');

  clientForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(clientForm).entries());
    if (!data.nombre.trim()) return clientMsg.textContent = 'Nombre es obligatorio.';
    if (!isRutValid(data.rut.trim())) return clientMsg.textContent = 'RUT inválido.';

    state.clients.push({
      id: crypto.randomUUID(),
      ...data,
      nombre: data.nombre.trim(),
      rut: data.rut.trim()
    });
    save();
    renderAll();
    clientForm.reset();
    clientMsg.textContent = 'Cliente guardado correctamente.';
  });

  citaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(citaForm).entries());
    const client = state.clients.find(c => c.id === data.clienteId);
    if (!client) return citaMsg.textContent = 'Debe seleccionar un cliente contratado.';

    state.appointments.push({
      id: crypto.randomUUID(),
      ...data,
      clienteNombre: client.nombre,
      estado: 'Confirmada'
    });
    save();
    renderAll();
    citaForm.reset();
    citaMsg.textContent = 'Cita agendada y recordatorio configurado.';
  });
}

setupTabs();
setupForms();
renderAll();
