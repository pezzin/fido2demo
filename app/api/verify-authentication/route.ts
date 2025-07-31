import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthentication } from '@/lib/webauthn';
import { updateUserCounter, supabase } from '@/lib/supabaseClient';
import challengeStore from '@/lib/challengeStore';

type AuthenticatorTransport = 'ble' | 'hybrid' | 'internal' | 'nfc' | 'usb';

export async function POST(request: NextRequest) {
  try {
    const { email, response } = await request.json();

    if (!response) {
      return NextResponse.json(
        { error: 'Response is required' },
        { status: 400 }
      );
    }

    // Per il completamento, dobbiamo trovare l'utente tramite la credenziale
    const credentialId = response.id;
    
    // Cerca l'utente nel database tramite credential_id
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('credential_id', credentialId);

    if (error || !users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found for this credential' },
        { status: 404 }
      );
    }

    const user = users[0];
    const challengeKey = email || user.email || 'anonymous';
    const expectedChallenge = challengeStore.get(challengeKey);

    if (!expectedChallenge) {
      return NextResponse.json(
        { error: 'Challenge not found or expired. Please restart authentication.' },
        { status: 400 }
      );
    }

    // Prepara la credenziale per la verifica
    const credential = {
      id: user.credential_id,
      publicKey: Buffer.from(user.public_key, 'base64url'),
      counter: user.counter,
      transports: user.transports ? JSON.parse(user.transports) as AuthenticatorTransport[] : undefined,
    };

    // Verifica la risposta di autenticazione
    const verification = await verifyAuthentication(
      expectedChallenge,
      response,
      credential
    );

    if (!verification.verified || !verification.authenticationInfo) {
      return NextResponse.json(
        { error: 'Authentication verification failed' },
        { status: 400 }
      );
    }

    // Aggiorna il counter dell'autenticatore
    const { newCounter } = verification.authenticationInfo;
    await updateUserCounter(user.email, newCounter);

    // Rimuovi la challenge
    challengeStore.remove(challengeKey);

    return NextResponse.json({
      verified: true,
      user: {
        email: user.email,
        id: user.email,
      },
      message: 'Authentication successful'
    });

  } catch (error) {
    console.error('Verify authentication error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
