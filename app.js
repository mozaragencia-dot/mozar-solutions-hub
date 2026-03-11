const bookingsBody = document.getElementById('bookings-body');
const agendaBody = document.getElementById('agenda-body');
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

function renderBookings() {
  const bookings = getBookings();
  bookingsBody.innerHTML = bookings.length ? bookings.map(booking => `
    <tr>
      <td>${fmtDate(booking.createdAt)}</td>
      <td>${booking.customer}</td>
      <td>${booking.phone}</td>
      <td>${formatAppointment(booking)}</td>
      <td>
        <input data-assign-input="${booking.id}" value="${booking.assignedTo || ''}" placeholder="Nombre abogado" />
      </td>
      <td><span class="badge ${booking.status}">${statusLabel(booking.status)}</span></td>
      <td>
        <button data-confirm-btn="${booking.id}">Confirmar</button>
        <button data-cancel-btn="${booking.id}">Cancelar</button>
        <button data-save-btn="${booking.id}">Guardar</button>
      </td>
      <td><button data-notify-btn="${booking.id}">WhatsApp</button></td>
    </tr>
  `).join('') : '<tr><td colspan="8">Sin reservas registradas</td></tr>';

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

  agendaBody.innerHTML = bookings.length ? bookings.map(booking => `
    <tr>
      <td>${booking.customer}</td>
      <td>${formatAppointment(booking)}</td>
      <td>${booking.notes || '-'}</td>
      <td><span class="badge ${booking.status}">${statusLabel(booking.status)}</span></td>
      <td>
        <button data-attend="${booking.id}">Marcar atendida</button>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="5">Sin citas para mostrar</td></tr>';

  agendaBody.querySelectorAll('[data-attend]').forEach(btn => {
    btn.onclick = () => updateBooking(btn.dataset.attend, booking => { booking.status = 'atendida'; });
  });
}

function renderLawyers() {
  const lawyers = getLawyers();
  lawyerList.innerHTML = lawyers.length ? lawyers.map(lawyer => `
    <article class="lawyer-card">
      <img src="${lawyer.photo}" alt="Foto de ${lawyer.name}" />
      <div>
        <h3>${lawyer.name}</h3>
        <p>${lawyer.specialty || 'Sin especialidad'}</p>
        <small>${lawyer.phone || 'Sin WhatsApp'}</small>
      </div>
    </article>
  `).join('') : '<p>No hay abogados cargados.</p>';
}

function renderAll() {
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
