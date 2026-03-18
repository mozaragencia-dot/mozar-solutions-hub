const form = document.querySelector('#vote-form');
const rutInput = document.querySelector('#rut');
const statusText = document.querySelector('#status');
const percentYes = document.querySelector('#percent-yes');
const percentNo = document.querySelector('#percent-no');
const root = document.documentElement;

const state = {
  realYes: 50,
  displayYes: 50,
  lastVote: null,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

rutInput.addEventListener('input', () => {
  const cleaned = rutInput.value.replace(/[^0-9kK]/g, '');
  if (cleaned.length <= 1) return;
  const body = cleaned.slice(0, -1);
  const verifier = cleaned.slice(-1);
  const grouped = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  rutInput.value = `${grouped}-${verifier}`;
});

const render = () => {
  const yes = state.displayYes;
  const no = 100 - yes;
  percentYes.textContent = `${yes.toFixed(0)}%`;
  percentNo.textContent = `${no.toFixed(0)}%`;

  const yesStrength = clamp(yes / 100, 0.18, 0.82);
  const noStrength = clamp(no / 100, 0.18, 0.82);
  root.style.setProperty('--yes-strength', yesStrength.toFixed(2));
  root.style.setProperty('--no-strength', noStrength.toFixed(2));
};

const smoothBalance = () => {
  const target = 50 + (state.realYes - 50) * 0.35;
  state.displayYes += (target - state.displayYes) * 0.12;
  if (Math.abs(target - state.displayYes) < 0.05) {
    state.displayYes = target;
  }
  render();
  requestAnimationFrame(smoothBalance);
};

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const submitter = event.submitter;
  const vote = submitter?.value;
  const rut = rutInput.value.trim();

  if (!vote || !rut) {
    statusText.textContent = 'Ingresa un RUT antes de votar.';
    return;
  }

  const shift = vote === 'yes' ? 2.4 : -2.4;
  state.realYes = clamp(state.realYes + shift, 35, 65);
  state.lastVote = vote;

  statusText.textContent =
    vote === 'yes'
      ? 'Voto “Sí” recibido. El RUT se limpió inmediatamente de la pantalla.'
      : 'Voto “No” recibido. El RUT se limpió inmediatamente de la pantalla.';

  form.reset();
  rutInput.value = '';
});

render();
smoothBalance();
