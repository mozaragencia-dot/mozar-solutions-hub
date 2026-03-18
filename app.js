const bookingsBody = document.getElementById('bookings-body');
const agendaBody = document.getElementById('agenda-body');
const remindersBody = document.getElementById('reminders-body');
const bookingForm = document.getElementById('booking-form');
const lawyerFilter = document.getElementById('lawyer-filter');
const lawyerForm = document.getElementById('lawyer-form');
const lawyerList = document.getElementById('lawyer-list');

function notifyBooking(booking) {
  const destination = cleanPhone(booking.phone);
  if (!destination) return;
  const msg = encodeURIComponent(buildTacamMessage(booking));
  window.open(`https://wa.me/${destination}?text=${msg}`, '_blank', 'noopener');
}

function ensureBookingMeta(booking) {
  const serviceType = booking.serviceType || 'Consulta general';
  const reminderTiming = booking.reminderTiming || 'Sin recordatorio';
  const internalReminder = booking.internalReminder !== false;
  const internalTask = booking.internalTask || (serviceType === 'Visita cartel'
    ? 'Agendar visita cartel'
    : (internalReminder ? 'Seguimiento general' : 'Sin tarea'));

  booking.serviceType = serviceType;
  booking.reminderTiming = reminderTiming;
  booking.internalReminder = internalReminder;
  booking.internalTask = internalTask;
  return booking;
}

function updateBooking(bookingId, updater) {
  const bookings = getBookings();
  const booking = bookings.find(item => item.id === bookingId);
  if (!booking) return;
  ensureBookingMeta(booking);
  updater(booking);
  saveBookings(bookings);
  renderAll();
}

function formatAppointment(booking) {
  return `${booking.date || '-'} ${booking.time || ''}`.trim();
}

function createCell(text) {
  const cell = document.createElement('td');
  cell.textContent = text;
  return cell;
}

function createButton(label, dataKey, value) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset[dataKey] = value;
  button.textContent = label;
  return button;
}

function createBadge(text, className) {
  const badge = document.createElement('span');
  badge.className = className;
  badge.textContent = text;
  return badge;
}

function renderEmptyRow(container, colspan, message) {
  container.replaceChildren();
  const row = document.createElement('tr');
  const cell = document.createElement('td');
  cell.colSpan = colspan;
  cell.textContent = message;
  row.appendChild(cell);
  container.appendChild(row);
}

function getNormalizedBookings() {
  return getBookings().map(ensureBookingMeta);
}

function renderBookings() {
  const bookings = getNormalizedBookings();
  if (!bookings.length) {
    renderEmptyRow(bookingsBody, 9, 'Sin reservas registradas');
    return;
  }

  const rows = bookings.map(booking => {
    const row = document.createElement('tr');
    row.append(
      createCell(fmtDate(booking.createdAt)),
      createCell(booking.customer || ''),
      createCell(booking.phone || ''),
      createCell(formatAppointment(booking)),
      createCell(booking.serviceType || 'Consulta general')
    );

    const assignedCell = document.createElement('td');
    const assignedInput = document.createElement('input');
    assignedInput.dataset.assignInput = booking.id;
    assignedInput.value = booking.assignedTo || '';
    assignedInput.placeholder = 'Nombre abogado';
    assignedCell.appendChild(assignedInput);
    row.appendChild(assignedCell);

    const statusCell = document.createElement('td');
    statusCell.appendChild(createBadge(statusLabel(booking.status), `badge ${booking.status}`));
    row.appendChild(statusCell);

    const actionsCell = document.createElement('td');
    actionsCell.append(
      createButton('Confirmar', 'confirmBtn', booking.id),
      createButton('Cancelar', 'cancelBtn', booking.id),
      createButton('Guardar', 'saveBtn', booking.id)
    );
    row.appendChild(actionsCell);

    const notifyCell = document.createElement('td');
    const notifyWrap = document.createElement('div');
    notifyWrap.className = 'stack-sm';
    notifyWrap.appendChild(createButton('WhatsApp', 'notifyBtn', booking.id));
    notifyWrap.appendChild(createBadge(booking.reminderTiming, 'badge neutral'));
    if (booking.internalTask) {
      notifyWrap.appendChild(createBadge(booking.internalTask, 'badge task'));
    }
    notifyCell.appendChild(notifyWrap);
    row.appendChild(notifyCell);

    return row;
  });

  bookingsBody.replaceChildren(...rows);

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
      const booking = getNormalizedBookings().find(item => item.id === btn.dataset.notifyBtn);
      if (booking) notifyBooking(booking);
    };
  });
}

