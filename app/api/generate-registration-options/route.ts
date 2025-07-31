import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptionsForUser } from '@/lib/webauthn';
import { getUserByEmail } from '@/lib/supabaseClient';
import challengeStore from '@/lib/challengeStore';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

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
    challengeStore.store(email, options.challenge);

    return NextResponse.json(options);

  } catch (error) {
    console.error('Generate registration options error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
