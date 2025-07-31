import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthentication } from '../../../lib/fido';
import { supabase } from '../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assertion, authenticator, email } = body;

    const result = await verifyAuthentication(
      { assertion, authenticator },
      assertion.response.clientDataJSON,
    );

    if (result.verified && result.authenticationInfo) {
      await supabase.from('users')
        .update({ counter: result.authenticationInfo.newCounter })
        .eq('email', email);

      return NextResponse.json({ ok: true });
    } else {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
