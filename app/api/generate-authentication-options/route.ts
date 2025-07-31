import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptionsForUser } from '@/lib/webauthn';
import { getUserByEmail } from '@/lib/supabaseClient';

// Mappa temporanea per memorizzare le challenge
const challenges = new Map<string, string>();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

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

  } catch (error) {
    console.error('Generate authentication options error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Funzione per recuperare la challenge (usata da altre API)
export function getStoredChallenge(key: string): string | undefined {
  return challenges.get(key);
}

// Funzione per rimuovere la challenge (usata da altre API)
export function removeStoredChallenge(key: string): void {
  challenges.delete(key);
}
