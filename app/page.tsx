export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">FIDO2 Passwordless Demo</h1>
      <p className="text-lg text-center max-w-xl mb-6">
        Questo progetto dimostra l'autenticazione passwordless con FIDO2/WebAuthn,
        integrata con Supabase e deployata su Vercel.
      </p>
      <div className="flex gap-4">
        <a href="/register" className="px-4 py-2 bg-black text-white rounded-xl">Registrati</a>
        <a href="/login" className="px-4 py-2 bg-gray-300 rounded-xl">Accedi</a>
      </div>
      <footer className="mt-16 text-sm text-gray-500">
        made by <a href="https://www.pezzin.com" target="_blank" className="underline">@pezzin</a>
      </footer>
    </main>
  );
}