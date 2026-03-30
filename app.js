const loginScreen = document.getElementById('login-screen');
const appShell = document.getElementById('app-shell');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

const bookingsBody = document.getElementById('bookings-body');
const hiredBody = document.getElementById('hired-body');
const agendaBody = document.getElementById('agenda-body');
const clientForm = document.getElementById('client-form');
const clientsBody = document.getElementById('clients-body');
const clientSearchInput = document.getElementById('client-search');
const clientSearchResults = document.getElementById('client-search-results');
const clientSelectedLabel = document.getElementById('client-selected-label');
const selectedClientNameInput = document.getElementById('selected-client-name');
const selectedClientRutInput = document.getElementById('selected-client-rut');
const selectedClientPhoneInput = document.getElementById('selected-client-phone');
const selectedClientEmailInput = document.getElementById('selected-client-email');
const selectedClientAddressInput = document.getElementById('selected-client-address');
const clientEditForm = document.getElementById('client-edit-form');
const clientEditSelect = document.getElementById('client-edit-select');
const bookingForm = document.getElementById('booking-form');
const lawyerFilter = document.getElementById('lawyer-filter');
const agendaMonthInput = document.getElementById('agenda-month');
const agendaCalendar = document.getElementById('agenda-calendar');
const agendaLegend = document.getElementById('agenda-color-legend');
const prisonMonthInput = document.getElementById('prison-month');
const prisonLawyerFilter = document.getElementById('prison-lawyer-filter');
const prisonCalendar = document.getElementById('prison-calendar');
const prisonCalendarLegend = document.getElementById('prison-calendar-legend');
const prisonVisitsBody = document.getElementById('prison-visits-body');
const prisonBookingForm = document.getElementById('prison-booking-form');
const lawyerForm = document.getElementById('lawyer-form');
const lawyerList = document.getElementById('lawyer-list');
const lawyerCalendarFilter = document.getElementById('lawyer-calendar-filter');
const lawyerCalendarMonth = document.getElementById('lawyer-calendar-month');
const lawyerCalendar = document.getElementById('lawyer-calendar');
const lawyerCalendarLegend = document.getElementById('lawyer-calendar-legend');
const sharedOnlyInput = document.getElementById('shared-only');
const generalStatsChart = document.getElementById('general-stats-chart');
const lawyerStatsChart = document.getElementById('lawyer-stats-chart');
const prisonStatsChart = document.getElementById('prison-stats-chart');
const lawyerRankingChart = document.getElementById('lawyer-ranking-chart');
const downloadGeneralReportBtn = document.getElementById('download-general-report');
const downloadLawyerReportBtn = document.getElementById('download-lawyer-report');
const downloadBookingsReportBtn = document.getElementById('download-bookings-report');
const downloadBackupJsonBtn = document.getElementById('download-backup-json');
const restoreBackupJsonBtn = document.getElementById('restore-backup-json');
const restoreBackupInput = document.getElementById('restore-backup-input');
const profileForm = document.getElementById('profile-form');
const profileList = document.getElementById('profile-list');
const clientSelect = document.getElementById('client-id-selected');
const hiredLawyerInput = bookingForm.elements.hiredLawyer;
const clientRutInput = clientForm.elements.rut;
const clientPhoneInput = clientForm.elements.phone;
const clientEditRutInput = clientEditForm.elements.rut;
const clientEditPhoneInput = clientEditForm.elements.phone;
const clientEditHiredLaterInput = clientEditForm.elements.hiredLater;
const clientEditAssignedToSelect = clientEditForm.elements.assignedTo;
const prisonClientSelect = prisonBookingForm.elements.clientId;
const prisonAssignedToSelect = prisonBookingForm.elements.assignedTo;
const chileClock = document.getElementById('chile-clock');
const assignedToSelect = bookingForm.elements.assignedTo;
const moduleTabs = document.querySelectorAll('[data-module-tab]');
const modulePanels = document.querySelectorAll('[data-module-panel]');
const toast = document.getElementById('toast');
let toastTimer = null;

function switchModule(moduleName) {
  moduleTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.moduleTab === moduleName);
  });

  modulePanels.forEach(panel => {
    panel.classList.toggle('active', panel.dataset.modulePanel === moduleName);
  });
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = String(message || 'Acción realizada');
  toast.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 2400);
}

function fillSelectedClientPreview(client) {
  selectedClientNameInput.value = client?.name || '';
  selectedClientRutInput.value = client?.rut || '';
  selectedClientPhoneInput.value = client?.phone || '';
  selectedClientEmailInput.value = client?.email || '';
  selectedClientAddressInput.value = client?.address || '';
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
const PRISON_VISIT_MATTER = 'Visita a la Cárcel';
const UNASSIGNED_LAWYER_LABEL = 'No asignado aún';

function normalizeMatterLabel(value) {
  const clean = String(value || '').trim();
  if (!clean) return '';
  const normalized = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (normalized.includes('cartel') || normalized.includes('carcel') || normalized.includes('carce')) return PRISON_VISIT_MATTER;
  return clean;
}

function isPrisonVisit(booking) {
  return normalizeMatterLabel(booking?.matter) === PRISON_VISIT_MATTER;
}

function normalizeAssignedToValue(value) {
  const clean = String(value || '').trim();
  return clean === UNASSIGNED_LAWYER_LABEL ? '' : clean;
}

function tryLogin(username, password) {
  return ALLOWED_CREDENTIALS.some(cred => cred.username === username && cred.password === password);
}

function hasNotificationConsent(booking) {
  return Boolean(booking?.notificationsConsent);
}

async function sendEmailViaBrevo(booking, subject, message) {
  const email = String(booking?.email || '').trim();
  if (!email) return false;

  try {
    const response = await fetch('brevo-email.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toEmail: email,
        toName: booking.customer || 'Cliente',
        subject,
        textContent: message
      })
    });

    if (!response.ok) {
      console.warn('Brevo email error', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Brevo email request failed', error);
    return false;
  }
}

async function notifyBooking(booking) {
  if (!hasNotificationConsent(booking)) return false;
  const destination = cleanPhone(booking.phone);
  if (!destination) return false;
  const msg = encodeURIComponent(buildTacamMessage(booking));
  window.open(`https://wa.me/${destination}?text=${msg}`, '_blank', 'noopener');
  return true;
}

function buildRescheduleMessage(booking, fromDate, toDate) {
  const fromText = `${fromDate || '-'} ${booking.time || ''}`.trim();
  const toText = `${toDate || '-'} ${booking.time || ''}`.trim();
  return `TACAM: su cita fue reagendada. Cliente: ${booking.customer || 'Cliente'}. Materia: ${normalizeMatterLabel(booking.matter) || 'General'}. Antes: ${fromText}. Nueva fecha: ${toText}. Abogada: ${booking.assignedTo || 'Por confirmar'}.`;
}

function getAppointmentDateTime(booking) {
  if (!booking.date || !booking.time) return null;
  const dateTime = new Date(`${booking.date}T${booking.time}:00`);
  return Number.isNaN(dateTime.getTime()) ? null : dateTime;
}

