import { NextResponse } from 'next/server';
import { verifyRegistration } from '@/lib/webauthn';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  const body = await req.json();
  const { credential, email } = body;

  const result = await verifyRegistration({
    credential,
    expectedChallenge: credential.response.clientDataJSON,
    email,
  });

  if (result.verified && result.registrationInfo) {
    const { credentialPublicKey, counter } = result.registrationInfo;
    const credentialID = result.registrationInfo.credential.credentialID;

    await supabase.from('users').upsert({
      email,
      credentialID: Buffer.from(credentialID).toString('base64'),
      credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64'),
      counter,
    });
  }

  return NextResponse.json(result);
}
