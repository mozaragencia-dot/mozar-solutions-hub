import { useState } from 'react';
import { api, setAuthToken } from '../../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onLogin = async () => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setAuthToken(data.token);
    window.location.href = '/';
  };

  return (
    <main>
      <h1>FRIOLAM Técnico</h1>
      <input placeholder="Correo" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={onLogin}>Ingresar</button>
    </main>
  );
}
