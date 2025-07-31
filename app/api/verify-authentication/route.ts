import { NextResponse } from 'next/server';
import { verifyAuthentication } from '@/lib/webauthn';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  const body = await req.json();
  const { credential, email } = body;

  // Recupera l'utente da Supabase
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    return NextResponse.json({ verified: false, error: 'Utente non trovato' }, { status: 404 });
  }

  const result = await verifyAuthentication({
    credential,
    expectedChallenge: credential.response.clientDataJSON,
    expectedCredentialID: Buffer.from(user.credentialID, 'base64'),
    expectedCredentialPublicKey: Buffer.from(user.credentialPublicKey, 'base64'),
    expectedCounter: user.counter,
    email,
  });

  if (result.verified && result.authenticationInfo) {
    const { newCounter } = result.authenticationInfo;

    await supabase.from('users').update({ counter: newCounter }).eq('email', email);
  }

  return NextResponse.json(result);
}
