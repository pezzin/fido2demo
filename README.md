# 🔐 FIDO2 Passwordless Login Demo

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/pezzin/fido2demo)
![GitHub last commit](https://img.shields.io/github/last-commit/pezzin/fido2demo?style=flat-square)

Demo completo per l'autenticazione passwordless tramite **FIDO2/WebAuthn**, integrata con:
- 🧠 Supabase per la gestione utenti e credenziali
- 🚀 Deploy su Vercel
- 🧪 Supporto per registrazione e login con token hardware, biometria, ecc.

## ✅ Funzionalità

- Registrazione e login **senza password**
- Supporta autenticazione tramite token FIDO2, Windows Hello, Face ID, ecc.
- API sicure su Next.js (`app/api/...`)
- Architettura **serverless** e facilmente scalabile

## 🗂️ Struttura

```
├── app/
│   ├── api/                             # Route API per WebAuthn
│   ├── login/                           # Pagina login
│   └── register/                        # Pagina registrazione
├── lib/
│   ├── supabaseClient.ts               # Connessione Supabase
│   └── webauthn.ts                     # Funzioni WebAuthn
├── public/
│   └── logo.svg                        # Logo personalizzato
├── README.md
├── .env.local                          # Variabili ambiente
└── .env.example                        # Esempio configurazione
```

## 🔧 Variabili ambiente richieste

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_SITE_URL=https://<your-site>.vercel.app
```

Copiate il file `.env.example` in `.env.local` e sostituite i valori con le
credenziali del vostro progetto Supabase e l'URL del sito.

## 🧱 Supabase Schema SQL

```sql
create table users (
  email text primary key,
  credentialID text not null,
  publicKey text not null,
  counter integer default 0
);
```

## 🧪 Test locali

1. Installa le dipendenze:
```bash
npm install
```

2. Avvia il progetto:
```bash
npm run dev
```

3. Vai su `http://localhost:3000`

---

## ✍️ Autore

Made by [@pezzin](https://www.pezzin.com) – 2025
