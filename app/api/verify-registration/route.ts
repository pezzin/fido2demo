import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistration } from '@/lib/webauthn';
import { createUser } from '@/lib/supabaseClient';
import challengeStore from '@/lib/challengeStore';

export async function POST(request: NextRequest) {
  try {
    const { email, response } = await request.json();

    if (!email || !response) {
      return NextResponse.json(
        { error: 'Email and response are required' },
        { status: 400 }
      );
    }

    // Recupera la challenge memorizzata
    const expectedChallenge = challengeStore.get(email);
    if (!expectedChallenge) {
      return NextResponse.json(
        { error: 'Challenge not found or expired. Please restart registration.' },
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
    challengeStore.remove(email);

    return NextResponse.json({
      verified: true,
      message: 'Registration successful'
    });

  } catch (error) {
    console.error('Verify registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
