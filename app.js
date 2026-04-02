const loginScreen = document.getElementById('login-screen');
const appShell = document.getElementById('app-shell');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

const bookingsBody = document.getElementById('bookings-body');
const bookingStatusFilter = document.getElementById('booking-status-filter');
const bookingMatterFilter = document.getElementById('booking-matter-filter');
const agendaBody = document.getElementById('agenda-body');
const clientsBody = document.getElementById('clients-body');
const clientForm = document.getElementById('client-form');
const bookingForm = document.getElementById('booking-form');
const prisonVisitForm = document.getElementById('prison-visit-form');
const lawyerFilter = document.getElementById('lawyer-filter');
const agendaMonthInput = document.getElementById('agenda-month');
const agendaCalendar = document.getElementById('agenda-calendar');
const agendaLegend = document.getElementById('agenda-color-legend');
const prisonMonthInput = document.getElementById('prison-month');
const prisonCalendar = document.getElementById('prison-calendar');
const prisonCalendarLegend = document.getElementById('prison-calendar-legend');
const prisonVisitsBody = document.getElementById('prison-visits-body');
const contractedBody = document.getElementById('contracted-body');
const nonContractedBody = document.getElementById('non-contracted-body');
const remarketingForm = document.getElementById('remarketing-form');
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
const downloadGeneralReportBtn = document.getElementById('download-general-report');
const downloadLawyerReportBtn = document.getElementById('download-lawyer-report');
const downloadBookingsReportBtn = document.getElementById('download-bookings-report');
const downloadBackupJsonBtn = document.getElementById('download-backup-json');
const restoreBackupJsonBtn = document.getElementById('restore-backup-json');
const restoreBackupInput = document.getElementById('restore-backup-input');
const profileForm = document.getElementById('profile-form');
const profileList = document.getElementById('profile-list');
const clientRutInput = clientForm.elements.rut;
const clientPhoneInput = clientForm.elements.phone;
const chileClock = document.getElementById('chile-clock');
const assignedToSelect = bookingForm.elements.assignedTo;
const prisonAssignedToSelect = prisonVisitForm.elements.assignedTo;
const clientSelect = bookingForm.elements.clientId;
const prisonClientSelect = prisonVisitForm.elements.clientId;
const bookingClientSearchInput = bookingForm.elements.clientSearch;
const prisonClientSearchInput = prisonVisitForm.elements.clientSearch;
const bookingClientOptions = document.getElementById('booking-client-options');
const prisonClientOptions = document.getElementById('prison-client-options');
const bookingIsImputadoInput = document.getElementById('booking-is-imputado');
const bookingImputadoFields = document.getElementById('booking-imputado-fields');
const moduleTabs = document.querySelectorAll('[data-module-tab]');
const modulePanels = document.querySelectorAll('[data-module-panel]');
let clientOptionMap = new Map();

function toggleBookingImputadoFields() {
  const enabled = Boolean(bookingIsImputadoInput?.checked);
  if (!bookingImputadoFields) return;

  bookingImputadoFields.hidden = !enabled;
  bookingImputadoFields.querySelectorAll('input, select, textarea').forEach(input => {
    input.disabled = !enabled;
  });
}

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
const PRISON_VISIT_MATTER = 'Visita a la Carcel';

function normalizeMatterLabel(value) {
  const clean = String(value || '').trim();
  if (!clean) return '';
  const normalized = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (normalized.includes('cartel') || normalized.includes('carcel')) return PRISON_VISIT_MATTER;
  return clean;
}

function isPrisonVisit(booking) {
  return normalizeMatterLabel(booking?.matter) === PRISON_VISIT_MATTER;
}

function tryLogin(username, password) {
  return ALLOWED_CREDENTIALS.some(cred => cred.username === username && cred.password === password);
}

function hasNotificationConsent(booking) {
  return Boolean(booking?.notificationsConsent);
}