function buildReminderMessage(booking, minutesLeft) {
  const matter = normalizeMatterLabel(booking.matter) || 'General';
  if (isPrisonVisit(booking)) {
    return `Recordatorio TACAM: tienes una ${PRISON_VISIT_MATTER.toLowerCase()} en ${minutesLeft} minutos. Fecha/Hora: ${booking.date} ${booking.time}. Abogada: ${booking.assignedTo || 'Por confirmar'}.`;
  }
  return `Recordatorio TACAM: vas a tener una cita en ${minutesLeft} minutos. Fecha/Hora: ${booking.date} ${booking.time}. Materia: ${matter}. Abogada: ${booking.assignedTo || 'Por confirmar'}.`;
}

function build24hReminderMessage(booking) {
  const matter = normalizeMatterLabel(booking.matter) || 'General';
  if (isPrisonVisit(booking)) {
    return `Recordatorio TACAM: mañana tienes una ${PRISON_VISIT_MATTER.toLowerCase()}. Fecha/Hora: ${booking.date} ${booking.time}. Abogada: ${booking.assignedTo || 'Por confirmar'}.`;
  }
  return `Recordatorio TACAM: tu cita será en 24 horas. Fecha/Hora: ${booking.date} ${booking.time}. Materia: ${matter}. Abogada: ${booking.assignedTo || 'Por confirmar'}.`;
}

function buildVisitScheduledMessage(booking) {
  const matter = normalizeMatterLabel(booking.matter) || 'General';
  if (isPrisonVisit(booking)) {
    return `TACAM: se agendó una ${PRISON_VISIT_MATTER.toLowerCase()} para ${booking.date} ${booking.time}. Abogada: ${booking.assignedTo || 'Por confirmar'}. Se enviarán recordatorios por WhatsApp y correo.`;
  }
  return `Calendario de visitas TACAM: enviamos correo automático a la persona. Tu cita quedó agendada para ${booking.date} ${booking.time}. Materia: ${matter}. Abogada: ${booking.assignedTo || 'Por confirmar'}. Luego recibirás un recordatorio de que vas a tener una cita.`;
}

async function notifyBookingChannels(booking, message, emailSubject) {
  if (!hasNotificationConsent(booking)) return false;

  const encoded = encodeURIComponent(message);
  const targets = [cleanPhone(booking.phone), getLawyerPhone(booking.assignedTo)].filter(Boolean);
  let sent = false;

  [...new Set(targets)].forEach(target => {
    window.open(`https://wa.me/${target}?text=${encoded}`, '_blank', 'noopener');
    sent = true;
  });

  const emailSent = await sendEmailViaBrevo(booking, emailSubject, message);
  return sent || emailSent;
}

async function notifyVisitScheduled(booking) {
  const message = buildVisitScheduledMessage(booking);
  return notifyBookingChannels(booking, message, isPrisonVisit(booking) ? 'TACAM: visita a la cárcel agendada' : 'Calendario de visitas TACAM: cita agendada');
}

function getLawyerPhone(lawyerName) {
  const lawyer = getLawyers().find(item => (item.name || '').trim() === (lawyerName || '').trim());
  return lawyer ? cleanPhone(lawyer.phone) : '';
}

async function notifyReschedule(booking, fromDate, toDate) {
  const message = buildRescheduleMessage(booking, fromDate, toDate);
  return notifyBookingChannels(booking, message, 'Reagendamiento de cita TACAM');
}

async function notifyUpcomingAppointments() {
  const now = new Date();
  const bookings = getBookings();
  let hasUpdates = false;

  for (const booking of bookings) {
    const appointment = getAppointmentDateTime(booking);
    if (!appointment || booking.status === 'cancelada' || booking.status === 'atendida') continue;

    const diffMinutes = Math.round((appointment.getTime() - now.getTime()) / 60000);
    if (diffMinutes < 0) continue;

    if (diffMinutes <= 1440 && !booking.reminder24hSentAt) {
      const sent24h = await notifyBookingChannels(booking, build24hReminderMessage(booking), 'Recordatorio TACAM: cita en 24 horas');
      if (sent24h) {
        booking.reminder24hSentAt = now.toISOString();
        hasUpdates = true;
      }
    }

    if (diffMinutes <= 60 && !booking.reminder1hSentAt) {
      const sent1h = await notifyBookingChannels(booking, buildReminderMessage(booking, diffMinutes), 'Recordatorio TACAM: vas a tener una cita');
      if (sent1h) {
        booking.reminder1hSentAt = now.toISOString();
        hasUpdates = true;
      }
    }
  }

  if (hasUpdates) {
    saveBookings(bookings);
    renderAll();
  }
}

function moveBookingDate(bookingId, newDate) {
  if (!newDate) return;
  const bookings = getBookings();
  const booking = bookings.find(item => item.id === bookingId);
  if (!booking || booking.date === newDate) return;

  const oldDate = booking.date;
  booking.date = newDate;
  booking.reminder24hSentAt = '';
  booking.reminder1hSentAt = '';
  saveBookings(bookings);
  renderAll();
  void notifyReschedule(booking, oldDate, newDate);
}

function updateBooking(bookingId, updater) {
  const bookings = getBookings();
  const booking = bookings.find(item => item.id === bookingId);
  if (!booking) return;
  updater(booking);
  saveBookings(bookings);
  renderAll();
  showToast('Cambios guardados correctamente.');
}


function buildStatusChangeMessage(booking, status) {
  const appointment = `${booking.date || '-'} ${booking.time || ''}`.trim();
  const matter = normalizeMatterLabel(booking.matter) || 'General';

  if (status === 'confirmada') {
    return `TACAM: tu reserva fue confirmada. Fecha/Hora: ${appointment}. Materia: ${matter}. Abogada: ${booking.assignedTo || 'Por confirmar'}.`;
  }

  if (status === 'cancelada') {
    return `TACAM: tu reserva fue cancelada. Fecha/Hora: ${appointment}. Materia: ${matter}. Si necesitas reprogramar, contáctanos.`;
  }

  return `TACAM: el estado de tu reserva cambió a ${statusLabel(status)}. Fecha/Hora: ${appointment}. Materia: ${matter}.`;
}

