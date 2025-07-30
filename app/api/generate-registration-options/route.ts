import { getRegistrationOptions } from '@/lib/webauthn';

export async function POST(req: Request) {
  const { email } = await req.json();
  const options = getRegistrationOptions(email);
  return Response.json(options);
}