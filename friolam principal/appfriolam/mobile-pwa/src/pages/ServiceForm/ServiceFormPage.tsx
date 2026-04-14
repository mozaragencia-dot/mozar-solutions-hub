import { useState } from 'react';
import { api } from '../../services/api';

export default function ServiceFormPage({ serviceId }: { serviceId: number }) {
  const [clientPhone, setClientPhone] = useState('');
  const [fantasyName, setFantasyName] = useState('');
  const [postmixData, setPostmixData] = useState({
    carbonator_review: false,
    pump_review: false,
    board_review: false,
    water_pressure: '',
    co2_pressure: '',
    temperature: '',
    final_status: '',
    observations: '',
    spare_parts: '',
    requires_new_visit: false,
  });

  const save = async () => {
    await api.put(`/technician/services/${serviceId}/form`, {
      client_phone: clientPhone,
      fantasy_name: fantasyName,
      postmix_data: postmixData,
    });
  };

  const markInProgress = async () => {
    await api.post('/technician/services/change-status', { id_service: serviceId, status: 2 });
  };

  return (
    <div>
      <h2>Formulario técnico</h2>
      <input placeholder="Teléfono cliente" value={clientPhone} onChange={e => setClientPhone(e.target.value)} />
      <input placeholder="Nombre fantasía" value={fantasyName} onChange={e => setFantasyName(e.target.value)} />
      <textarea placeholder="Observaciones postmix" value={postmixData.observations} onChange={e => setPostmixData({ ...postmixData, observations: e.target.value })} />
      <button onClick={save}>Guardar</button>
      <button onClick={markInProgress}>Pasar a En proceso</button>
    </div>
  );
}