async function sendEmailViaBrevoToRecipient(toEmail, toName, subject, message) {
  const email = String(toEmail || '').trim();
  if (!email) return false;

  try {
    const response = await fetch('brevo-email.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toEmail: email,
        toName: toName || 'Contacto',
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

async function sendEmailViaBrevo(booking, subject, message) {
  return sendEmailViaBrevoToRecipient(booking?.email, booking?.customer || 'Cliente', subject, message);
}

async function sendWhatsAppViaBrevo(phone, textContent) {
  const toPhone = cleanPhone(phone);
  if (!toPhone || !textContent) return false;

  try {
    const response = await fetch('brevo-whatsapp.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toPhone, textContent })
    });
    return response.ok;
  } catch (error) {
    console.warn('Brevo WhatsApp request failed', error);
    return false;
  }
}

async function openWhatsAppFallback(phone, textContent) {
  const toPhone = cleanPhone(phone);
  if (!toPhone || !textContent) return false;
  window.open(`https://wa.me/${toPhone}?text=${encodeURIComponent(textContent)}`, '_blank', 'noopener');
  return true;
}

async function sendWhatsAppMessage(phone, textContent) {
  const sentViaBrevo = await sendWhatsAppViaBrevo(phone, textContent);
  if (sentViaBrevo) return true;
  return openWhatsAppFallback(phone, textContent);
}

async function notifyBooking(booking) {
  if (!hasNotificationConsent(booking)) return false;
  const destination = cleanPhone(booking.phone);
  if (!destination) return false;
  return sendWhatsAppMessage(destination, buildTacamMessage(booking));
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

  const targets = [cleanPhone(booking.phone)].filter(Boolean);
  let sent = false;

  for (const target of [...new Set(targets)]) {
    const targetSent = await sendWhatsAppMessage(target, message);
    if (targetSent) sent = true;
  }

  const emailSent = await sendEmailViaBrevo(booking, emailSubject, message);
  return sent || emailSent;
}

async function notifyVisitScheduled(booking) {
  const message = buildVisitScheduledMessage(booking);
  if (isPrisonVisit(booking)) {
    return notifyLawyerChannels(booking, message, 'TACAM: visita a la carcel agendada');
  }
  return notifyBookingChannels(booking, message, 'Calendario de visitas TACAM: cita agendada');
}

function getLawyerPhone(lawyerName) {
  const lawyer = getLawyers().find(item => (item.name || '').trim() === (lawyerName || '').trim());
  return lawyer ? cleanPhone(lawyer.phone) : '';
}

function getLawyerEmail(lawyerName) {
  const lawyer = getLawyers().find(item => (item.name || '').trim() === (lawyerName || '').trim());
  return lawyer ? String(lawyer.email || '').trim() : '';
}

async function notifyReschedule(booking, fromDate, toDate) {
  const message = buildRescheduleMessage(booking, fromDate, toDate);
  return notifyBookingChannels(booking, message, 'Reagendamiento de cita TACAM');
}

async function notifyLawyerChannels(booking, message, emailSubject) {
  const lawyerPhone = getLawyerPhone(booking.assignedTo);
  const lawyerEmail = getLawyerEmail(booking.assignedTo);
  let sent = false;

  if (lawyerPhone) {
    sent = await sendWhatsAppMessage(lawyerPhone, message);
  }

  const emailSent = await sendEmailViaBrevoToRecipient(lawyerEmail, booking.assignedTo || 'Abogada', emailSubject, message);
  return sent || emailSent;
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
      const sent24h = isPrisonVisit(booking)
        ? await notifyLawyerChannels(booking, build24hReminderMessage(booking), 'Recordatorio TACAM: visita en 24 horas')
        : await notifyBookingChannels(booking, build24hReminderMessage(booking), 'Recordatorio TACAM: cita en 24 horas');
      if (sent24h) {
        booking.reminder24hSentAt = now.toISOString();
        hasUpdates = true;
      }
    }

    if (diffMinutes <= 60 && !booking.reminder1hSentAt) {
      const sent1h = isPrisonVisit(booking)
        ? await notifyLawyerChannels(booking, buildReminderMessage(booking, diffMinutes), 'Recordatorio TACAM: visita en 60 minutos')
        : await notifyBookingChannels(booking, buildReminderMessage(booking, diffMinutes), 'Recordatorio TACAM: vas a tener una cita');
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

function buildDispatchConfirmationMessage(booking) {
  const appointment = `${booking.date || '-'} ${booking.time || ''}`.trim();
  const matter = normalizeMatterLabel(booking.matter) || 'General';
  return `TACAM: confirmamos tu agendamiento. Fecha/Hora: ${appointment}. Materia: ${matter}. Abogada: ${booking.assignedTo || 'Por confirmar'}.`;
}

async function updateBookingStatusWithNotification(bookingId, status) {
  const bookings = getBookings();
  const booking = bookings.find(item => item.id === bookingId);
  if (!booking) return;

  booking.status = status;
  saveBookings(bookings);
  renderAll();

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

function getClientLabel(client) {
  const name = String(client?.customer || '').trim();
  const rut = String(client?.rut || '').trim();
  if (!name) return rut || 'Cliente sin nombre';
  return rut ? `${name} · ${rut}` : name;
}

function getClientById(clientId) {
  return getClients().find(client => client.id === clientId);
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
  fillSelectWithNames(assignedToSelect, names, 'No asignar ahora');
  fillSelectWithNames(prisonAssignedToSelect, names, 'No asignar ahora');
  fillSelectWithNames(lawyerFilter, names, 'Todos');
  fillSelectWithNames(lawyerCalendarFilter, names, 'Todas');
}

function renderClientOptions() {
  const clients = getClients().sort((a, b) => getClientLabel(a).localeCompare(getClientLabel(b), 'es'));
  const currentBookingClient = clientSelect.value;
  const currentPrisonClient = prisonClientSelect.value;
  const map = new Map();
  bookingClientOptions.replaceChildren();
  prisonClientOptions.replaceChildren();

  clients.forEach(client => {
    const label = getClientLabel(client);
    map.set(label, client.id);

    const bookingOption = document.createElement('option');
    bookingOption.value = label;
    bookingClientOptions.appendChild(bookingOption);

    const prisonOption = document.createElement('option');
    prisonOption.value = label;
    prisonClientOptions.appendChild(prisonOption);
  });

  clientOptionMap = map;

  const currentBooking = clients.find(client => client.id === currentBookingClient);
  if (currentBooking) bookingClientSearchInput.value = getClientLabel(currentBooking);

  const currentPrison = clients.find(client => client.id === currentPrisonClient);
  if (currentPrison) prisonClientSearchInput.value = getClientLabel(currentPrison);
}

function syncClientIdFromSearch(searchInput, hiddenInput) {
  const typed = String(searchInput.value || '').trim();
  hiddenInput.value = clientOptionMap.get(typed) || '';
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
  const allBookings = getBookings().filter(booking => booking.status !== 'cancelada' && booking.date);
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
  getLawyerNames().forEach(name => {
    map.set(name, { total: 0, atendida: 0 });
  });

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
  getLawyerNames().forEach(name => map.set(name, 0));

  getBookings()
    .filter(booking => isPrisonVisit(booking))
    .forEach(booking => {
      const lawyer = (booking.assignedTo || 'Sin abogada').trim() || 'Sin abogada';
      if (!map.has(lawyer)) map.set(lawyer, 0);
      map.set(lawyer, map.get(lawyer) + 1);
    });

  return [...map.entries()]
    .map(([lawyer, total]) => ({ lawyer, total }))
    .sort((a, b) => a.lawyer.localeCompare(b.lawyer, 'es'));
}

function getPrisonVisitLoadColor(total) {
  if (total <= 1) return '#d90429'; // rojo
  if (total <= 3) return '#ffbe0b'; // amarillo
  return '#2a9d8f'; // verde
}

function drawPrisonLoadChart(canvas, stats) {
  if (!(canvas instanceof HTMLCanvasElement)) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = '#5a313d';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Visitas a la carcel por abogada', 24, 28);

  const legend = [
    { label: '0-1', color: '#d90429' },
    { label: '2-3', color: '#ffbe0b' },
    { label: '4+', color: '#2a9d8f' }
  ];
  legend.forEach((item, index) => {
    const x = 24 + (index * 120);
    ctx.fillStyle = item.color;
    ctx.fillRect(x, 40, 20, 12);
    ctx.fillStyle = '#4a2a34';
    ctx.font = '12px Arial';
    ctx.fillText(item.label, x + 28, 50);
  });

  const sorted = [...stats].sort((a, b) => b.total - a.total || a.lawyer.localeCompare(b.lawyer, 'es'));
  const maxValue = Math.max(4, ...sorted.map(item => item.total));
  const labelX = 24;
  const barX = 330;
  const barMaxWidth = width - barX - 60;
  const startY = 80;
  const rowHeight = 28;

  sorted.forEach((item, index) => {
    const y = startY + index * rowHeight;
    ctx.fillStyle = '#4a2a34';
    ctx.font = '12px Arial';
    const label = item.lawyer.length > 38 ? `${item.lawyer.slice(0, 38)}…` : item.lawyer;
    ctx.fillText(label, labelX, y + 12);

    const barWidth = Math.max(2, (item.total / maxValue) * barMaxWidth);
    ctx.fillStyle = getPrisonVisitLoadColor(item.total);
    ctx.fillRect(barX, y, barWidth, 14);

    ctx.fillStyle = '#2f1a21';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(String(item.total), barX + barWidth + 8, y + 12);
  });
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
    ctx.fillText(String(value), x + barWidth / 2 - 5, y - 6);

    ctx.fillStyle = '#5a313d';
    const label = labels[index].length > 16 ? `${labels[index].slice(0, 16)}…` : labels[index];
    ctx.fillText(label, x, padTop + chartHeight + 18);
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

function buildFullExportRows() {
  const rows = [
    ['SECCIÓN', 'ID', 'Nombre', 'RUT', 'Correo', 'Teléfono', 'Dirección', 'Materia', 'Fecha', 'Hora', 'Abogada', 'Estado', 'Post-visita', 'Consentimiento', 'Creado en']
  ];

  getBookings().forEach(booking => {
    rows.push([
      'Reservas',
      booking.id,
      booking.customer || '',
      booking.rut || '',
      booking.email || '',
      booking.phone || '',
      booking.address || '',
      normalizeMatterLabel(booking.matter),
      booking.date || '',
      booking.time || '',
      booking.assignedTo || '',
      statusLabel(booking.status),
      booking.postVisitOutcome || '',
      booking.notificationsConsent ? 'Sí' : 'No',
      booking.createdAt || ''
    ]);
  });

  rows.push([]);
  rows.push(['SECCIÓN', 'ID', 'Nombre', 'RUT', 'Correo', 'Teléfono', 'Dirección', 'Consentimiento', 'Creado en']);
  getClients().forEach(client => {
    rows.push([
      'Clientes',
      client.id || '',
      client.customer || '',
      client.rut || '',
      client.email || '',
      client.phone || '',
      client.address || '',
      client.notificationsConsent ? 'Sí' : 'No',
      client.createdAt || ''
    ]);
  });

  rows.push([]);
  rows.push(['SECCIÓN', 'ID', 'Nombre', 'Especialidad', 'Correo', 'WhatsApp']);
  getLawyers().forEach(lawyer => {
    rows.push([
      'Abogadas',
      lawyer.id || '',
      lawyer.name || '',
      lawyer.specialty || '',
      lawyer.email || '',
      lawyer.phone || ''
    ]);
  });

  return rows;
}

function downloadJson(filename, payload) {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
}

function buildBackupPayload() {
  return {
    exportedAt: new Date().toISOString(),
    bookings: getBookings(),
    clients: getClients(),
    lawyers: getLawyers(),
    profiles: getProfiles()
  };
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
  const lawyerColors = lawyerLabels.map(getLawyerColor);
  drawBarChart(lawyerStatsChart, lawyerLabels, lawyerValues, lawyerColors, 'Atenciones (estado atendida) por abogada');

  const prisonStats = getPrisonVisitStats();
  drawPrisonLoadChart(prisonStatsChart, prisonStats);
}

function renderBookings() {
  const selectedStatus = bookingStatusFilter.value.trim();
  const selectedMatter = normalizeMatterLabel(bookingMatterFilter.value);
  const bookings = getBookings().filter(booking => {
    if (selectedStatus && booking.status !== selectedStatus) return false;
    if (selectedMatter && normalizeMatterLabel(booking.matter) !== selectedMatter) return false;
    return true;
  });
  bookingsBody.replaceChildren();

  if (!bookings.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 11;
    cell.textContent = 'Sin reservas registradas';
    row.appendChild(cell);
    bookingsBody.appendChild(row);
    return;
  }

  bookings.forEach(booking => {
    const row = document.createElement('tr');
    appendCell(row, booking.customer || '');
    appendCell(row, normalizeMatterLabel(booking.matter) || 'General');
    appendCell(row, booking.date || '-');
    appendCell(row, booking.time || '--:--');
    const lawyerCell = document.createElement('td');
    const lawyerSelect = document.createElement('select');
    lawyerSelect.dataset.assignLawyer = booking.id;

    const noneOption = document.createElement('option');
    noneOption.value = '';
    noneOption.textContent = 'No asignar';
    lawyerSelect.appendChild(noneOption);

    getLawyerNames().forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      lawyerSelect.appendChild(option);
    });
    lawyerSelect.value = booking.assignedTo || '';
    lawyerCell.appendChild(lawyerSelect);
    row.appendChild(lawyerCell);

    const statusCell = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.className = `badge ${booking.status}`;
    statusBadge.textContent = statusLabel(booking.status);
    statusCell.appendChild(statusBadge);
    row.appendChild(statusCell);

    appendCell(row, booking.confirmationSentAt ? `Enviado ${fmtDate(booking.confirmationSentAt)}` : 'Pendiente');

    const sendConfirmBtn = document.createElement('button');
    sendConfirmBtn.dataset.sendConfirmBtn = booking.id;
    sendConfirmBtn.textContent = 'Enviar confirmación';
    const statusActionCell = document.createElement('td');
    statusActionCell.appendChild(sendConfirmBtn);
    row.appendChild(statusActionCell);

    const confirmSelect = document.createElement('select');
    confirmSelect.dataset.confirmState = booking.id;
    [
      { value: '', label: 'Confirmar / Cancelar' },
      { value: 'confirmada', label: 'Confirmar' },
      { value: 'cancelada', label: 'Cancelar' }
    ].forEach(optionData => {
      const option = document.createElement('option');
      option.value = optionData.value;
      option.textContent = optionData.label;
      confirmSelect.appendChild(option);
    });
    confirmSelect.value = booking.status === 'confirmada' || booking.status === 'cancelada' ? booking.status : '';
    statusActionCell.appendChild(confirmSelect);

    const attendanceCell = document.createElement('td');
    const attendanceSelect = document.createElement('select');
    attendanceSelect.dataset.attendanceState = booking.id;
    [
      { value: '', label: 'Asistió / No asistió' },
      { value: 'asistio', label: 'Asistió' },
      { value: 'no_asistio', label: 'No asistió' }
    ].forEach(optionData => {
      const option = document.createElement('option');
      option.value = optionData.value;
      option.textContent = optionData.label;
      attendanceSelect.appendChild(option);
    });
    attendanceSelect.value = booking.status === 'asistio' || booking.status === 'no_asistio' ? booking.status : '';
    attendanceCell.appendChild(attendanceSelect);
    row.appendChild(attendanceCell);

    const postVisitCell = document.createElement('td');
    const postVisitSelect = document.createElement('select');
    postVisitSelect.dataset.postVisit = booking.id;
    [
      { value: '', label: 'Sin definir' },
      { value: 'Contrató', label: 'Contrató' },
      { value: 'No contrató', label: 'No contrató' }
    ].forEach(optionData => {
      const option = document.createElement('option');
      option.value = optionData.value;
      option.textContent = optionData.label;
      postVisitSelect.appendChild(option);
    });
    postVisitSelect.value = booking.postVisitOutcome || '';
    postVisitCell.appendChild(postVisitSelect);
    row.appendChild(postVisitCell);

    const rescheduleCell = document.createElement('td');
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.value = booking.date || '';
    dateInput.dataset.rescheduleDate = booking.id;
    rescheduleCell.appendChild(dateInput);
    const timeInput = document.createElement('input');
    timeInput.type = 'time';
    timeInput.value = booking.time || '';
    timeInput.step = '1800';
    timeInput.dataset.rescheduleTime = booking.id;
    rescheduleCell.appendChild(timeInput);
    const saveRescheduleBtn = document.createElement('button');
    saveRescheduleBtn.dataset.rescheduleBtn = booking.id;
    saveRescheduleBtn.textContent = 'Guardar';
    rescheduleCell.appendChild(saveRescheduleBtn);
    row.appendChild(rescheduleCell);

    const notifyCell = document.createElement('td');
    const notifyBtn = document.createElement('button');
    notifyBtn.dataset.notifyBtn = booking.id;
    notifyBtn.textContent = 'WhatsApp';
    notifyCell.appendChild(notifyBtn);
    row.appendChild(notifyCell);

    bookingsBody.appendChild(row);
  });

  bookingsBody.querySelectorAll('[data-assign-lawyer]').forEach(select => {
    select.onchange = () => {
      updateBooking(select.dataset.assignLawyer, booking => {
        booking.assignedTo = select.value.trim();
      });
    };
  });

  bookingsBody.querySelectorAll('[data-send-confirm-btn]').forEach(btn => {
    btn.onclick = async () => {
      const bookingsData = getBookings();
      const booking = bookingsData.find(item => item.id === btn.dataset.sendConfirmBtn);
      if (!booking) return;

      const sent = await notifyBookingChannels(booking, buildDispatchConfirmationMessage(booking), 'TACAM: confirmación de agendamiento');
      if (!sent) return;

      booking.confirmationSentAt = new Date().toISOString();
      if (booking.status === 'nueva') {
        booking.status = 'confirmada';
      }
      saveBookings(bookingsData);
      renderAll();
    };
  });

  bookingsBody.querySelectorAll('[data-reschedule-btn]').forEach(btn => {
    btn.onclick = () => {
      const booking = getBookings().find(item => item.id === btn.dataset.rescheduleBtn);
      if (!booking) return;
      const newDate = bookingsBody.querySelector(`[data-reschedule-date="${booking.id}"]`)?.value || '';
      const newTime = bookingsBody.querySelector(`[data-reschedule-time="${booking.id}"]`)?.value || '';
      if (!newDate || !newTime) return;

      updateBooking(booking.id, item => {
        item.date = newDate.trim();
        item.time = newTime.trim();
        item.reminder24hSentAt = '';
        item.reminder1hSentAt = '';
      });
      void notifyReschedule(booking, booking.date, newDate.trim());
    };
  });

  bookingsBody.querySelectorAll('[data-confirm-state]').forEach(select => {
    select.onchange = async () => {
      if (!select.value) return;
      await updateBookingStatusWithNotification(select.dataset.confirmState, select.value);
    };
  });

  bookingsBody.querySelectorAll('[data-attendance-state]').forEach(select => {
    select.onchange = () => {
      if (!select.value) return;
      const bookingId = select.dataset.attendanceState;
      if (select.value === 'asistio') {
        const outcome = window.prompt('Post-visita: escribe "Contrató" o "No contrató"', 'Contrató');
        if (!outcome) return;
        const normalized = outcome.trim().toLowerCase();
        const finalOutcome = normalized === 'no contrató' || normalized === 'no contrato'
          ? 'No contrató'
          : 'Contrató';

        updateBooking(bookingId, booking => {
          booking.status = 'asistio';
          booking.postVisitOutcome = finalOutcome;
        });
        return;
      }

      updateBooking(bookingId, booking => {
        booking.status = 'no_asistio';
        booking.postVisitOutcome = '';
      });
    };
  });

  bookingsBody.querySelectorAll('[data-post-visit]').forEach(select => {
    select.onchange = () => {
      updateBooking(select.dataset.postVisit, booking => {
        booking.postVisitOutcome = select.value;
      });
    };
  });

  bookingsBody.querySelectorAll('[data-notify-btn]').forEach(btn => {
    btn.onclick = async () => {
      const booking = getBookings().find(item => item.id === btn.dataset.notifyBtn);
      if (booking) await notifyBooking(booking);
    };
  });
}

function renderAgenda() {
  const selectedLawyer = lawyerFilter.value.trim();
  const bookings = getBookings().filter(booking =>
    booking.status !== 'cancelada' && !isPrisonVisit(booking) && (!selectedLawyer || booking.assignedTo === selectedLawyer)
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


function buildPrisonCheckInMessage(booking) {
  return `TACAM: check-in registrado para la visita a la carcel de ${booking.customer || 'Cliente'}. Fecha/Hora: ${booking.date || '-'} ${booking.time || ''}. Abogada: ${booking.assignedTo || 'Por confirmar'}.`;
}

function renderPrisonCalendar() {
  const selectedMonth = prisonMonthInput.value;
  const bookings = getCalendarBookings('', selectedMonth, false, booking => isPrisonVisit(booking));
  const names = [...new Set(bookings.map(booking => booking.assignedTo).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  renderCalendarLegend(prisonCalendarLegend, names);
  renderCalendar(prisonCalendar, bookings, selectedMonth);
}

function renderPrisonVisitsList() {
  const selectedMonth = prisonMonthInput.value;
  const visits = getBookings()
    .filter(booking => booking.status !== 'cancelada' && isPrisonVisit(booking))
    .filter(booking => !selectedMonth || booking.date.slice(0, 7) === selectedMonth)
    .sort((a, b) => `${a.date || ''} ${a.time || ''}`.localeCompare(`${b.date || ''} ${b.time || ''}`));

  prisonVisitsBody.replaceChildren();

  if (!visits.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.textContent = 'Sin visitas a la carcel registradas en este mes.';
    row.appendChild(cell);
    prisonVisitsBody.appendChild(row);
    return;
  }

  visits.forEach(booking => {
    const row = document.createElement('tr');
    appendCell(row, booking.assignedTo || 'Sin abogada');
    appendCell(row, booking.customer || '');
    appendCell(row, booking.date || '-');
    appendCell(row, booking.time || '--:--');

    const statusCell = document.createElement('td');
    const statusBadge = document.createElement('span');
    statusBadge.className = `badge ${booking.status}`;
    statusBadge.textContent = statusLabel(booking.status);
    statusCell.appendChild(statusBadge);
    row.appendChild(statusCell);

    const checkInCell = document.createElement('td');
    const checkInBtn = document.createElement('button');
    checkInBtn.dataset.prisonCheckin = booking.id;
    checkInBtn.textContent = booking.checkedInAt ? `Check-in ${fmtDate(booking.checkedInAt)}` : 'Registrar check-in';
    checkInBtn.disabled = Boolean(booking.checkedInAt);
    checkInCell.appendChild(checkInBtn);
    row.appendChild(checkInCell);

    const reminderCell = document.createElement('td');
    const reminderBtn = document.createElement('button');
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
        await notifyLawyerChannels(updatedBooking, buildPrisonCheckInMessage(updatedBooking), 'TACAM: check-in visita a la carcel');
      }
    };
  });

  prisonVisitsBody.querySelectorAll('[data-prison-notify]').forEach(btn => {
    btn.onclick = async () => {
      const booking = getBookings().find(item => item.id === btn.dataset.prisonNotify);
      if (booking) await notifyLawyerChannels(booking, buildVisitScheduledMessage(booking), 'TACAM: recordatorio de visita a la carcel');
    };
  });
}

function renderOutcomes() {
  const bookings = getBookings().filter(booking => booking.status === 'asistio');
  const contracted = bookings.filter(booking => (booking.postVisitOutcome || '').trim().toLowerCase() === 'contrató');
  const nonContracted = bookings.filter(booking => (booking.postVisitOutcome || '').trim().toLowerCase() === 'no contrató');

  contractedBody.replaceChildren();
  nonContractedBody.replaceChildren();

  if (!contracted.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.textContent = 'Sin personas contratadas registradas.';
    row.appendChild(cell);
    contractedBody.appendChild(row);
  } else {
    contracted.forEach(booking => {
      const row = document.createElement('tr');
      appendCell(row, booking.customer || '');
      appendCell(row, booking.email || '');
      appendCell(row, booking.phone || '');
      appendCell(row, formatAppointment(booking));
      appendCell(row, booking.assignedTo || 'Sin abogada');
      contractedBody.appendChild(row);
    });
  }

  if (!nonContracted.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.textContent = 'Sin personas en no contratados.';
    row.appendChild(cell);
    nonContractedBody.appendChild(row);
  } else {
    nonContracted.forEach(booking => {
      const row = document.createElement('tr');
      appendCell(row, booking.customer || '');
      appendCell(row, booking.email || '');
      appendCell(row, booking.phone || '');
      appendCell(row, formatAppointment(booking));

      const actionCell = document.createElement('td');
      const mailBtn = document.createElement('button');
      mailBtn.dataset.nonContractedMail = booking.id;
      mailBtn.textContent = 'Escribir y enviar';
      actionCell.appendChild(mailBtn);
      row.appendChild(actionCell);
      nonContractedBody.appendChild(row);
    });
  }

  nonContractedBody.querySelectorAll('[data-non-contracted-mail]').forEach(btn => {
    btn.onclick = async () => {
      const booking = getBookings().find(item => item.id === btn.dataset.nonContractedMail);
      if (!booking) return;
      const subject = window.prompt('Asunto del correo', 'Seguimiento TACAM');
      if (!subject) return;
      const message = window.prompt('Escribe el correo a enviar', `Hola ${booking.customer || 'cliente'}, te contactamos para darte seguimiento a tu caso.`);
      if (!message) return;
      await sendEmailViaBrevo(booking, subject.trim(), message.trim());
    };
  });
}

function loadClientInForm(clientId) {
  const client = getClients().find(item => item.id === clientId);
  if (!client) return;
  clientForm.elements.clientId.value = client.id;
  clientForm.elements.customer.value = client.customer || '';
  clientForm.elements.rut.value = client.rut || '';
  clientForm.elements.address.value = client.address || '';
  clientForm.elements.phone.value = client.phone || '+569';
  clientForm.elements.email.value = client.email || '';
  clientForm.elements.notificationsConsent.checked = Boolean(client.notificationsConsent);
}

function renderClients() {
  const clients = getClients().sort((a, b) => (a.customer || '').localeCompare(b.customer || '', 'es'));
  clientsBody.replaceChildren();

  if (!clients.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.textContent = 'Sin clientes registrados.';
    row.appendChild(cell);
    clientsBody.appendChild(row);
    return;
  }

  clients.forEach(client => {
    const row = document.createElement('tr');
    appendCell(row, client.customer || '');
    appendCell(row, client.rut || '');
    appendCell(row, client.phone || '');
    appendCell(row, client.email || '');

    const actionCell = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.dataset.editClient = client.id;
    editBtn.textContent = 'Editar';
    actionCell.appendChild(editBtn);
    row.appendChild(actionCell);
    clientsBody.appendChild(row);
  });

  clientsBody.querySelectorAll('[data-edit-client]').forEach(btn => {
    btn.onclick = () => loadClientInForm(btn.dataset.editClient);
  });
}

function loadLawyerInForm(lawyerId) {
  const lawyer = getLawyers().find(item => item.id === lawyerId);
  if (!lawyer) return;
  lawyerForm.elements.lawyerId.value = lawyer.id;
  lawyerForm.elements.name.value = lawyer.name || '';
  lawyerForm.elements.specialty.value = lawyer.specialty || '';
  lawyerForm.elements.phone.value = lawyer.phone || '';
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

    const rut = document.createElement('small');
    rut.textContent = lawyer.rut ? `Cédula: ${lawyer.rut}` : 'Cédula no registrada';
    content.appendChild(rut);

    const email = document.createElement('small');
    email.textContent = lawyer.email || 'Sin correo';
    content.appendChild(email);

    const phone = document.createElement('small');
    phone.textContent = lawyer.phone || 'Sin WhatsApp';
    content.appendChild(phone);

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.dataset.editLawyer = lawyer.id;
    editBtn.textContent = 'Editar perfil';
    content.appendChild(editBtn);

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

  lawyerList.querySelectorAll('[data-edit-lawyer]').forEach(btn => {
    btn.onclick = () => loadLawyerInForm(btn.dataset.editLawyer);
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
  renderClientOptions();
  renderClients();
  renderLawyerOptions();
  renderBookings();
  renderAgenda();
  renderAgendaCalendar();
  renderPrisonCalendar();
  renderPrisonVisitsList();
  renderOutcomes();
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
  const clientId = String(data.get('clientId') || '').trim();
  const rut = formatRut(data.get('rut'));
  const phone = formatPhone(data.get('phone'));
  const email = String(data.get('email') || '').trim();

  if (!isValidRut(rut)) {
    clientRutInput.setCustomValidity('El RUT debe tener formato xx.xxx.xxx-x');
    clientRutInput.reportValidity();
    return;
  }
  clientRutInput.setCustomValidity('');

  if (!isValidPhone(phone)) {
    clientPhoneInput.setCustomValidity('El teléfono debe tener formato +56911111111');
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

  const clients = getClients();
  const normalizedRut = rut.toUpperCase();
  const existing = clientId
    ? clients.find(client => client.id === clientId)
    : clients.find(client => String(client.rut || '').toUpperCase() === normalizedRut);
  const clientPayload = {
    customer: String(data.get('customer') || '').trim(),
    rut,
    address: String(data.get('address') || '').trim(),
    phone,
    email,
    notificationsConsent: true,
    consentAt: new Date().toISOString()
  };

  if (existing) {
    Object.assign(existing, clientPayload);
  } else {
    clients.unshift({
      id: crypto.randomUUID(),
      ...clientPayload,
      createdAt: new Date().toISOString()
    });
  }

  saveClients(clients);
  clientForm.reset();
  clientForm.elements.clientId.value = '';
  clientForm.elements.notificationsConsent.checked = false;
  clientPhoneInput.value = '+569';
  renderAll();
});

bookingForm.addEventListener('submit', async event => {
  event.preventDefault();
  syncClientIdFromSearch(bookingClientSearchInput, clientSelect);
  const data = new FormData(bookingForm);
  const clientId = String(data.get('clientId') || '').trim();
  const client = getClientById(clientId);
  if (!client) {
    bookingClientSearchInput.setCustomValidity('Debes seleccionar un cliente ya agregado');
    bookingClientSearchInput.reportValidity();
    return;
  }
  bookingClientSearchInput.setCustomValidity('');

  const bookings = getBookings();
  bookings.unshift({
    id: crypto.randomUUID(),
    clientId: client.id,
    customer: client.customer,
    rut: client.rut,
    phone: client.phone,
    email: client.email,
    address: client.address || '',
    matter: normalizeMatterLabel(data.get('matter')),
    date: String(data.get('date') || '').trim(),
    time: String(data.get('time') || '').trim(),
    assignedTo: String(data.get('assignedTo') || '').trim(),
    notes: String(data.get('notes') || '').trim(),
    notificationsConsent: Boolean(client.notificationsConsent),
    consentAt: client.consentAt || '',
    status: 'nueva',
    createdAt: new Date().toISOString(),
    reminder24hSentAt: '',
    reminder1hSentAt: '',
    checkedInAt: ''
  });
  saveBookings(bookings);
  await notifyVisitScheduled(bookings[0]);
  bookingForm.reset();
  toggleBookingImputadoFields();
  renderAll();
});

prisonVisitForm.addEventListener('submit', async event => {
  event.preventDefault();
  syncClientIdFromSearch(prisonClientSearchInput, prisonClientSelect);
  const data = new FormData(prisonVisitForm);
  const clientId = String(data.get('clientId') || '').trim();
  const client = getClientById(clientId);
  if (!client) {
    prisonClientSearchInput.setCustomValidity('Debes seleccionar un cliente ya agregado');
    prisonClientSearchInput.reportValidity();
    return;
  }
  prisonClientSearchInput.setCustomValidity('');

  const bookings = getBookings();
  bookings.unshift({
    id: crypto.randomUUID(),
    clientId: client.id,
    customer: client.customer,
    rut: client.rut,
    phone: client.phone,
    email: client.email,
    address: client.address || '',
    matter: PRISON_VISIT_MATTER,
    date: String(data.get('date') || '').trim(),
    time: String(data.get('time') || '').trim(),
    assignedTo: String(data.get('assignedTo') || '').trim(),
    notes: String(data.get('notes') || '').trim(),
    notificationsConsent: Boolean(client.notificationsConsent),
    consentAt: client.consentAt || '',
    status: 'nueva',
    createdAt: new Date().toISOString(),
    reminder24hSentAt: '',
    reminder1hSentAt: '',
    checkedInAt: ''
  });
  saveBookings(bookings);
  await notifyVisitScheduled(bookings[0]);
  prisonVisitForm.reset();
  renderAll();
});

clientRutInput.addEventListener('input', () => {
  const cursorAtEnd = clientRutInput.selectionStart === clientRutInput.value.length;
  clientRutInput.value = formatRut(clientRutInput.value);
  if (cursorAtEnd) clientRutInput.setSelectionRange(clientRutInput.value.length, clientRutInput.value.length);
});

clientPhoneInput.addEventListener('input', () => {
  clientPhoneInput.value = formatPhone(clientPhoneInput.value);
});
bookingClientSearchInput.addEventListener('input', () => {
  syncClientIdFromSearch(bookingClientSearchInput, clientSelect);
});
prisonClientSearchInput.addEventListener('input', () => {
  syncClientIdFromSearch(prisonClientSearchInput, prisonClientSelect);
});

lawyerFilter.addEventListener('change', () => {
  renderAgenda();
  renderAgendaCalendar();
});
bookingStatusFilter.addEventListener('change', renderBookings);
bookingMatterFilter.addEventListener('change', renderBookings);
agendaMonthInput.addEventListener('change', renderAgendaCalendar);
prisonMonthInput.addEventListener('change', () => {
  renderPrisonCalendar();
  renderPrisonVisitsList();
});
lawyerCalendarFilter.addEventListener('change', renderLawyerCalendar);
lawyerCalendarMonth.addEventListener('change', renderLawyerCalendar);
sharedOnlyInput.addEventListener('change', renderLawyerCalendar);

downloadGeneralReportBtn.addEventListener('click', () => {
  downloadCsv('reporte-completo-tacam.csv', buildFullExportRows());
});

downloadLawyerReportBtn.addEventListener('click', () => {
  downloadCsv('reporte-completo-tacam.csv', buildFullExportRows());
});

downloadBookingsReportBtn.addEventListener('click', () => {
  downloadCsv('reporte-completo-tacam.csv', buildFullExportRows());
});

downloadBackupJsonBtn.addEventListener('click', () => {
  const dateTag = new Date().toISOString().slice(0, 10);
  downloadJson(`respaldo-tacam-${dateTag}.json`, buildBackupPayload());
});

restoreBackupJsonBtn.addEventListener('click', () => {
  restoreBackupInput.click();
});

restoreBackupInput.addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!(file instanceof File)) return;

  try {
    const content = await file.text();
    const parsed = JSON.parse(content);
    if (!parsed || typeof parsed !== 'object') return;

    if (Array.isArray(parsed.bookings)) saveBookings(parsed.bookings);
    if (Array.isArray(parsed.clients)) saveClients(parsed.clients);
    if (Array.isArray(parsed.lawyers)) saveLawyers(parsed.lawyers);
    if (Array.isArray(parsed.profiles)) saveProfiles(parsed.profiles);

    renderAll();
  } catch (error) {
    console.warn('No se pudo restaurar el respaldo JSON', error);
  } finally {
    restoreBackupInput.value = '';
  }
});

remarketingForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(remarketingForm);
  const subject = String(data.get('subject') || '').trim();
  const message = String(data.get('message') || '').trim();
  if (!subject || !message) return;

  const nonContracted = getBookings().filter(booking =>
    booking.status === 'asistio' && (booking.postVisitOutcome || '').trim().toLowerCase() === 'no contrató'
  );

  for (const booking of nonContracted) {
    await sendEmailViaBrevo(booking, subject, message);
  }

  remarketingForm.reset();
});

moduleTabs.forEach(tab => {
  tab.addEventListener('click', () => switchModule(tab.dataset.moduleTab));
});

lawyerForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(lawyerForm);
  const lawyerId = String(data.get('lawyerId') || '').trim();
  const file = data.get('photo');

  const name = String(data.get('name') || '').trim();
  if (!name) return;

  const lawyers = getLawyers();
  const existing = lawyerId
    ? lawyers.find(lawyer => lawyer.id === lawyerId)
    : lawyers.find(lawyer => (lawyer.name || '').trim().toLowerCase() === name.toLowerCase());

  if (existing) {
    existing.name = name;
    existing.specialty = String(data.get('specialty') || '').trim();
    existing.phone = String(data.get('phone') || '').trim();
    if (file instanceof File && file.size) {
      existing.photo = await fileToDataUrl(file);
    }
  } else {
    let photo = 'assets/logo-color.svg';
    if (file instanceof File && file.size) {
      photo = await fileToDataUrl(file);
    }
    lawyers.unshift({
      id: crypto.randomUUID(),
      name,
      specialty: String(data.get('specialty') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      photo
    });
  }

  saveLawyers(lawyers);
  lawyerForm.reset();
  lawyerForm.elements.lawyerId.value = '';
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

bookingIsImputadoInput?.addEventListener('change', toggleBookingImputadoFields);

switchModule('create');

const currentMonth = monthValueFromDate(new Date());
agendaMonthInput.value = currentMonth;
prisonMonthInput.value = currentMonth;
lawyerCalendarMonth.value = currentMonth;
clientPhoneInput.value = '+569';
toggleBookingImputadoFields();
updateChileClock();

saveSession({ loggedIn: false });
showLogin();
void restoreServerState().then(() => {
  renderAll();
});

setInterval(() => {
  updateChileClock();
  if (!appShell.hidden) {
    renderAll();
    void notifyUpcomingAppointments();
  }
}, 5000);
