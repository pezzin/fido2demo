'use client';
import { startRegistration } from '@simplewebauthn/browser';
import { useState } from 'react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');

  async function handleRegister() {
    const res = await fetch('/api/generate-registration-options', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    const options = await res.json();

    const credential = await startRegistration(options);

    const verify = await fetch('/api/verify-registration', {
      method: 'POST',
      body: JSON.stringify({ response: credential, email }),
    });

    if ((await verify.json()).verified) {
      alert('Registrazione completata!');
    } else {
      alert('Errore nella registrazione.');
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h2 className="text-2xl font-bold mb-4">Registrati</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="border p-2 rounded mb-4"
      />
      <button onClick={handleRegister} className="bg-teal-600 text-white px-4 py-2 rounded-xl">
        Registrati con FIDO2
      </button>
    </main>
  );
}