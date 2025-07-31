import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, credential } = body;

    if (!email || !credential) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from('fido_users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const expectedChallenge = user.currentChallenge;

    const result = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: process.env.ORIGIN || 'https://fido2demo.vercel.app',
      expectedRPID: process.env.RPID || 'fido2demo.vercel.app',
      expectedCredentialID: isoBase64URL.toBuffer(user.credentialID),
      expectedCredentialPublicKey: Buffer.from(user.credentialPublicKey, 'base64'),
      expectedCounter: user.counter,
    });

    if (!result.verified) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    // Update counter if needed
    await supabase
      .from('fido_users')
      .update({ counter: result.authenticationInfo.newCounter })
      .eq('email', email);

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