async function updateBookingStatusWithNotification(bookingId, status) {
  const bookings = getBookings();
  const booking = bookings.find(item => item.id === bookingId);
  if (!booking) return;

  booking.status = status;
  saveBookings(bookings);
  renderAll();
  showToast(`Estado actualizado a ${statusLabel(status)}.`);

  const subject = status === 'confirmada'
    ? 'TACAM: reserva confirmada'
    : status === 'cancelada'
      ? 'TACAM: reserva cancelada'
      : `TACAM: estado actualizado (${statusLabel(status)})`;

  await notifyBookingChannels(booking, buildStatusChangeMessage(booking, status), subject);
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

function formatRut(value) {
  const clean = String(value || '').replace(/[^0-9kK]/g, '').toUpperCase();
  if (!clean) return '';
  if (clean.length === 1) return clean;

  const verifier = clean.slice(-1);
  const body = clean.slice(0, -1).slice(0, 8);
  const grouped = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${grouped}-${verifier}`;
}

function formatPhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('56')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (!digits.startsWith('9')) digits = `9${digits}`;
  digits = digits.slice(0, 9);
  return `+56${digits}`;
}

function isValidRut(value) {
  return /^\d{1,2}(\.\d{3}){1,2}-[\dK]$/.test(String(value || '').toUpperCase());
}

function isValidPhone(value) {
  return /^\+569\d{8}$/.test(String(value || ''));
}

function updateChileClock() {
  if (!chileClock) return;
  chileClock.textContent = new Date().toLocaleTimeString('es-CL', {
    timeZone: 'America/Santiago',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

function getLawyerNames() {
  const names = new Set();

  getLawyers().forEach(lawyer => {
    const name = String(lawyer.name || '').trim();
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
  fillSelectWithNames(assignedToSelect, names, UNASSIGNED_LAWYER_LABEL);
  fillSelectWithNames(prisonAssignedToSelect, names, UNASSIGNED_LAWYER_LABEL);
  fillSelectWithNames(clientEditAssignedToSelect, names, UNASSIGNED_LAWYER_LABEL);
  fillSelectWithNames(prisonLawyerFilter, names, 'Todas');
  fillSelectWithNames(lawyerFilter, names, 'Todos');
  fillSelectWithNames(lawyerCalendarFilter, names, 'Todas');
}

function renderClientOptions() {
  const query = String(clientSearchInput.value || '').trim().toLowerCase();
  const clients = getClients()
    .filter(client => {
      if (!query) return true;
      const haystack = `${client.name || ''} ${client.rut || ''} ${client.phone || ''}`.toLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'es'));

  renderClientSearchResults(clients, query);
  const selectedClient = getClients().find(client => client.id === clientSelect.value);
  clientSelectedLabel.textContent = selectedClient
    ? `Cliente seleccionado: ${selectedClient.name} · ${selectedClient.rut}`
    : 'Cliente seleccionado: ninguno';
  fillSelectedClientPreview(selectedClient || null);

  const selectedPrisonClient = prisonClientSelect.value;
  prisonClientSelect.replaceChildren();
  const firstPrison = document.createElement('option');
  firstPrison.value = '';
  firstPrison.textContent = clients.length ? 'Seleccione cliente' : 'No hay clientes guardados';
  prisonClientSelect.appendChild(firstPrison);
  clients.forEach(client => {
    const option = document.createElement('option');
    option.value = client.id;
    option.textContent = `${client.name} · ${client.rut}`;
    prisonClientSelect.appendChild(option);
  });
  if (clients.some(client => client.id === selectedPrisonClient)) {
    prisonClientSelect.value = selectedPrisonClient;
  }
}

function renderClientSearchResults(clients, query) {
  clientSearchResults.replaceChildren();
  if (!query) return;

  const limited = clients.slice(0, 8);
  if (!limited.length) return;

  limited.forEach(client => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'search-result-item';
    item.textContent = `${client.name} · ${client.rut} · ${client.phone}`;
    item.addEventListener('click', () => {
      clientSelect.value = client.id;
      clientSearchInput.value = `${client.name} (${client.rut})`;
      clientSelectedLabel.textContent = `Cliente seleccionado: ${client.name} · ${client.rut}`;
      fillSelectedClientPreview(client);
      clientSearchResults.replaceChildren();
    });
    clientSearchResults.appendChild(item);
  });
}

function renderClients() {
  const clients = getClients().sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'es'));
  clientsBody.replaceChildren();

  if (!clients.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.textContent = 'Sin clientes guardados.';
    row.appendChild(cell);
    clientsBody.appendChild(row);
    return;
  }

  clients.forEach(client => {
    const row = document.createElement('tr');
    appendCell(row, client.name || '');
    appendCell(row, client.rut || '');
    appendCell(row, client.phone || '');
    appendCell(row, client.email || '');
    appendCell(row, client.address || '');
    clientsBody.appendChild(row);
  });
}

function renderClientEditOptions() {
  const clients = getClients().sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'es'));
  const selected = clientEditSelect.value;
  clientEditSelect.replaceChildren();

  const first = document.createElement('option');
  first.value = '';
  first.textContent = clients.length ? 'Seleccione un cliente' : 'No hay clientes guardados';
  clientEditSelect.appendChild(first);

  clients.forEach(client => {
    const option = document.createElement('option');
    option.value = client.id;
    option.textContent = `${client.name} · ${client.rut}`;
    clientEditSelect.appendChild(option);
  });

  if (clients.some(client => client.id === selected)) {
    clientEditSelect.value = selected;
    fillClientEditForm(selected);
  } else {
    clientEditForm.reset();
    clientEditAssignedToSelect.value = UNASSIGNED_LAWYER_LABEL;
    clientEditAssignedToSelect.disabled = true;
  }
}

function fillClientEditForm(clientId) {
  const client = getClients().find(item => item.id === clientId);
  if (!client) {
    clientEditForm.reset();
    return;
  }

  clientEditForm.elements.name.value = client.name || '';
  clientEditForm.elements.rut.value = client.rut || '';
  clientEditForm.elements.phone.value = client.phone || '';
  clientEditForm.elements.email.value = client.email || '';
  clientEditForm.elements.address.value = client.address || '';

  const clientBookings = getBookings().filter(booking => booking.clientId === clientId);
  const hiredBooking = clientBookings.find(booking => booking.hiredLawyer);
  clientEditHiredLaterInput.checked = Boolean(hiredBooking);
  clientEditAssignedToSelect.value = hiredBooking?.assignedTo || UNASSIGNED_LAWYER_LABEL;
  clientEditAssignedToSelect.disabled = !clientEditHiredLaterInput.checked;
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

function getCalendarBookings(selectedLawyer, selectedMonth, onlyShared = false, predicate = null) {
  const allBookings = getBookings().filter(booking => booking.hiredLawyer && booking.status !== 'cancelada' && booking.date);
  const filteredBookings = typeof predicate === 'function' ? allBookings.filter(predicate) : allBookings;
  const byMonth = filteredBookings.filter(booking => !selectedMonth || booking.date.slice(0, 7) === selectedMonth);
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
          event.textContent = `${booking.time || '--:--'} · ${booking.assignedTo || 'Sin abogada'} · ${booking.customer || 'Cliente'} · ${normalizeMatterLabel(booking.matter) || 'General'}`;
          dayCell.appendChild(event);
        });
    }

    container.appendChild(dayCell);
  }
}

function renderAgendaCalendar() {
  const selectedLawyer = lawyerFilter.value.trim();
  const selectedMonth = agendaMonthInput.value;
  const bookings = getCalendarBookings(selectedLawyer, selectedMonth, false, booking => !isPrisonVisit(booking));
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

function getGeneralStatusStats() {
  const stats = { nueva: 0, confirmada: 0, atendida: 0, cancelada: 0 };
  getBookings().forEach(booking => {
    if (Object.hasOwn(stats, booking.status)) stats[booking.status] += 1;
  });
  return stats;
}

function getLawyerAttentionStats() {
  const map = new Map();
  getBookings().forEach(booking => {
    const name = (booking.assignedTo || 'Sin abogada').trim() || 'Sin abogada';
    if (!map.has(name)) map.set(name, { total: 0, atendida: 0 });
    const item = map.get(name);
    item.total += 1;
    if (booking.status === 'atendida') item.atendida += 1;
  });

  return [...map.entries()]
    .map(([lawyer, values]) => ({ lawyer, ...values }))
    .sort((a, b) => a.lawyer.localeCompare(b.lawyer, 'es'));
}

function getPrisonVisitStats() {
  const map = new Map();
  getBookings()
    .filter(booking => isPrisonVisit(booking) && booking.prisonAttendance === 'asistio')
    .forEach(booking => {
      const lawyer = (booking.assignedTo || 'Sin abogada').trim() || 'Sin abogada';
      if (!map.has(lawyer)) map.set(lawyer, 0);
      map.set(lawyer, map.get(lawyer) + 1);
    });

  return [...map.entries()]
    .map(([lawyer, total]) => ({ lawyer, total }))
    .sort((a, b) => a.lawyer.localeCompare(b.lawyer, 'es'));
}

function getLawyerRankingStats() {
  return getLawyerAttentionStats()
    .map(item => ({
      lawyer: item.lawyer,
      total: item.total,
      attended: item.atendida,
      conversion: item.total ? Math.round((item.atendida / item.total) * 100) : 0
    }))
    .sort((a, b) => {
      if (b.attended !== a.attended) return b.attended - a.attended;
      if (b.total !== a.total) return b.total - a.total;
      return a.lawyer.localeCompare(b.lawyer, 'es');
    });
}

function getAttentionPerformanceColor(attended) {
  const value = Number(attended) || 0;
  if (value <= 2) return '#d63a55';
  if (value <= 3) return '#e9c46a';
  return '#2a9d8f';
}

function drawBarChart(canvas, labels, values, colors, title) {
  if (!(canvas instanceof HTMLCanvasElement)) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const padLeft = 52;
  const padRight = 16;
  const padTop = 36;
  const padBottom = 46;
  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;
  const maxValue = Math.max(1, ...values);

  ctx.fillStyle = '#5a313d';
  ctx.font = 'bold 14px Arial';
  ctx.fillText(title, padLeft, 20);

  ctx.strokeStyle = '#d9c8ce';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padLeft, padTop);
  ctx.lineTo(padLeft, padTop + chartHeight);
  ctx.lineTo(padLeft + chartWidth, padTop + chartHeight);
  ctx.stroke();

  const barSpace = chartWidth / Math.max(labels.length, 1);
  const barWidth = Math.max(16, barSpace * 0.55);

  values.forEach((value, index) => {
    const barHeight = (value / maxValue) * (chartHeight - 8);
    const x = padLeft + index * barSpace + (barSpace - barWidth) / 2;
    const y = padTop + chartHeight - barHeight;

    ctx.fillStyle = colors[index] || '#8f203a';
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = '#2f1a21';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(String(value), x + barWidth / 2, y - 6);

    ctx.fillStyle = '#5a313d';
    const label = labels[index].length > 16 ? `${labels[index].slice(0, 16)}…` : labels[index];
    ctx.fillText(label, x + barWidth / 2, padTop + chartHeight + 18);
    ctx.textAlign = 'start';
  });
}

function drawRankingChart(canvas, ranking) {
  if (!(canvas instanceof HTMLCanvasElement)) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const topItems = ranking.slice(0, 6);
  const labels = topItems.map(item => item.lawyer);
  const values = topItems.map(item => item.attended);
  const maxValue = Math.max(1, ...values);

  const padLeft = 180;
  const padRight = 24;
  const padTop = 40;
  const padBottom = 24;
  const chartWidth = width - padLeft - padRight;
  const rowHeight = 40;

  ctx.fillStyle = '#5a313d';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('Ranking (atendidas) por abogada', padLeft, 22);

  if (!topItems.length) {
    ctx.font = '13px Arial';
    ctx.fillText('Sin datos para construir ranking.', padLeft, padTop + 30);
    return;
  }

  topItems.forEach((item, index) => {
    const y = padTop + index * rowHeight;
    const barHeight = 22;
    const barWidth = (item.attended / maxValue) * chartWidth;
    const color = getAttentionPerformanceColor(item.attended);
    const rank = index + 1;
    const shortName = item.lawyer.length > 22 ? `${item.lawyer.slice(0, 22)}…` : item.lawyer;

    ctx.fillStyle = '#5a313d';
    ctx.font = '12px Arial';
    ctx.fillText(`${rank}. ${shortName}`, 14, y + 16);

    ctx.fillStyle = '#f3e4e9';
    ctx.fillRect(padLeft, y, chartWidth, barHeight);

    ctx.fillStyle = color;
    ctx.fillRect(padLeft, y, Math.max(4, barWidth), barHeight);

    ctx.fillStyle = '#2f1a21';
    ctx.fillText(`${item.attended} atendidas · ${item.conversion}% conversión`, padLeft + 8, y + 16);
  });
}

function downloadCsv(filename, rows) {
  const csv = rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
}

function createBackupPayload() {
  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    clients: getClients(),
    bookings: getBookings(),
    lawyers: getLawyers(),
    profiles: getProfiles()
  };
}

function restoreBackupPayload(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('Formato inválido');
  if (!Array.isArray(payload.bookings) || !Array.isArray(payload.lawyers) || !Array.isArray(payload.profiles)) {
    throw new Error('El respaldo no contiene la estructura esperada');
  }

  const backupClients = Array.isArray(payload.clients) ? payload.clients : [];
  const inferredClients = payload.bookings.map(booking => ({
    id: booking.clientId || crypto.randomUUID(),
    name: booking.customer || 'Cliente',
    rut: booking.rut || '',
    phone: booking.phone || '',
    email: booking.email || '',
    address: booking.address || '',
    createdAt: booking.createdAt || new Date().toISOString()
  }));
  const mergedByRut = new Map();
  [...backupClients, ...inferredClients].forEach(client => {
    const key = String(client.rut || client.id || '').trim();
    if (!key) return;
    if (!mergedByRut.has(key)) mergedByRut.set(key, client);
  });

  saveClients([...mergedByRut.values()]);
  saveBookings(payload.bookings);
  saveLawyers(payload.lawyers);
  saveProfiles(payload.profiles);
  renderAll();
}

function renderReports() {
  const general = getGeneralStatusStats();
  const generalLabels = ['Nueva', 'Confirmada', 'Atendida', 'Cancelada'];
  const generalValues = [general.nueva, general.confirmada, general.atendida, general.cancelada];
  const generalColors = ['#f5d3dc', '#ead8fa', '#ceefd8', '#ffd1d1'];
  drawBarChart(generalStatsChart, generalLabels, generalValues, generalColors, 'Atenciones generales por estado');

  const lawyerStats = getLawyerAttentionStats();
  const lawyerLabels = lawyerStats.map(item => item.lawyer);
  const lawyerValues = lawyerStats.map(item => item.atendida);
  const lawyerColors = lawyerStats.map(item => getAttentionPerformanceColor(item.atendida));
  drawBarChart(lawyerStatsChart, lawyerLabels, lawyerValues, lawyerColors, 'Atenciones (estado atendida) por abogada');

  const prisonStats = getPrisonVisitStats();
  const prisonLabels = prisonStats.map(item => item.lawyer);
  const prisonValues = prisonStats.map(item => item.total);
  const prisonColors = prisonLabels.map(getLawyerColor);
  drawBarChart(prisonStatsChart, prisonLabels, prisonValues, prisonColors, 'Visitas a la cárcel por abogada');

  const ranking = getLawyerRankingStats();
  drawRankingChart(lawyerRankingChart, ranking);
}

function renderBookings() {
  const allBookings = getBookings();
  const bookings = allBookings.filter(booking => !booking.hiredLawyer && !isPrisonVisit(booking));
  const hiredBookings = allBookings.filter(booking => booking.hiredLawyer && !isPrisonVisit(booking));
  bookingsBody.replaceChildren();
  hiredBody.replaceChildren();

  if (!bookings.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 9;
    cell.textContent = 'Sin leads registrados';
    row.appendChild(cell);
    bookingsBody.appendChild(row);
  } else {
    bookings.forEach(booking => {
      const row = document.createElement('tr');

      appendCell(row, fmtDate(booking.createdAt));
      appendCell(row, booking.customer || '');
      appendCell(row, normalizeMatterLabel(booking.matter) || 'General');
      appendCell(row, booking.phone || '');
      appendCell(row, formatAppointment(booking));

      appendCell(row, booking.assignedTo || 'Sin abogada');

      const statusCell = document.createElement('td');
      const statusBadge = document.createElement('span');
      statusBadge.className = `badge ${booking.status}`;
      statusBadge.textContent = statusLabel(booking.status);
      statusCell.appendChild(statusBadge);
      row.appendChild(statusCell);

      const actionsCell = document.createElement('td');

      const confirmBtn = document.createElement('button');
      confirmBtn.className = `switch-btn ${booking.status === 'confirmada' ? 'primary' : ''}`.trim();
      confirmBtn.dataset.confirmBtn = booking.id;
      confirmBtn.textContent = 'Confirmar';
      actionsCell.appendChild(confirmBtn);

      const cancelBtn = document.createElement('button');
      cancelBtn.className = `switch-btn ${booking.status === 'cancelada' ? 'primary' : ''}`.trim();
      cancelBtn.dataset.cancelBtn = booking.id;
      cancelBtn.textContent = 'Cancelar';
      actionsCell.appendChild(cancelBtn);

      const convertSelect = document.createElement('select');
      convertSelect.dataset.convertLawyer = booking.id;
      const first = document.createElement('option');
      first.value = UNASSIGNED_LAWYER_LABEL;
      first.textContent = UNASSIGNED_LAWYER_LABEL;
      convertSelect.appendChild(first);
      getLawyerNames().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        convertSelect.appendChild(option);
      });
      actionsCell.appendChild(convertSelect);

      const convertBtn = document.createElement('button');
      convertBtn.className = 'switch-btn primary';
      convertBtn.dataset.convertBtn = booking.id;
      convertBtn.textContent = 'Contrató después';
      actionsCell.appendChild(convertBtn);

      row.appendChild(actionsCell);

      const notifyCell = document.createElement('td');
      const waBtn = document.createElement('button');
      waBtn.className = 'switch-btn primary';
      waBtn.dataset.remarketWhatsapp = booking.id;
      waBtn.textContent = 'Remarketing WhatsApp';
      notifyCell.appendChild(waBtn);
      const emailBtn = document.createElement('button');
      emailBtn.className = 'switch-btn';
      emailBtn.dataset.remarketEmail = booking.id;
      emailBtn.textContent = 'Remarketing Email';
      notifyCell.appendChild(emailBtn);
      row.appendChild(notifyCell);

      bookingsBody.appendChild(row);
    });
  }

  if (!hiredBookings.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.textContent = 'Sin clientes contratados para remarketing';
    row.appendChild(cell);
    hiredBody.appendChild(row);
  } else {
    hiredBookings.forEach(booking => {
      const row = document.createElement('tr');

    appendCell(row, fmtDate(booking.createdAt));
    appendCell(row, booking.customer || '');
    appendCell(row, normalizeMatterLabel(booking.matter) || 'General');
    appendCell(row, booking.phone || '');
    appendCell(row, formatAppointment(booking));
    appendCell(row, booking.assignedTo || 'Sin abogada');

    const statusCell = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.className = `badge ${booking.status}`;
    statusBadge.textContent = statusLabel(booking.status);
    statusCell.appendChild(statusBadge);
    row.appendChild(statusCell);

      hiredBody.appendChild(row);
    });
  }

  bookingsBody.querySelectorAll('[data-confirm-btn]').forEach(btn => {
    btn.onclick = async () => {
      await updateBookingStatusWithNotification(btn.dataset.confirmBtn, 'confirmada');
    };
  });

  bookingsBody.querySelectorAll('[data-cancel-btn]').forEach(btn => {
    btn.onclick = async () => {
      await updateBookingStatusWithNotification(btn.dataset.cancelBtn, 'cancelada');
    };
  });

  bookingsBody.querySelectorAll('[data-convert-btn]').forEach(btn => {
    btn.onclick = () => {
      const lawyerSelect = bookingsBody.querySelector(`[data-convert-lawyer="${btn.dataset.convertBtn}"]`);
      const lawyer = normalizeAssignedToValue(lawyerSelect?.value);
      updateBooking(btn.dataset.convertBtn, booking => {
        booking.hiredLawyer = true;
        booking.assignedTo = lawyer;
        booking.status = 'confirmada';
      });
    };
  });

  bookingsBody.querySelectorAll('[data-remarket-whatsapp]').forEach(btn => {
    btn.onclick = async () => {
      const booking = getBookings().find(item => item.id === btn.dataset.remarketWhatsapp);
      if (!booking) return;
      const msg = `TACAM: Hola ${booking.customer || 'cliente'}, tenemos nuevas opciones legales para tu caso. ¿Te gustaría una nueva reunión?`;
      await notifyBookingChannels(booking, msg, 'TACAM: campaña de seguimiento');
    };
  });

  bookingsBody.querySelectorAll('[data-remarket-email]').forEach(btn => {
    btn.onclick = async () => {
      const booking = getBookings().find(item => item.id === btn.dataset.remarketEmail);
      if (!booking) return;
      const msg = `TACAM: seguimiento de tu caso. Tenemos novedades y opciones de apoyo legal para ${normalizeMatterLabel(booking.matter) || 'tu consulta'}.`;
      await sendEmailViaBrevo(booking, 'TACAM: seguimiento y remarketing', msg);
    };
  });
}

function renderAgenda() {
  const selectedLawyer = lawyerFilter.value.trim();
  const bookings = getBookings().filter(booking =>
    booking.hiredLawyer && booking.status !== 'cancelada' && !isPrisonVisit(booking) && (!selectedLawyer || booking.assignedTo === selectedLawyer)
  );

  agendaBody.replaceChildren();

  if (!bookings.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.textContent = 'Sin citas para mostrar';
    row.appendChild(cell);
    agendaBody.appendChild(row);
  } else {
    bookings.forEach(booking => {
      const row = document.createElement('tr');
      appendCell(row, booking.customer || '');
      appendCell(row, normalizeMatterLabel(booking.matter) || 'General');
      appendCell(row, formatAppointment(booking));
      appendCell(row, booking.notes || '-');

      const statusCell = document.createElement('td');
      const statusBadge = document.createElement('span');
      statusBadge.className = `badge ${booking.status}`;
      statusBadge.textContent = statusLabel(booking.status);
      statusCell.appendChild(statusBadge);
      row.appendChild(statusCell);

      const actionCell = document.createElement('td');
      const lawyerSelect = document.createElement('select');
      lawyerSelect.dataset.agendaLawyer = booking.id;
      const firstLawyer = document.createElement('option');
      firstLawyer.value = UNASSIGNED_LAWYER_LABEL;
      firstLawyer.textContent = UNASSIGNED_LAWYER_LABEL;
      lawyerSelect.appendChild(firstLawyer);
      getLawyerNames().forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        lawyerSelect.appendChild(option);
      });
      lawyerSelect.value = booking.assignedTo || UNASSIGNED_LAWYER_LABEL;
      actionCell.appendChild(lawyerSelect);

      const attendedBtn = document.createElement('button');
      attendedBtn.className = 'switch-btn primary';
      attendedBtn.dataset.attendYes = booking.id;
      attendedBtn.textContent = 'Sí asistió';
      actionCell.appendChild(attendedBtn);

      const missedBtn = document.createElement('button');
      missedBtn.className = 'switch-btn';
      missedBtn.dataset.attendNo = booking.id;
      missedBtn.textContent = 'No asistió';
      actionCell.appendChild(missedBtn);
      row.appendChild(actionCell);

      agendaBody.appendChild(row);
    });
  }

  agendaBody.querySelectorAll('[data-attend-yes]').forEach(btn => {
    btn.onclick = () => updateBooking(btn.dataset.attendYes, booking => {
      booking.status = 'atendida';
      booking.hiredLawyer = true;
    });
  });

  agendaBody.querySelectorAll('[data-attend-no]').forEach(btn => {
    btn.onclick = () => updateBooking(btn.dataset.attendNo, booking => {
      booking.status = 'nueva';
      booking.hiredLawyer = false;
      booking.assignedTo = '';
    });
  });

  agendaBody.querySelectorAll('[data-agenda-lawyer]').forEach(select => {
    select.onchange = () => updateBooking(select.dataset.agendaLawyer, booking => {
      booking.assignedTo = normalizeAssignedToValue(select.value);
      booking.hiredLawyer = Boolean(booking.assignedTo);
    });
  });
}


function buildPrisonCheckInMessage(booking) {
  return `TACAM: check-in asistente registrado para la visita a la cárcel de ${booking.customer || 'Cliente'}. Fecha/Hora: ${booking.date || '-'} ${booking.time || ''}. Abogada: ${booking.assignedTo || 'Por confirmar'}.`;
}

function renderPrisonCalendar() {
  const selectedMonth = prisonMonthInput.value;
  const selectedLawyer = String(prisonLawyerFilter.value || '').trim();
  const bookings = getCalendarBookings(selectedLawyer, selectedMonth, false, booking => isPrisonVisit(booking));
  const names = [...new Set(bookings.map(booking => booking.assignedTo).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  renderCalendarLegend(prisonCalendarLegend, names);
  renderCalendar(prisonCalendar, bookings, selectedMonth);
}

function renderPrisonVisitsList() {
  const selectedMonth = prisonMonthInput.value;
  const selectedLawyer = String(prisonLawyerFilter.value || '').trim();
  const visits = getBookings()
    .filter(booking => booking.hiredLawyer && booking.status !== 'cancelada' && isPrisonVisit(booking))
    .filter(booking => !selectedLawyer || booking.assignedTo === selectedLawyer)
    .filter(booking => !selectedMonth || booking.date.slice(0, 7) === selectedMonth)
    .sort((a, b) => `${a.date || ''} ${a.time || ''}`.localeCompare(`${b.date || ''} ${b.time || ''}`));

  prisonVisitsBody.replaceChildren();

  if (!visits.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 8;
    cell.textContent = 'Sin clientes visitados en este mes.';
    row.appendChild(cell);
    prisonVisitsBody.appendChild(row);
    return;
  }

  visits.forEach(booking => {
    const row = document.createElement('tr');
    const lawyerCell = document.createElement('td');
    const lawyerSelect = document.createElement('select');
    lawyerSelect.dataset.prisonLawyer = booking.id;
    const lawyerNames = getLawyerNames();
    const emptyOption = document.createElement('option');
    emptyOption.value = UNASSIGNED_LAWYER_LABEL;
    emptyOption.textContent = UNASSIGNED_LAWYER_LABEL;
    lawyerSelect.appendChild(emptyOption);
    lawyerNames.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      lawyerSelect.appendChild(option);
    });
    lawyerSelect.value = booking.assignedTo || UNASSIGNED_LAWYER_LABEL;
    lawyerCell.appendChild(lawyerSelect);
    row.appendChild(lawyerCell);
    appendCell(row, booking.customer || '');
    appendCell(row, booking.date || '-');
    appendCell(row, booking.time || '--:--');

    const statusCell = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.className = `badge ${booking.status}`;
    statusBadge.textContent = statusLabel(booking.status);
    statusCell.appendChild(statusBadge);
    row.appendChild(statusCell);

    const attendanceCell = document.createElement('td');
    const yesBtn = document.createElement('button');
    yesBtn.className = `switch-btn ${booking.prisonAttendance === 'asistio' ? 'primary' : ''}`.trim();
    yesBtn.dataset.prisonAttendYes = booking.id;
    yesBtn.textContent = 'Sí asistió';
    attendanceCell.appendChild(yesBtn);
    const noBtn = document.createElement('button');
    noBtn.className = `switch-btn ${booking.prisonAttendance === 'no-asistio' ? 'primary' : ''}`.trim();
    noBtn.dataset.prisonAttendNo = booking.id;
    noBtn.textContent = 'No asistió';
    attendanceCell.appendChild(noBtn);
    row.appendChild(attendanceCell);

    const checkInCell = document.createElement('td');
    const checkInBtn = document.createElement('button');
    checkInBtn.className = 'switch-btn primary';
    checkInBtn.dataset.prisonCheckin = booking.id;
    checkInBtn.textContent = booking.checkedInAt ? `Check-in asistente ${fmtDate(booking.checkedInAt)}` : 'Registrar check-in asistente';
    checkInBtn.disabled = Boolean(booking.checkedInAt);
    checkInCell.appendChild(checkInBtn);
    row.appendChild(checkInCell);

    const reminderCell = document.createElement('td');
    const reminderBtn = document.createElement('button');
    reminderBtn.className = 'switch-btn';
    reminderBtn.dataset.prisonNotify = booking.id;
    reminderBtn.textContent = 'WhatsApp y email';
    reminderCell.appendChild(reminderBtn);
    row.appendChild(reminderCell);

    prisonVisitsBody.appendChild(row);
  });

  prisonVisitsBody.querySelectorAll('[data-prison-checkin]').forEach(btn => {
    btn.onclick = async () => {
      const bookingId = btn.dataset.prisonCheckin;
      updateBooking(bookingId, booking => {
        booking.checkedInAt = new Date().toISOString();
        booking.status = booking.status === 'nueva' ? 'confirmada' : booking.status;
      });

      const updatedBooking = getBookings().find(item => item.id === bookingId);
      if (updatedBooking) {
        await notifyBookingChannels(updatedBooking, buildPrisonCheckInMessage(updatedBooking), 'TACAM: check-in asistente visita a la cárcel');
      }
    };
  });

  prisonVisitsBody.querySelectorAll('[data-prison-attend-yes]').forEach(btn => {
    btn.onclick = () => updateBooking(btn.dataset.prisonAttendYes, booking => {
      booking.prisonAttendance = 'asistio';
      booking.status = 'atendida';
      booking.hiredLawyer = true;
    });
  });

  prisonVisitsBody.querySelectorAll('[data-prison-attend-no]').forEach(btn => {
    btn.onclick = () => updateBooking(btn.dataset.prisonAttendNo, booking => {
      booking.prisonAttendance = 'no-asistio';
      booking.status = 'confirmada';
      booking.hiredLawyer = true;
    });
  });

  prisonVisitsBody.querySelectorAll('[data-prison-lawyer]').forEach(select => {
    select.onchange = () => updateBooking(select.dataset.prisonLawyer, booking => {
      booking.assignedTo = normalizeAssignedToValue(select.value);
      if (booking.hiredLawyer && !booking.assignedTo) {
        booking.hiredLawyer = false;
      }
    });
  });

  prisonVisitsBody.querySelectorAll('[data-prison-notify]').forEach(btn => {
    btn.onclick = async () => {
      const booking = getBookings().find(item => item.id === btn.dataset.prisonNotify);
      if (booking) await notifyBookingChannels(booking, buildVisitScheduledMessage(booking), 'TACAM: recordatorio de visita a la cárcel');
    };
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
    content.className = 'lawyer-card-content';
    const name = document.createElement('h3');
    name.textContent = lawyer.name || '';
    content.appendChild(name);

    const info = document.createElement('div');
    info.className = 'lawyer-info';
    const infoRows = [
      ['Especialidad', lawyer.specialty || 'Sin especialidad'],
      ['Cédula', lawyer.rut || 'No registrada'],
      ['Correo', lawyer.email || 'Sin correo'],
      ['WhatsApp', lawyer.phone || 'Sin WhatsApp']
    ];
    infoRows.forEach(([label, value]) => {
      const row = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = `${label}: `;
      row.appendChild(strong);
      row.appendChild(document.createTextNode(String(value)));
      info.appendChild(row);
    });
    content.appendChild(info);

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
  renderClientOptions();
  renderClients();
  renderClientEditOptions();
  renderBookings();
  renderAgenda();
  renderAgendaCalendar();
  renderPrisonCalendar();
  renderPrisonVisitsList();
  renderLawyers();
  renderLawyerCalendar();
  renderProfiles();
  renderReports();
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

clientForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(clientForm);
  const rut = formatRut(data.get('rut'));
  const phone = formatPhone(data.get('phone'));
  const email = String(data.get('email') || '').trim();
  const name = String(data.get('name') || '').trim();
  const address = String(data.get('address') || '').trim();

  if (!isValidRut(rut)) {
    clientRutInput.setCustomValidity('El RUT debe tener formato xx.xxx.xxx-x');
    clientRutInput.reportValidity();
    return;
  }
  clientRutInput.setCustomValidity('');

  if (!isValidPhone(phone)) {
    clientPhoneInput.setCustomValidity('El teléfono debe tener formato +5691111111');
    clientPhoneInput.reportValidity();
    return;
  }
  clientPhoneInput.setCustomValidity('');

  if (!email) {
    clientForm.elements.email.setCustomValidity('El correo es obligatorio');
    clientForm.elements.email.reportValidity();
    return;
  }
  clientForm.elements.email.setCustomValidity('');
  if (!name || !address) return;

  const clients = getClients();
  const existing = clients.find(client => (client.rut || '').trim() === rut);

  if (existing) {
    existing.name = name;
    existing.phone = phone;
    existing.email = email;
    existing.address = address;
    existing.updatedAt = new Date().toISOString();
  } else {
    clients.unshift({
      id: crypto.randomUUID(),
      name,
      rut,
      phone,
      email,
      address,
      createdAt: new Date().toISOString()
    });
  }

  saveClients(clients);
  clientForm.reset();
  clientPhoneInput.value = '+569';
  renderAll();
  showToast('Cliente guardado correctamente.');
});

clientEditForm.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(clientEditForm);
  const clientId = String(data.get('clientId') || '').trim();
  const rut = formatRut(data.get('rut'));
  const phone = formatPhone(data.get('phone'));
  const name = String(data.get('name') || '').trim();
  const email = String(data.get('email') || '').trim();
  const address = String(data.get('address') || '').trim();
  const hiredLater = Boolean(data.get('hiredLater'));
  const assignedTo = normalizeAssignedToValue(data.get('assignedTo'));

  if (!clientId || !name || !email || !address) return;

  if (!isValidRut(rut)) {
    clientEditRutInput.setCustomValidity('RUT inválido');
    clientEditRutInput.reportValidity();
    return;
  }
  clientEditRutInput.setCustomValidity('');

  if (!isValidPhone(phone)) {
    clientEditPhoneInput.setCustomValidity('Teléfono inválido');
    clientEditPhoneInput.reportValidity();
    return;
  }
  clientEditPhoneInput.setCustomValidity('');

  const clients = getClients();
  const client = clients.find(item => item.id === clientId);
  if (!client) return;

  client.name = name;
  client.rut = rut;
  client.phone = phone;
  client.email = email;
  client.address = address;
  client.updatedAt = new Date().toISOString();
  saveClients(clients);

  const bookings = getBookings();
  bookings.forEach(booking => {
    if (booking.clientId !== clientId) return;
    booking.customer = name;
    booking.rut = rut;
    booking.phone = phone;
    booking.email = email;
    booking.address = address;
    if (hiredLater && !isPrisonVisit(booking)) {
      booking.hiredLawyer = true;
      booking.assignedTo = assignedTo;
      booking.status = booking.status === 'cancelada' ? 'confirmada' : booking.status;
    }
  });
  saveBookings(bookings);
  renderAll();
  showToast('Cliente actualizado correctamente.');
});

bookingForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(bookingForm);
  const selectedClientId = String(data.get('clientId') || '').trim();
  const selectedClient = getClients().find(client => client.id === selectedClientId);
  if (!selectedClient) {
    showToast('Debes seleccionar un cliente guardado.');
    return;
  }

  const hiredLawyer = Boolean(data.get('hiredLawyer'));
  const assignedTo = normalizeAssignedToValue(data.get('assignedTo'));

  const bookings = getBookings();
  bookings.unshift({
    id: crypto.randomUUID(),
    clientId: selectedClient.id,
    customer: selectedClient.name,
    rut: selectedClient.rut,
    phone: selectedClient.phone,
    email: selectedClient.email,
    address: selectedClient.address,
    matter: normalizeMatterLabel(data.get('matter')),
    date: String(data.get('date') || '').trim(),
    time: String(data.get('time') || '').trim(),
    assignedTo: hiredLawyer ? assignedTo : '',
    hiredLawyer,
    notes: String(data.get('notes') || '').trim(),
    notificationsConsent: Boolean(data.get('notificationsConsent')),
    consentAt: data.get('notificationsConsent') ? new Date().toISOString() : '',
    prisonAttendance: '',
    status: 'nueva',
    createdAt: new Date().toISOString(),
    reminder24hSentAt: '',
    reminder1hSentAt: '',
    checkedInAt: ''
  });
  saveBookings(bookings);
  await notifyVisitScheduled(bookings[0]);
  bookingForm.reset();
  clientSearchInput.value = '';
  clientSearchResults.replaceChildren();
  clientSelectedLabel.textContent = 'Cliente seleccionado: ninguno';
  fillSelectedClientPreview(null);
  hiredLawyerInput.checked = true;
  renderAll();
  showToast('Reserva guardada correctamente.');
});

prisonBookingForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(prisonBookingForm);
  const clientId = String(data.get('clientId') || '').trim();
  const assignedTo = normalizeAssignedToValue(data.get('assignedTo'));
  const client = getClients().find(item => item.id === clientId);
  if (!client) return;

  const bookings = getBookings();
  bookings.unshift({
    id: crypto.randomUUID(),
    clientId: client.id,
    customer: client.name,
    rut: client.rut,
    phone: client.phone,
    email: client.email,
    address: client.address,
    matter: PRISON_VISIT_MATTER,
    date: String(data.get('date') || '').trim(),
    time: String(data.get('time') || '').trim().slice(0, 5),
    assignedTo,
    hiredLawyer: true,
    notes: String(data.get('notes') || '').trim(),
    notificationsConsent: Boolean(data.get('notificationsConsent')),
    consentAt: data.get('notificationsConsent') ? new Date().toISOString() : '',
    prisonAttendance: '',
    status: 'confirmada',
    createdAt: new Date().toISOString(),
    reminder24hSentAt: '',
    reminder1hSentAt: '',
    checkedInAt: ''
  });
  saveBookings(bookings);
  await notifyVisitScheduled(bookings[0]);
  prisonBookingForm.reset();
  renderAll();
  showToast('Visita a la cárcel agendada correctamente.');
});

clientRutInput.addEventListener('input', () => {
  const cursorAtEnd = clientRutInput.selectionStart === clientRutInput.value.length;
  clientRutInput.value = formatRut(clientRutInput.value);
  if (cursorAtEnd) clientRutInput.setSelectionRange(clientRutInput.value.length, clientRutInput.value.length);
});

clientPhoneInput.addEventListener('input', () => {
  clientPhoneInput.value = formatPhone(clientPhoneInput.value);
});

clientSearchInput.addEventListener('input', renderClientOptions);
clientEditSelect.addEventListener('change', () => fillClientEditForm(clientEditSelect.value));
clientEditRutInput.addEventListener('input', () => {
  clientEditRutInput.value = formatRut(clientEditRutInput.value);
});
clientEditPhoneInput.addEventListener('input', () => {
  clientEditPhoneInput.value = formatPhone(clientEditPhoneInput.value);
});
clientEditHiredLaterInput.addEventListener('change', () => {
  clientEditAssignedToSelect.disabled = !clientEditHiredLaterInput.checked;
  if (!clientEditHiredLaterInput.checked) {
    clientEditAssignedToSelect.value = UNASSIGNED_LAWYER_LABEL;
  }
});
hiredLawyerInput.addEventListener('change', () => {
  assignedToSelect.disabled = !hiredLawyerInput.checked;
  if (!hiredLawyerInput.checked) assignedToSelect.value = '';
});

lawyerFilter.addEventListener('change', () => {
  renderAgenda();
  renderAgendaCalendar();
});
agendaMonthInput.addEventListener('change', renderAgendaCalendar);
prisonMonthInput.addEventListener('change', () => {
  renderPrisonCalendar();
  renderPrisonVisitsList();
});
prisonLawyerFilter.addEventListener('change', () => {
  renderPrisonCalendar();
  renderPrisonVisitsList();
});
lawyerCalendarFilter.addEventListener('change', renderLawyerCalendar);
lawyerCalendarMonth.addEventListener('change', renderLawyerCalendar);
sharedOnlyInput.addEventListener('change', renderLawyerCalendar);

downloadGeneralReportBtn.addEventListener('click', () => {
  const stats = getGeneralStatusStats();
  downloadCsv('reporte-general-tacam.csv', [
    ['Estado', 'Cantidad'],
    ['Nueva', stats.nueva],
    ['Confirmada', stats.confirmada],
    ['Atendida', stats.atendida],
    ['Cancelada', stats.cancelada]
  ]);
  showToast('Reporte general descargado.');
});

downloadLawyerReportBtn.addEventListener('click', () => {
  const rows = [['Abogada', 'Total citas', 'Atendidas']];
  getLawyerAttentionStats().forEach(item => {
    rows.push([item.lawyer, item.total, item.atendida]);
  });
  downloadCsv('reporte-abogadas-tacam.csv', rows);
  showToast('Reporte por abogada descargado.');
});

downloadBookingsReportBtn.addEventListener('click', () => {
  const rows = [[
    'ID', 'Cliente', 'RUT', 'Materia', 'Telefono', 'Correo', 'Fecha', 'Hora', 'Abogada', 'Estado', 'Consentimiento', 'Motivo', 'Creada en'
  ]];
  getBookings().forEach(booking => {
    rows.push([
      booking.id,
      booking.customer,
      booking.rut,
      normalizeMatterLabel(booking.matter),
      booking.phone,
      booking.email,
      booking.date,
      booking.time,
      booking.assignedTo,
      booking.status,
      booking.notificationsConsent ? 'Sí' : 'No',
      booking.notes,
      booking.createdAt
    ]);
  });
  downloadCsv('reporte-detalle-citas-tacam.csv', rows);
  showToast('Detalle de leads descargado.');
});

downloadBackupJsonBtn.addEventListener('click', () => {
  downloadJson(`respaldo-tacam-${new Date().toISOString().slice(0, 10)}.json`, createBackupPayload());
  showToast('Respaldo JSON descargado.');
});

restoreBackupJsonBtn.addEventListener('click', () => {
  restoreBackupInput.click();
});

restoreBackupInput.addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const content = await file.text();
    const payload = JSON.parse(content);
    restoreBackupPayload(payload);
    showToast('Respaldo cargado correctamente.');
  } catch (error) {
    console.error('No se pudo restaurar el respaldo', error);
    showToast('No se pudo cargar el respaldo JSON.');
  } finally {
    restoreBackupInput.value = '';
  }
});

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
  showToast('Perfil de abogada guardado.');
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
  showToast('Perfil de usuario guardado.');
});

switchModule('create');

const currentMonth = monthValueFromDate(new Date());
agendaMonthInput.value = currentMonth;
prisonMonthInput.value = currentMonth;
lawyerCalendarMonth.value = currentMonth;
clientPhoneInput.value = '+569';
assignedToSelect.disabled = !hiredLawyerInput.checked;
updateChileClock();

saveSession({ loggedIn: false });
showLogin();

window.addEventListener('tacam-server-hydrated', () => {
  if (!appShell.hidden) renderAll();
});

setInterval(() => {
  updateChileClock();
  if (!appShell.hidden) {
    renderAll();
    void notifyUpcomingAppointments();
  }
}, 5000);
