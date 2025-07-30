import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';

const rpID = process.env.NEXT_PUBLIC_SITE_URL!.replace(/^https?:\/\//, '');
const expectedOrigin = process.env.NEXT_PUBLIC_SITE_URL!;

export function getRegistrationOptions(email: string) {
  return generateRegistrationOptions({
    rpName: 'FIDO2 Demo',
    rpID,
    userID: email,
    userName: email,
    attestationType: 'none',
    authenticatorSelection: { userVerification: 'preferred' },
  });
}

export function getAuthenticationOptions(credentialIDs: string[]) {
  return generateAuthenticationOptions({
    rpID,
    allowCredentials: credentialIDs.map((id) => ({ id: Buffer.from(id, 'base64'), type: 'public-key' })),
    userVerification: 'preferred',
  });
}

export async function verifyRegistration(body: any) {
  const result = await verifyRegistrationResponse({
    response: body.credential,
    expectedChallenge: body.expectedChallenge,
    expectedOrigin,
    expectedRPID: rpID,
  });
  return result;
}

export async function verifyAuthentication(body: any, expectedChallenge: string) {
  const result = await verifyAuthenticationResponse({
    response: body.assertion,
    expectedChallenge,
    expectedOrigin,
    expectedRPID: rpID,
    authenticator: body.authenticator,
  });
  return result;
}