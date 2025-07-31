import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistration } from '@/lib/webauthn';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credential, email } = body;

    const result = await verifyRegistration({
      credential,
      expectedChallenge: credential.response.clientDataJSON,
      email,
    });

    if (result.verified && result.registrationInfo) {
      const { credentialID, credentialPublicKey, counter } = result.registrationInfo;

      await supabase.from('users').upsert({
        email,
        credentialID: Buffer.from(credentialID).toString('base64'),
        credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64'),
        counter,
      });

      return NextResponse.json({ ok: true });
    } else {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
