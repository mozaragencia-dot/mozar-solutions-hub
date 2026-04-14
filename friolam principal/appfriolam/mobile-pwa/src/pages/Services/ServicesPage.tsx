import { useEffect, useState } from 'react';
import { api } from '../../services/api';

type Service = {
  id: number;
  service_name: string;
  status: number;
  scheduled_date: string;
  client?: { name: string };
  subclient?: { local_name: string; address: string };
};

export default function ServicesPage() {
  const [items, setItems] = useState<Service[]>([]);

  useEffect(() => {
    api.get('/technician/services').then(({ data }) => setItems(data));
  }, []);

  return (
    <section>
      <h2>Servicios asignados</h2>
      {items.map(s => (
        <article key={s.id}>
          <h3>{s.service_name}</h3>
          <p>{s.client?.name} · {s.subclient?.local_name}</p>
          <p>{s.subclient?.address}</p>
          <p>Estado: {s.status}</p>
          <a href={`/services/${s.id}`}>Abrir</a>
        </article>
      ))}
    </section>
  );
}
