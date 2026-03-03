const form = document.getElementById('order-form');
const body = document.getElementById('orders-body');
const filterPhone = document.getElementById('filter-phone');

function renderUserOrders() {
  const phone = filterPhone.value.trim();
  const orders = getOrders().filter(order => !phone || order.phone.includes(phone));
  body.innerHTML = orders.length ? orders.map(order => `
    <tr>
      <td>${order.id.slice(0, 8)}</td>
      <td>${order.address}</td>
      <td><span class="badge ${order.status}">${statusLabel(order.status)}</span></td>
      <td>${order.assignedTo || '-'}</td>
    </tr>
  `).join('') : '<tr><td colspan="4">Sin pedidos</td></tr>';
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const orders = getOrders();
  orders.unshift({
    id: crypto.randomUUID(),
    customer: data.get('customer').trim(),
    phone: data.get('phone').trim(),
    address: data.get('address').trim(),
    notes: data.get('notes').trim(),
    assignedTo: '',
    status: 'nuevo',
    createdAt: new Date().toISOString()
  });
  saveOrders(orders);
  form.reset();
  renderUserOrders();
});

filterPhone.addEventListener('input', renderUserOrders);
renderUserOrders();
