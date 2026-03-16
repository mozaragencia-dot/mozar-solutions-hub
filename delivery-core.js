const STORAGE_KEYS = {
  bookings: 'tacam_bookings',
  lawyers: 'tacam_lawyers',
  profiles: 'tacam_profiles',
  session: 'tacam_session'
};

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function seedData() {
  const bookings = loadJson(STORAGE_KEYS.bookings, []);
  if (!bookings.length) {
    saveJson(STORAGE_KEYS.bookings, [
      {
        id: crypto.randomUUID(),
        customer: 'Cliente Demo',
        phone: '+56911111111',
        email: 'cliente.demo@tacam.cl',
        matter: 'Familiar',
        date: new Date().toISOString().slice(0, 10),
        time: '10:30',
        assignedTo: 'Daniela Sierra',
        notes: 'Consulta por materia familiar.',
        status: 'nueva',
        createdAt: new Date().toISOString()
      }
    ]);
  }

  const lawyers = loadJson(STORAGE_KEYS.lawyers, []);
  if (!lawyers.length) {
    saveJson(STORAGE_KEYS.lawyers, [
      {
        id: crypto.randomUUID(),
        name: 'Daniela Sierra',
        specialty: 'Derecho de Familia',
        phone: '+56987591312',
        photo: 'assets/logo-color.svg'
      }
    ]);
  }

  const profiles = loadJson(STORAGE_KEYS.profiles, []);
  if (!profiles.length) {
    saveJson(STORAGE_KEYS.profiles, [
      {
        id: crypto.randomUUID(),
        name: 'Administrador TACAM',
        username: 'admin',
        role: 'Admin',
        permissions: ['Reservas', 'Agenda', 'Abogadas', 'Estadísticas']
      }
    ]);
  }
}

function getBookings() {
  return loadJson(STORAGE_KEYS.bookings, []);
}

function saveBookings(bookings) {
  saveJson(STORAGE_KEYS.bookings, bookings);
}

function getLawyers() {
  return loadJson(STORAGE_KEYS.lawyers, []);
}

function saveLawyers(lawyers) {
  saveJson(STORAGE_KEYS.lawyers, lawyers);
}

function getProfiles() {
  return loadJson(STORAGE_KEYS.profiles, []);
}

function saveProfiles(profiles) {
  saveJson(STORAGE_KEYS.profiles, profiles);
}

function getSession() {
  return loadJson(STORAGE_KEYS.session, { loggedIn: false });
}

function saveSession(session) {
  saveJson(STORAGE_KEYS.session, session);
}

function statusLabel(status) {
  return ({
    nueva: 'Nueva',
    confirmada: 'Confirmada',
    atendida: 'Atendida',
    cancelada: 'Cancelada'
  })[status] || status;
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
}

function cleanPhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function buildTacamMessage(booking) {
  const appointment = `${booking.date || ''} ${booking.time || ''}`.trim();
  const matter = booking.matter || 'General';
  return `Desde TACAM, informamos toda la información de su reserva. Persona: ${booking.customer}. Materia: ${matter}. Fecha/Hora: ${appointment}. Abogado: ${booking.assignedTo || 'Por confirmar'}. Estado: ${statusLabel(booking.status)}.`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

seedData();