function renderAgenda() {
  const selectedLawyer = lawyerFilter.value.trim();
  const bookings = getNormalizedBookings().filter(booking =>
    booking.status !== 'cancelada' && (!selectedLawyer || booking.assignedTo === selectedLawyer)
  );

  if (!bookings.length) {
    renderEmptyRow(agendaBody, 6, 'Sin citas para mostrar');
    return;
  }

  const rows = bookings.map(booking => {
    const row = document.createElement('tr');
    row.append(
      createCell(booking.customer || ''),
      createCell(formatAppointment(booking)),
      createCell(booking.serviceType || 'Consulta general'),
      createCell(booking.notes || '-'),
    );

    const statusCell = document.createElement('td');
    statusCell.appendChild(createBadge(statusLabel(booking.status), `badge ${booking.status}`));
    row.appendChild(statusCell);

    const actionsCell = document.createElement('td');
    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'stack-sm';
    actionsWrap.appendChild(createButton('Marcar atendida', 'attend', booking.id));
    if (booking.internalTask) {
      actionsWrap.appendChild(createBadge(booking.internalTask, 'badge task'));
    }
    row.appendChild(actionsCell);
    actionsCell.appendChild(actionsWrap);

    return row;
  });

  agendaBody.replaceChildren(...rows);

  agendaBody.querySelectorAll('[data-attend]').forEach(btn => {
    btn.onclick = () => updateBooking(btn.dataset.attend, booking => { booking.status = 'atendida'; });
  });
}

function reminderStatus(booking) {
  if (booking.status === 'cancelada') return 'Cancelado';
  if (booking.status === 'atendida') return 'Completado';
  if (booking.reminderTiming === 'Sin recordatorio' && !booking.internalReminder) return 'Sin seguimiento';
  return 'Pendiente';
}

function renderReminders() {
  const bookings = getNormalizedBookings();
  const rows = bookings
    .filter(booking => booking.reminderTiming !== 'Sin recordatorio' || booking.internalReminder || booking.serviceType === 'Visita cartel')
    .map(booking => {
      const row = document.createElement('tr');
      row.append(
        createCell(booking.customer || ''),
        createCell(formatAppointment(booking)),
        createCell(booking.reminderTiming),
        createCell(booking.internalTask || 'Sin tarea'),
        createCell(reminderStatus(booking))
      );
      return row;
    });

  if (!rows.length) {
    renderEmptyRow(remindersBody, 5, 'No hay recordatorios ni tareas internas pendientes');
    return;
  }

  remindersBody.replaceChildren(...rows);
}

function renderLawyers() {
  const lawyers = getLawyers();
  if (!lawyers.length) {
    lawyerList.replaceChildren();
    const empty = document.createElement('p');
    empty.textContent = 'No hay abogados cargados.';
    lawyerList.appendChild(empty);
    return;
  }

  const cards = lawyers.map(lawyer => {
    const article = document.createElement('article');
    article.className = 'lawyer-card';

    const image = document.createElement('img');
    image.src = lawyer.photo;
    image.alt = `Foto de ${lawyer.name || 'abogado'}`;

    const wrapper = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = lawyer.name || '';

    const specialty = document.createElement('p');
    specialty.textContent = lawyer.specialty || 'Sin especialidad';

    const phone = document.createElement('small');
    phone.textContent = lawyer.phone || 'Sin WhatsApp';

    wrapper.append(title, specialty, phone);
    article.append(image, wrapper);
    return article;
  });

  lawyerList.replaceChildren(...cards);
}

function renderAll() {
  renderBookings();
  renderAgenda();
  renderReminders();
  renderLawyers();
}

bookingForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(bookingForm);
  const serviceType = String(data.get('serviceType') || 'Consulta general').trim();
  const reminderTiming = String(data.get('reminderTiming') || 'Sin recordatorio').trim();
  const internalReminder = data.get('internalReminder') === 'on';
  const bookings = getBookings();

  bookings.unshift(ensureBookingMeta({
    id: crypto.randomUUID(),
    customer: String(data.get('customer') || '').trim(),
    phone: String(data.get('phone') || '').trim(),
    date: String(data.get('date') || '').trim(),
    time: String(data.get('time') || '').trim(),
    serviceType,
    assignedTo: String(data.get('assignedTo') || '').trim(),
    reminderTiming,
    internalReminder,
    internalTask: serviceType === 'Visita cartel'
      ? 'Agendar visita cartel'
      : (internalReminder ? 'Seguimiento general' : 'Sin tarea'),
    notes: String(data.get('notes') || '').trim(),
    status: 'nueva',
    createdAt: new Date().toISOString()
  }));

  saveBookings(bookings);
  bookingForm.reset();
  renderAll();
});

lawyerFilter.addEventListener('change', renderAgenda);

lawyerForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(lawyerForm);
  const file = data.get('photo');
  if (!(file instanceof File) || !file.size) return;
  const lawyers = getLawyers();
  lawyers.unshift({
    id: crypto.randomUUID(),
    name: String(data.get('name') || '').trim(),
    specialty: String(data.get('specialty') || '').trim(),
    phone: String(data.get('phone') || '').trim(),
    photo: await fileToDataUrl(file)
  });
  saveLawyers(lawyers);
  lawyerForm.reset();
  renderLawyers();
});

renderAll();
setInterval(renderBookings, 5000);
