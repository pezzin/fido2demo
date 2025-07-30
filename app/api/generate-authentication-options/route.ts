import { supabase } from '@/lib/supabaseClient';
import { getAuthenticationOptions } from '@/lib/webauthn';

export async function POST(req: Request) {
  const { email } = await req.json();
  const { data } = await supabase.from('users').select('credentialID').eq('email', email).single();
  if (!data) return Response.json({}, { status: 404 });
  const options = getAuthenticationOptions([data.credentialID]);
  return Response.json(options);
}