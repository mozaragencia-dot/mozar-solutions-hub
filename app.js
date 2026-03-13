const loginScreen = document.getElementById('login-screen');
const appShell = document.getElementById('app-shell');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

const bookingsBody = document.getElementById('bookings-body');
const agendaBody = document.getElementById('agenda-body');
const bookingForm = document.getElementById('booking-form');
const lawyerFilter = document.getElementById('lawyer-filter');
const agendaMonthInput = document.getElementById('agenda-month');
const agendaCalendar = document.getElementById('agenda-calendar');
const agendaLegend = document.getElementById('agenda-color-legend');
const lawyerForm = document.getElementById('lawyer-form');
const lawyerList = document.getElementById('lawyer-list');
const lawyerCalendarFilter = document.getElementById('lawyer-calendar-filter');
const lawyerCalendarMonth = document.getElementById('lawyer-calendar-month');
const lawyerCalendar = document.getElementById('lawyer-calendar');
const lawyerCalendarLegend = document.getElementById('lawyer-calendar-legend');
const sharedOnlyInput = document.getElementById('shared-only');
const profileForm = document.getElementById('profile-form');
const profileList = document.getElementById('profile-list');
const assignedToSelect = bookingForm.elements.assignedTo;
const moduleTabs = document.querySelectorAll('[data-module-tab]');
const modulePanels = document.querySelectorAll('[data-module-panel]');

function switchModule(moduleName) {
  moduleTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.moduleTab === moduleName);
  });

  modulePanels.forEach(panel => {
    panel.classList.toggle('active', panel.dataset.modulePanel === moduleName);
  });
}

function showApp() {
  loginScreen.hidden = true;
  appShell.hidden = false;
}

function showLogin() {
  loginScreen.hidden = false;
  appShell.hidden = true;
  loginError.hidden = true;
}

const ALLOWED_CREDENTIALS = [
  { username: 'admin', password: 'admin' }
];

const LAWYER_COLORS = ['#8f203a', '#2166a5', '#2a9d8f', '#e76f51', '#6a4c93', '#e9c46a', '#4f772d'];

function tryLogin(username, password) {
  return ALLOWED_CREDENTIALS.some(cred => cred.username === username && cred.password === password);
}

function notifyBooking(booking) {
  const destination = cleanPhone(booking.phone);
  if (!destination) return;
  const msg = encodeURIComponent(buildTacamMessage(booking));
  window.open(`https://wa.me/${destination}?text=${msg}`, '_blank', 'noopener');
}

function buildRescheduleMessage(booking, fromDate, toDate) {
  const fromText = `${fromDate || '-'} ${booking.time || ''}`.trim();
  const toText = `${toDate || '-'} ${booking.time || ''}`.trim();
  return `TACAM: su cita fue reagendada. Cliente: ${booking.customer || 'Cliente'}. Antes: ${fromText}. Nueva fecha: ${toText}. Abogada: ${booking.assignedTo || 'Por confirmar'}.`;
}

function getLawyerPhone(lawyerName) {
  const lawyer = getLawyers().find(item => (item.name || '').trim() === (lawyerName || '').trim());
  return lawyer ? cleanPhone(lawyer.phone) : '';
}

function notifyReschedule(booking, fromDate, toDate) {
  const message = buildRescheduleMessage(booking, fromDate, toDate);
  const encoded = encodeURIComponent(message);
  const targets = [cleanPhone(booking.phone), getLawyerPhone(booking.assignedTo)].filter(Boolean);
  const uniqueTargets = [...new Set(targets)];

  if (uniqueTargets.length) {
    uniqueTargets.forEach(target => {
      window.open(`https://wa.me/${target}?text=${encoded}`, '_blank', 'noopener');
    });
  }

  const email = String(booking.email || '').trim();
  if (email) {
    const subject = encodeURIComponent('Reagendamiento de cita TACAM');
    window.open(`mailto:${encodeURIComponent(email)}?subject=${subject}&body=${encoded}`, '_blank', 'noopener');
  }
}

function moveBookingDate(bookingId, newDate) {
  if (!newDate) return;
  const bookings = getBookings();
  const booking = bookings.find(item => item.id === bookingId);
  if (!booking || booking.date === newDate) return;

  const oldDate = booking.date;
  booking.date = newDate;
  saveBookings(bookings);
  renderAll();
  notifyReschedule(booking, oldDate, newDate);
}

function updateBooking(bookingId, updater) {
  const bookings = getBookings();
  const booking = bookings.find(item => item.id === bookingId);
  if (!booking) return;
  updater(booking);
  saveBookings(bookings);
  renderAll();
}

