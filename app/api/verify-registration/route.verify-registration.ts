import { supabase } from '@/lib/supabaseClient';
import { verifyRegistration } from '@/lib/webauthn';

export async function POST(req: Request) {
  const { email, credential } = await req.json();
  const result = await verifyRegistration({ credential, expectedChallenge: credential.response.clientDataJSON, email });

  if (result.verified && result.registrationInfo) {
    const { credentialID, credentialPublicKey, counter } = result.registrationInfo;

    await supabase.from('users').upsert({
      email,
      credentialID: Buffer.from(credentialID).toString('base64'),
      publicKey: Buffer.from(credentialPublicKey).toString('base64'),
      counter,
    });
  }

  return Response.json({ verified: result.verified });
}
