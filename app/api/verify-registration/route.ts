import { supabase } from '@/lib/supabaseClient';
import { verifyRegistration } from '@/lib/webauthn';

export async function POST(req: Request) {
  const { email, credential } = await req.json();
  const result = await verifyRegistration({ credential, expectedChallenge: credential.response.clientDataJSON, email });
  if (result.verified) {
    const { credentialID, counter, credentialPublicKey } = result.registrationInfo!;
    await supabase.from('users').upsert({
      email,
      credentialID: Buffer.from(credentialID).toString('base64'),
      publicKey: Buffer.from(credentialPublicKey).toString('base64'),
      counter,
    });
  }
  return Response.json({ verified: result.verified });
}