function formatAppointment(booking) {
  return `${booking.date || '-'} ${booking.time || ''}`.trim();
}

function appendCell(row, text) {
  const cell = document.createElement('td');
  cell.textContent = text;
  row.appendChild(cell);
  return cell;
}

function getLawyerNames() {
  const names = new Set();

  Array.from(assignedToSelect.options).forEach(option => {
    const name = option.value.trim();
    if (name) names.add(name);
  });

  getLawyers().forEach(lawyer => {
    const name = String(lawyer.name || '').trim();
    if (name) names.add(name);
  });

  getBookings().forEach(booking => {
    const name = String(booking.assignedTo || '').trim();
    if (name) names.add(name);
  });

  return [...names].sort((a, b) => a.localeCompare(b, 'es'));
}

function fillSelectWithNames(select, names, firstLabel) {
  const currentValue = select.value;
  select.replaceChildren();

  const first = document.createElement('option');
  first.value = '';
  first.textContent = firstLabel;
  select.appendChild(first);

  names.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });

  if (names.includes(currentValue)) {
    select.value = currentValue;
  }
}

function renderLawyerOptions() {
  const names = getLawyerNames();
  fillSelectWithNames(assignedToSelect, names, 'Seleccione');
  fillSelectWithNames(lawyerFilter, names, 'Todos');
  fillSelectWithNames(lawyerCalendarFilter, names, 'Todas');
}

function getLawyerStats(lawyerName) {
  const stats = { total: 0, nueva: 0, confirmada: 0, atendida: 0, cancelada: 0 };

  getBookings().forEach(booking => {
    if ((booking.assignedTo || '').trim() !== lawyerName) return;
    stats.total += 1;
    if (Object.hasOwn(stats, booking.status)) {
      stats[booking.status] += 1;
    }
  });

  return stats;
}

function monthValueFromDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getLawyerColor(name) {
  const clean = String(name || '').trim();
  if (!clean) return LAWYER_COLORS[0];
  const index = [...clean].reduce((sum, char) => sum + char.charCodeAt(0), 0) % LAWYER_COLORS.length;
  return LAWYER_COLORS[index];
}

function getCalendarBookings(selectedLawyer, selectedMonth, onlyShared = false) {
  const allBookings = getBookings().filter(booking => booking.status !== 'cancelada' && booking.date);
  const byMonth = allBookings.filter(booking => !selectedMonth || booking.date.slice(0, 7) === selectedMonth);
  const byLawyer = byMonth.filter(booking => !selectedLawyer || booking.assignedTo === selectedLawyer);

  if (!onlyShared) return byLawyer;

  const slotMap = new Map();
  byMonth.forEach(booking => {
    const slot = `${booking.date}|${booking.time || ''}`;
    if (!slotMap.has(slot)) slotMap.set(slot, new Set());
    slotMap.get(slot).add((booking.assignedTo || '').trim());
  });

  return byLawyer.filter(booking => {
    const slot = `${booking.date}|${booking.time || ''}`;
    return (slotMap.get(slot) || new Set()).size > 1;
  });
}

function renderCalendarLegend(container, lawyerNames) {
  container.replaceChildren();
  if (!lawyerNames.length) return;

  lawyerNames.forEach(name => {
    const item = document.createElement('span');
    item.className = 'legend-item';

    const dot = document.createElement('span');
    dot.className = 'legend-dot';
    dot.style.backgroundColor = getLawyerColor(name);
    item.appendChild(dot);

    const text = document.createElement('span');
    text.textContent = name;
    item.appendChild(text);

    container.appendChild(item);
  });
}

