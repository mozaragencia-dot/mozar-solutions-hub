const STORAGE_KEYS = {
  bookings: 'tacam_bookings',
  lawyers: 'tacam_lawyers',
  session: 'tacam_session'
};

const DEFAULT_LAWYERS = [
  {
    name: 'Daniela Sierra',
    specialty: 'Derecho de Familia',
    phone: '+56987591312',
    photo: 'assets/logo-color.svg'
  },
  {
    name: 'Natalie Gómez',
    specialty: 'Derecho Penal',
    phone: '+56987591313',
    photo: 'assets/logo-color.svg'
  },
  {
    name: 'Camila Vásquez',
    specialty: 'Derecho Civil',
    phone: '+56987591314',
    photo: 'assets/logo-color.svg'
  },
  {
    name: 'Carolina Contreras',
    specialty: 'Derecho Laboral',
    phone: '+56987591315',
    photo: 'assets/logo-color.svg'
  }
];

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
    saveJson(STORAGE_KEYS.lawyers, DEFAULT_LAWYERS.map(lawyer => ({
      id: crypto.randomUUID(),
      ...lawyer
    })));
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

function getSession() {
  return loadJson(STORAGE_KEYS.session, { loggedIn: false });
}

function saveSession(session) {
  saveJson(STORAGE_KEYS.session, session);
}

function ensureDefaultLawyers() {
  const current = loadJson(STORAGE_KEYS.lawyers, []);
  const byName = new Map(current.map(lawyer => [String(lawyer.name || '').trim().toLowerCase(), lawyer]));
  const normalized = DEFAULT_LAWYERS.map(lawyer => {
    const existing = byName.get(lawyer.name.trim().toLowerCase());
    return {
      id: existing?.id || crypto.randomUUID(),
      ...lawyer,
      photo: existing?.photo || lawyer.photo
    };
  });

  saveJson(STORAGE_KEYS.lawyers, normalized);
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
