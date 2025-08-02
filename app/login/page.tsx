'use client';
import { startAuthentication } from '@simplewebauthn/browser';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');

  async function handleLogin() {
    try {
      const res = await fetch('/api/generate-authentication-options', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const errText = await res.text();
        alert(`Errore nella generazione delle opzioni: ${errText}`);
        return;
      }
      const options = await res.json();
      if (!options?.challenge) {
        alert('Opzioni di autenticazione non valide.');
        return;
      }
      const assertion = await startAuthentication(options);

      const verify = await fetch('/api/verify-authentication', {
        method: 'POST',
        body: JSON.stringify({ response: assertion, email }),
      });

      const verificationJSON = await verify.json();

      if (verificationJSON.verified) {
        alert('Login completato!');
      } else {
        alert('Errore di autenticazione.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore sconosciuto';
      alert(`Autenticazione fallita: ${message}`);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="border p-2 rounded mb-4"
      />
      <button onClick={handleLogin} className="bg-black text-white px-4 py-2 rounded-xl">
        Login con FIDO2
      </button>
    </main>
  );
}