function renderCalendar(container, bookings, selectedMonth) {
  const monthValue = selectedMonth || monthValueFromDate(new Date());
  const [yearStr, monthStr] = monthValue.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);

  container.replaceChildren();

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  weekDays.forEach(day => {
    const head = document.createElement('div');
    head.className = 'calendar-head';
    head.textContent = day;
    container.appendChild(head);
  });

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    const empty = document.createElement('p');
    empty.className = 'calendar-empty';
    empty.textContent = 'Selecciona un mes válido.';
    container.appendChild(empty);
    return;
  }

  const firstDay = new Date(year, month - 1, 1);
  const lastDayDate = new Date(year, month, 0).getDate();
  const firstWeekDay = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((firstWeekDay + lastDayDate) / 7) * 7;

  const bookingsByDate = new Map();
  bookings.forEach(booking => {
    if (!bookingsByDate.has(booking.date)) bookingsByDate.set(booking.date, []);
    bookingsByDate.get(booking.date).push(booking);
  });

  for (let cell = 0; cell < totalCells; cell += 1) {
    const dayNumber = cell - firstWeekDay + 1;
    const inMonth = dayNumber >= 1 && dayNumber <= lastDayDate;
    const dayCell = document.createElement('div');
    dayCell.className = `calendar-day${inMonth ? '' : ' muted'}`;

    if (inMonth) {
      const dayLabel = document.createElement('div');
      dayLabel.className = 'day-number';
      dayLabel.textContent = String(dayNumber);
      dayCell.appendChild(dayLabel);

      const dateKey = `${yearStr}-${String(month).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
      dayCell.dataset.date = dateKey;
      dayCell.addEventListener('dragover', event => {
        event.preventDefault();
        dayCell.classList.add('drag-over');
      });
      dayCell.addEventListener('dragleave', () => {
        dayCell.classList.remove('drag-over');
      });
      dayCell.addEventListener('drop', event => {
        event.preventDefault();
        dayCell.classList.remove('drag-over');
        const bookingId = event.dataTransfer?.getData('text/booking-id');
        if (bookingId) moveBookingDate(bookingId, dateKey);
      });

      const dayBookings = bookingsByDate.get(dateKey) || [];
      dayBookings
        .sort((a, b) => `${a.time || ''}`.localeCompare(`${b.time || ''}`))
        .forEach(booking => {
          const event = document.createElement('div');
          event.className = 'calendar-event';
          event.draggable = true;
          event.dataset.bookingId = booking.id;
          event.addEventListener('dragstart', dragEvent => {
            dragEvent.dataTransfer?.setData('text/booking-id', booking.id);
          });
          event.style.setProperty('--event-color', getLawyerColor(booking.assignedTo));
          event.textContent = `${booking.time || '--:--'} · ${booking.assignedTo || 'Sin abogada'} · ${booking.customer || 'Cliente'}`;
          dayCell.appendChild(event);
        });
    }

    container.appendChild(dayCell);
  }
}

function renderAgendaCalendar() {
  const selectedLawyer = lawyerFilter.value.trim();
  const selectedMonth = agendaMonthInput.value;
  const bookings = getCalendarBookings(selectedLawyer, selectedMonth, false);
  const names = [...new Set(bookings.map(booking => booking.assignedTo).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  renderCalendarLegend(agendaLegend, names);
  renderCalendar(agendaCalendar, bookings, selectedMonth);
}

function renderLawyerCalendar() {
  const selectedLawyer = lawyerCalendarFilter.value.trim();
  const selectedMonth = lawyerCalendarMonth.value;
  const onlyShared = Boolean(sharedOnlyInput.checked);
  const bookings = getCalendarBookings(selectedLawyer, selectedMonth, onlyShared);
  const names = [...new Set(bookings.map(booking => booking.assignedTo).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  renderCalendarLegend(lawyerCalendarLegend, names);
  renderCalendar(lawyerCalendar, bookings, selectedMonth);
}

function renderBookings() {
  const bookings = getBookings();
  bookingsBody.replaceChildren();

  if (!bookings.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 8;
    cell.textContent = 'Sin reservas registradas';
    row.appendChild(cell);
    bookingsBody.appendChild(row);
    return;
  }

  bookings.forEach(booking => {
    const row = document.createElement('tr');

    appendCell(row, fmtDate(booking.createdAt));
    appendCell(row, booking.customer || '');
    appendCell(row, booking.phone || '');
    appendCell(row, formatAppointment(booking));

    const assignCell = document.createElement('td');
    const assignInput = document.createElement('input');
    assignInput.dataset.assignInput = booking.id;
    assignInput.value = booking.assignedTo || '';
    assignInput.placeholder = 'Nombre abogado';
    assignCell.appendChild(assignInput);
    row.appendChild(assignCell);

    const statusCell = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.className = `badge ${booking.status}`;
    statusBadge.textContent = statusLabel(booking.status);
    statusCell.appendChild(statusBadge);
    row.appendChild(statusCell);

    const actionsCell = document.createElement('td');

    const confirmBtn = document.createElement('button');
    confirmBtn.dataset.confirmBtn = booking.id;
    confirmBtn.textContent = 'Confirmar';
    actionsCell.appendChild(confirmBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.dataset.cancelBtn = booking.id;
    cancelBtn.textContent = 'Cancelar';
    actionsCell.appendChild(cancelBtn);

    const saveBtn = document.createElement('button');
    saveBtn.dataset.saveBtn = booking.id;
    saveBtn.textContent = 'Guardar';
    actionsCell.appendChild(saveBtn);

    row.appendChild(actionsCell);

    const notifyCell = document.createElement('td');
    const notifyBtn = document.createElement('button');
    notifyBtn.dataset.notifyBtn = booking.id;
    notifyBtn.textContent = 'WhatsApp';
    notifyCell.appendChild(notifyBtn);
    row.appendChild(notifyCell);

    bookingsBody.appendChild(row);
  });

  bookingsBody.querySelectorAll('[data-save-btn]').forEach(btn => {
    btn.onclick = () => updateBooking(btn.dataset.saveBtn, booking => {
      const input = bookingsBody.querySelector(`[data-assign-input="${booking.id}"]`);
      booking.assignedTo = input.value.trim();
    });
  });

  bookingsBody.querySelectorAll('[data-confirm-btn]').forEach(btn => {
    btn.onclick = () => updateBooking(btn.dataset.confirmBtn, booking => { booking.status = 'confirmada'; });
  });

  bookingsBody.querySelectorAll('[data-cancel-btn]').forEach(btn => {
    btn.onclick = () => updateBooking(btn.dataset.cancelBtn, booking => { booking.status = 'cancelada'; });
  });

  bookingsBody.querySelectorAll('[data-notify-btn]').forEach(btn => {
    btn.onclick = () => {
      const booking = getBookings().find(item => item.id === btn.dataset.notifyBtn);
      if (booking) notifyBooking(booking);
    };
  });
}

function renderAgenda() {
  const selectedLawyer = lawyerFilter.value.trim();
  const bookings = getBookings().filter(booking =>
    booking.status !== 'cancelada' && (!selectedLawyer || booking.assignedTo === selectedLawyer)
  );

  agendaBody.replaceChildren();

  if (!bookings.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.textContent = 'Sin citas para mostrar';
    row.appendChild(cell);
    agendaBody.appendChild(row);
  } else {
    bookings.forEach(booking => {
      const row = document.createElement('tr');
      appendCell(row, booking.customer || '');
      appendCell(row, formatAppointment(booking));
      appendCell(row, booking.notes || '-');

      const statusCell = document.createElement('td');
      const statusBadge = document.createElement('span');
      statusBadge.className = `badge ${booking.status}`;
      statusBadge.textContent = statusLabel(booking.status);
      statusCell.appendChild(statusBadge);
      row.appendChild(statusCell);

      const actionCell = document.createElement('td');
      const attendBtn = document.createElement('button');
      attendBtn.dataset.attend = booking.id;
      attendBtn.textContent = 'Marcar atendida';
      actionCell.appendChild(attendBtn);
      row.appendChild(actionCell);

      agendaBody.appendChild(row);
    });
  }

  agendaBody.querySelectorAll('[data-attend]').forEach(btn => {
    btn.onclick = () => updateBooking(btn.dataset.attend, booking => { booking.status = 'atendida'; });
  });
}

function renderLawyers() {
  const lawyers = getLawyers();
  lawyerList.replaceChildren();

  if (!lawyers.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No hay abogados cargados.';
    lawyerList.appendChild(empty);
    return;
  }

  lawyers.forEach(lawyer => {
    const card = document.createElement('article');
    card.className = 'lawyer-card';

    const photo = document.createElement('img');
    photo.src = lawyer.photo;
    photo.alt = `Foto de ${lawyer.name || ''}`;
    card.appendChild(photo);

    const content = document.createElement('div');
    const name = document.createElement('h3');
    name.textContent = lawyer.name || '';
    content.appendChild(name);

    const specialty = document.createElement('p');
    specialty.textContent = lawyer.specialty || 'Sin especialidad';
    content.appendChild(specialty);

    const phone = document.createElement('small');
    phone.textContent = lawyer.phone || 'Sin WhatsApp';
    content.appendChild(phone);

    const stats = getLawyerStats(lawyer.name || '');
    const statsList = document.createElement('ul');
    statsList.className = 'lawyer-stats';

    const statsRows = [
      `Total: ${stats.total}`,
      `Nuevas: ${stats.nueva}`,
      `Confirmadas: ${stats.confirmada}`,
      `Atendidas: ${stats.atendida}`,
      `Canceladas: ${stats.cancelada}`
    ];

    statsRows.forEach(itemText => {
      const item = document.createElement('li');
      item.textContent = itemText;
      statsList.appendChild(item);
    });

    content.appendChild(statsList);
    card.appendChild(content);
    lawyerList.appendChild(card);
  });
}

function renderProfiles() {
  const profiles = getProfiles();
  profileList.replaceChildren();

  if (!profiles.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No hay perfiles creados.';
    profileList.appendChild(empty);
    return;
  }

  profiles.forEach(profile => {
    const card = document.createElement('article');
    card.className = 'profile-card';

    const content = document.createElement('div');
    const title = document.createElement('h4');
    title.textContent = `${profile.name} (${profile.role})`;
    content.appendChild(title);

    const user = document.createElement('small');
    user.textContent = `Usuario: ${profile.username}`;
    content.appendChild(user);

    const perms = document.createElement('ul');
    perms.className = 'profile-perms';
    (profile.permissions || []).forEach(permission => {
      const item = document.createElement('li');
      item.textContent = permission;
      perms.appendChild(item);
    });

    content.appendChild(perms);
    card.appendChild(content);
    profileList.appendChild(card);
  });
}

function renderAll() {
  renderLawyerOptions();
  renderBookings();
  renderAgenda();
  renderAgendaCalendar();
  renderLawyers();
  renderLawyerCalendar();
  renderProfiles();
}

loginForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(loginForm);
  const username = String(data.get('username') || '').trim();
  const password = String(data.get('password') || '').trim();

  if (tryLogin(username, password)) {
    saveSession({ loggedIn: true, username });
    loginError.hidden = true;
    showApp();
    renderAll();
  } else {
    loginError.hidden = false;
  }
});

bookingForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(bookingForm);
  const bookings = getBookings();
  bookings.unshift({
    id: crypto.randomUUID(),
    customer: String(data.get('customer') || '').trim(),
    phone: String(data.get('phone') || '').trim(),
    email: String(data.get('email') || '').trim(),
    date: String(data.get('date') || '').trim(),
    time: String(data.get('time') || '').trim(),
    assignedTo: String(data.get('assignedTo') || '').trim(),
    notes: String(data.get('notes') || '').trim(),
    status: 'nueva',
    createdAt: new Date().toISOString()
  });
  saveBookings(bookings);
  bookingForm.reset();
  renderAll();
});

lawyerFilter.addEventListener('change', () => {
  renderAgenda();
  renderAgendaCalendar();
});
agendaMonthInput.addEventListener('change', renderAgendaCalendar);
lawyerCalendarFilter.addEventListener('change', renderLawyerCalendar);
lawyerCalendarMonth.addEventListener('change', renderLawyerCalendar);
sharedOnlyInput.addEventListener('change', renderLawyerCalendar);

moduleTabs.forEach(tab => {
  tab.addEventListener('click', () => switchModule(tab.dataset.moduleTab));
});

lawyerForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(lawyerForm);
  const file = data.get('photo');
  if (!(file instanceof File) || !file.size) return;

  const name = String(data.get('name') || '').trim();
  if (!name) return;

  const lawyers = getLawyers();
  const existing = lawyers.find(lawyer => (lawyer.name || '').trim().toLowerCase() === name.toLowerCase());

  if (existing) {
    existing.specialty = String(data.get('specialty') || '').trim();
    existing.phone = String(data.get('phone') || '').trim();
    existing.photo = await fileToDataUrl(file);
  } else {
    lawyers.unshift({
      id: crypto.randomUUID(),
      name,
      specialty: String(data.get('specialty') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      photo: await fileToDataUrl(file)
    });
  }

  saveLawyers(lawyers);
  lawyerForm.reset();
  renderAll();
});

profileForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(profileForm);
  const name = String(data.get('name') || '').trim();
  const username = String(data.get('username') || '').trim();
  const role = String(data.get('role') || '').trim();

  if (!name || !username || !role) return;

  const permissions = [];
  if (data.get('permBookings')) permissions.push('Reservas');
  if (data.get('permAgenda')) permissions.push('Agenda');
  if (data.get('permLawyers')) permissions.push('Abogadas');
  if (data.get('permReports')) permissions.push('Estadísticas');

  const profiles = getProfiles();
  const existing = profiles.find(profile => (profile.username || '').trim().toLowerCase() === username.toLowerCase());

  if (existing) {
    existing.name = name;
    existing.role = role;
    existing.permissions = permissions;
  } else {
    profiles.unshift({
      id: crypto.randomUUID(),
      name,
      username,
      role,
      permissions
    });
  }

  saveProfiles(profiles);
  profileForm.reset();
  renderProfiles();
});

switchModule('create');

const currentMonth = monthValueFromDate(new Date());
agendaMonthInput.value = currentMonth;
lawyerCalendarMonth.value = currentMonth;

saveSession({ loggedIn: false });
showLogin();

setInterval(() => {
  if (!appShell.hidden) renderAll();
}, 5000);
