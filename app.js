const bookingsBody = document.getElementById('bookings-body');
const agendaBody = document.getElementById('agenda-body');
const bookingForm = document.getElementById('booking-form');
const lawyerFilter = document.getElementById('lawyer-filter');
const lawyerForm = document.getElementById('lawyer-form');
const lawyerList = document.getElementById('lawyer-list');
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

function notifyBooking(booking) {
  const destination = cleanPhone(booking.phone);
  if (!destination) return;
  const msg = encodeURIComponent(buildTacamMessage(booking));
  window.open(`https://wa.me/${destination}?text=${msg}`, '_blank', 'noopener');
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

function renderAll() {
  renderLawyerOptions();
  renderBookings();
  renderAgenda();
  renderLawyers();
}

bookingForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(bookingForm);
  const bookings = getBookings();
  bookings.unshift({
    id: crypto.randomUUID(),
    customer: String(data.get('customer') || '').trim(),
    phone: String(data.get('phone') || '').trim(),
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

lawyerFilter.addEventListener('change', renderAgenda);

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

switchModule('create');
renderAll();
setInterval(renderAll, 5000);
