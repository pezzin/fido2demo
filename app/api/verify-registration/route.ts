import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistration } from '@/lib/fido';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, credential } = body;

  try {
    const result = await verifyRegistration(body);

    if (result.verified && result.registrationInfo) {
      const { credential } = result.registrationInfo!;
      const { credentialID, credentialPublicKey, counter } = credential;

      await supabase.from('users').upsert({
        email,
        credentialID: Buffer.from(credentialID).toString('base64'),
        credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64'),
        counter,
      });
    }

    return NextResponse.json({ verified: result.verified });
  } catch (error) {
    console.error('Registration verification failed:', error);
    return NextResponse.json({ error: 'Registration verification failed' }, { status: 400 });
  }
}
