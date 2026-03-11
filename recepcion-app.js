const adminBody = document.getElementById('admin-body');
const lawyerForm = document.getElementById('lawyer-form');
const lawyerList = document.getElementById('lawyer-list');
const TACAM_WHATSAPP = '56987591312';

function openWhatsappNotification(order) {
  const destination = cleanPhone(order.phone);
  if (!destination) return;
  const message = encodeURIComponent(buildTacamMessage(order));
  const url = `https://wa.me/${destination}?text=${message}`;
  window.open(url, '_blank', 'noopener');
}

function renderAdminOrders() {
  const orders = getOrders();
  adminBody.innerHTML = orders.length ? orders.map(order => `
    <tr>
      <td>${fmtDate(order.createdAt)}</td>
      <td>${order.customer}</td>
      <td>${order.phone}</td>
      <td>${order.address}</td>
      <td><span class="badge ${order.status}">${statusLabel(order.status)}</span></td>
      <td>
        <input data-assign-input="${order.id}" value="${order.assignedTo || ''}" placeholder="Nombre repartidor" />
        <button data-assign-btn="${order.id}">Guardar</button>
      </td>
      <td>
        <button data-notify-btn="${order.id}">Notificar</button>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="7">Sin pedidos</td></tr>';

  adminBody.querySelectorAll('[data-assign-btn]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.assignBtn;
      const input = adminBody.querySelector(`[data-assign-input="${id}"]`);
      const ordersData = getOrders();
      const order = ordersData.find(item => item.id === id);
      if (!order) return;
      order.assignedTo = input.value.trim();
      order.status = order.assignedTo ? 'asignado' : 'nuevo';
      saveOrders(ordersData);
      renderAdminOrders();
    };
  });

  adminBody.querySelectorAll('[data-notify-btn]').forEach(btn => {
    btn.onclick = () => {
      const order = getOrders().find(item => item.id === btn.dataset.notifyBtn);
      if (!order) return;
      openWhatsappNotification(order);
    };
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
        <small>${lawyer.phone || 'Sin WhatsApp'} · Notifica vía TACAM ${TACAM_WHATSAPP}</small>
      </div>
    </article>
  `).join('') : '<p>No hay abogados cargados.</p>';
}

lawyerForm.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(lawyerForm);
  const photoFile = data.get('photo');
  if (!(photoFile instanceof File) || !photoFile.size) return;

  const lawyers = getLawyers();
  const photoData = await fileToDataUrl(photoFile);
  lawyers.unshift({
    id: crypto.randomUUID(),
    name: String(data.get('name') || '').trim(),
    specialty: String(data.get('specialty') || '').trim(),
    phone: String(data.get('phone') || '').trim(),
    photo: photoData
  });
  saveLawyers(lawyers);
  lawyerForm.reset();
  renderLawyers();
});

renderAdminOrders();
renderLawyers();
setInterval(renderAdminOrders, 4000);
