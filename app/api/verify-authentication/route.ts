import { supabase } from '@/lib/supabaseClient';
import { verifyAuthentication } from '@/lib/webauthn';

export async function POST(req: Request) {
  const { email, assertion } = await req.json();
  const { data } = await supabase.from('users').select('*').eq('email', email).single();
  if (!data) return Response.json({ verified: false });

  const authenticator = {
    credentialID: Buffer.from(data.credentialID, 'base64'),
    credentialPublicKey: Buffer.from(data.publicKey, 'base64'),
    counter: data.counter,
  };

  const result = await verifyAuthentication({ assertion, authenticator, expectedChallenge: assertion.response.clientDataJSON });

  if (result.verified) {
    await supabase.from('users').update({ counter: result.authenticationInfo!.newCounter }).eq('email', email);
  }

  return Response.json({ verified: result.verified });
}