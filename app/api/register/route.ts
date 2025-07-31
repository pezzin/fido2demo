import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptionsForUser, verifyRegistration } from '@/lib/webauthn';
import { getUserByEmail, createUser } from '@/lib/supabaseClient';

// Mappa temporanea per memorizzare le challenge (in produzione usa Redis o database)
const challenges = new Map<string, string>();

export async function POST(request: NextRequest) {
  try {
    const { email, step, response } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (step === 'begin') {
      // Verifica se l'utente esiste già
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 409 }
        );
      }

      // Genera le opzioni di registrazione
      const options = await generateRegistrationOptionsForUser(
        { id: email, email },
        []
      );

      // Memorizza la challenge
      challenges.set(email, options.challenge);

      return NextResponse.json(options);
    }

    if (step === 'complete') {
      if (!response) {
        return NextResponse.json(
          { error: 'Response is required' },
          { status: 400 }
        );
      }

      // Recupera la challenge memorizzata
      const expectedChallenge = challenges.get(email);
      if (!expectedChallenge) {
        return NextResponse.json(
          { error: 'Challenge not found or expired' },
          { status: 400 }
        );
      }

      // Verifica la risposta di registrazione
      const verification = await verifyRegistration(
        expectedChallenge,
        response
      );

      if (!verification.verified || !verification.registrationInfo) {
        return NextResponse.json(
          { error: 'Registration verification failed' },
          { status: 400 }
        );
      }

      // Salva l'utente nel database
      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
      
      await createUser({
        email,
        credential_id: Buffer.from(credentialID).toString('base64url'),
        public_key: Buffer.from(credentialPublicKey).toString('base64url'),
        counter,
        transports: response.response?.transports,
      });

      // Rimuovi la challenge
      challenges.delete(email);

      return NextResponse.json({
        verified: true,
        message: 'Registration successful'
      });
    }

    return NextResponse.json(
      { error: 'Invalid step' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Pulisci le challenge scadute ogni 5 minuti
setInterval(() => {
  // In una implementazione reale, dovresti tenere traccia dei timestamp
  // e rimuovere solo le challenge scadute
}, 5 * 60 * 1000);
