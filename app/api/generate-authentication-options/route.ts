import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptionsForUser } from '@/lib/webauthn';
import { getUserByEmail } from '@/lib/supabaseClient';
import challengeStore from '@/lib/challengeStore';

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
        type: 'public-key' as const,
        transports: user.transports ? JSON.parse(user.transports) as AuthenticatorTransport[] : undefined,
      }];
    }

    // Genera le opzioni di autenticazione
    const options = await generateAuthenticationOptionsForUser(allowCredentials);

    // Memorizza la challenge
    const challengeKey = email || 'anonymous';
    challengeStore.store(challengeKey, options.challenge);

    return NextResponse.json(options);

  } catch (error) {
    console.error('Generate authentication options error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
