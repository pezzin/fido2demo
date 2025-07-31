import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptionsForUser, verifyAuthentication } from '@/lib/webauthn';
import { getUserByEmail, updateUserCounter } from '@/lib/supabaseClient';

// Mappa temporanea per memorizzare le challenge (in produzione usa Redis o database)
const challenges = new Map<string, string>();

export async function POST(request: NextRequest) {
  try {
    const { email, step, response } = await request.json();

    if (step === 'begin') {
      let allowCredentials: any[] = [];

      if (email) {
        // Login con email specifica
        const user = await getUserByEmail(email);
        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        allowCredentials = [{
          id: user.credential_id,
          type: 'public-key',
          transports: user.transports ? JSON.parse(user.transports) : undefined,
        }];
      }

      // Genera le opzioni di autenticazione
      const options = await generateAuthenticationOptionsForUser(allowCredentials);

      // Memorizza la challenge
      const challengeKey = email || 'anonymous';
      challenges.set(challengeKey, options.challenge);

      return NextResponse.json(options);
    }

    if (step === 'complete') {
      if (!response) {
        return NextResponse.json(
          { error: 'Response is required' },
          { status: 400 }
        );
      }

      // Per il completamento, dobbiamo trovare l'utente tramite la credenziale
      const credentialId = response.id;
      
      // Cerca l'utente nel database tramite credential_id
      const { data: users, error } = await (await import('@/lib/supabaseClient')).supabase
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
      const challengeKey = email || 'anonymous';
      const expectedChallenge = challenges.get(challengeKey);

      if (!expectedChallenge) {
        return NextResponse.json(
          { error: 'Challenge not found or expired' },
          { status: 400 }
        );
      }

      // Prepara la credenziale per la verifica
      const credential = {
        id: user.credential_id,
        publicKey: Buffer.from(user.public_key, 'base64url'),
        counter: user.counter,
        transports: user.transports ? JSON.parse(user.transports) : undefined,
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
      challenges.delete(challengeKey);

      return NextResponse.json({
        verified: true,
        user: {
          email: user.email,
          id: user.email,
        },
        message: 'Authentication successful'
      });
    }

    return NextResponse.json(
      { error: 'Invalid step' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
