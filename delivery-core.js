const STORAGE_KEYS = {
  bookings: 'friolam_bookings',
  lawyers: 'friolam_lawyers',
  profiles: 'friolam_profiles',
  session: 'friolam_session'
};

const LEGACY_LAWYER_NAMES = new Set(['Daniela Sierra', 'Natalie Gómez', 'Camila Vásquez', 'Carolina Contreras']);
const OFFICIAL_LAWYERS = [
  { name: 'KATHERINE SERRANO MARREY', rut: '16.592.789-3', specialty: 'Penal - policía local', email: 'kserrano@friolam.cl', phone: '', photo: 'assets/logo-color.svg' },
  { name: 'CONSTANZA ROCÍO CLIMENT DEL RÍO', rut: '16.380.148-5', specialty: 'Familia', email: 'ccliment@friolam.cl', phone: '', photo: 'assets/logo-color.svg' },
  { name: 'VALENTINA BELEN REICHERT GODOY', rut: '20.135.049-2', specialty: 'Penal - Policía local', email: 'vreichert@friolam.cl', phone: '', photo: 'assets/logo-color.svg' },
  { name: 'SARA BERNARDA TAPIA GONZÁLEZ', rut: '12.836.725-K', specialty: 'Penal - Policía local - Familia', email: 'stapia@friolam.cl', phone: '', photo: 'assets/logo-color.svg' },
  { name: 'DIANDRA ARACENA MORA', rut: '15.981.484-K', specialty: 'Penal', email: 'daracena@friolam.cl', phone: '', photo: 'assets/logo-color.svg' }
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
        rut: '12.345.678-9',
        phone: '+56911111111',
        email: 'cliente.demo@friolam.cl',
        matter: 'Familiar',
        date: new Date().toISOString().slice(0, 10),
        time: '10:30',
        assignedTo: 'KATHERINE SERRANO MARREY',
        notes: 'Consulta por materia familiar.',
        status: 'nueva',
        createdAt: new Date().toISOString()
      }
    ]);
  }

  syncLawyersData();

  const profiles = loadJson(STORAGE_KEYS.profiles, []);
  if (!profiles.length) {
    saveJson(STORAGE_KEYS.profiles, [
      {
        id: crypto.randomUUID(),
        name: 'Administrador FRIOLAM',
        username: 'admin',
        role: 'Admin',
        permissions: ['Reservas', 'Agenda', 'Abogadas', 'Estadísticas']
      }
    ]);
  }
}

function normalizeLawyerKey(name) {
  return String(name || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function syncLawyersData() {
  const lawyers = loadJson(STORAGE_KEYS.lawyers, []);
  const retainedLawyers = lawyers.filter(lawyer => !LEGACY_LAWYER_NAMES.has(String(lawyer.name || '').trim()));
  const officialKeys = new Set(OFFICIAL_LAWYERS.map(lawyer => normalizeLawyerKey(lawyer.name)));
  const map = new Map();

  retainedLawyers.forEach(lawyer => {
    const key = normalizeLawyerKey(lawyer.name);
    if (!key) return;
    map.set(key, { ...lawyer, id: lawyer.id || crypto.randomUUID(), photo: lawyer.photo || 'assets/logo-color.svg' });
  });

  OFFICIAL_LAWYERS.forEach(lawyer => {
    const key = normalizeLawyerKey(lawyer.name);
    const existing = map.get(key) || {};
    map.set(key, {
      id: existing.id || crypto.randomUUID(),
      name: lawyer.name,
      rut: lawyer.rut,
      specialty: lawyer.specialty,
      email: lawyer.email,
      phone: existing.phone || lawyer.phone || '',
      photo: existing.photo || lawyer.photo || 'assets/logo-color.svg'
    });
  });

  const syncedLawyers = [
    ...OFFICIAL_LAWYERS.map(lawyer => map.get(normalizeLawyerKey(lawyer.name))),
    ...retainedLawyers.filter(lawyer => !officialKeys.has(normalizeLawyerKey(lawyer.name))).map(lawyer => map.get(normalizeLawyerKey(lawyer.name)))
  ].filter(Boolean);

  const currentSerialized = JSON.stringify(lawyers);
  const syncedSerialized = JSON.stringify(syncedLawyers);
  if (currentSerialized !== syncedSerialized) {
    saveJson(STORAGE_KEYS.lawyers, syncedLawyers);
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

function normalizeMatterLabel(value) {
  const clean = String(value || '').trim();
  if (!clean) return '';
  const normalized = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (normalized.includes('cartel') || normalized.includes('carcel')) return 'Visita a la Cárcel';
  return clean;
}

function buildFriolamMessage(booking) {
  const appointment = `${booking.date || ''} ${booking.time || ''}`.trim();
  const matter = normalizeMatterLabel(booking.matter) || 'General';
  return `Desde FRIOLAM, informamos toda la información de su reserva. Persona: ${booking.customer}. Materia: ${matter}. Fecha/Hora: ${appointment}. Abogado: ${booking.assignedTo || 'Por confirmar'}. Estado: ${statusLabel(booking.status)}.`;
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
