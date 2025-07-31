import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { supabase } from '@/lib/supabaseClient';
import { isobase64url } from '@simplewebauthn/server/helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credential, email } = body;

    // Recupera l'utente da Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const expectedChallenge = user.currentChallenge;

    const result = await verifyAuthenticationResponse(credential, {
      expectedChallenge,
      expectedOrigin: process.env.ORIGIN || 'https://fido2demo.vercel.app',
      expectedRPID: process.env.RPID || 'fido2demo.vercel.app',
      expectedCredentialID: Buffer.from(user.credentialID, 'base64'),
      expectedCredentialPublicKey: Buffer.from(user.credentialPublicKey, 'base64'),
      expectedCounter: user.counter,
    });

    if (result.verified && result.authenticationInfo) {
      const { newCounter } = result.authenticationInfo;

      // Aggiorna il counter nel DB
      await supabase
        .from('users')
        .update({ counter: newCounter })
        .eq('email', email);

      return NextResponse.json({ verified: true });
    }

    return NextResponse.json({ verified: false });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
