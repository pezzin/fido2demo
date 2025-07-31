import { 
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type GenerateRegistrationOptionsOpts,
  type GenerateAuthenticationOptionsOpts,
  type VerifyRegistrationResponseOpts,
  type VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';

// Configurazione base per WebAuthn
export const rpName = 'FIDO2 Demo';
export const rpID = process.env.NODE_ENV === 'production' 
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL || '').hostname
  : 'localhost';
export const origin = process.env.NODE_ENV === 'production'
  ? process.env.NEXT_PUBLIC_SITE_URL || ''
  : 'http://localhost:3000';

export interface UserCredential {
  id: string;
  publicKey: Uint8Array;
  counter: number;
  transports?: AuthenticatorTransport[];
}

export interface User {
  id: string;
  email: string;
  credentials: UserCredential[];
}

// Genera opzioni per la registrazione
export async function generateRegistrationOptionsForUser(
  user: { id: string; email: string },
  excludeCredentials: UserCredential[] = []
) {
  const options: GenerateRegistrationOptionsOpts = {
    rpName,
    rpID,
    userID: new TextEncoder().encode(user.id),
    userName: user.email,
    userDisplayName: user.email,
    timeout: 60000,
    attestationType: 'none',
    excludeCredentials: excludeCredentials.map(cred => ({
      id: cred.id,
      type: 'public-key',
      transports: cred.transports,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'cross-platform',
    },
    supportedAlgorithmIDs: [-7, -257], // ES256, RS256
  };

  return await generateRegistrationOptions(options);
}

// Verifica la risposta di registrazione
export async function verifyRegistration(
  expectedChallenge: string,
  response: any,
  expectedOrigin: string = origin,
  expectedRPID: string = rpID
) {
  const opts: VerifyRegistrationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin,
    expectedRPID,
    requireUserVerification: false,
  };

  return await verifyRegistrationResponse(opts);
}

// Genera opzioni per l'autenticazione
export async function generateAuthenticationOptionsForUser(
  allowCredentials: UserCredential[] = []
) {
  const options: GenerateAuthenticationOptionsOpts = {
    timeout: 60000,
    allowCredentials: allowCredentials.map(cred => ({
      id: cred.id,
      type: 'public-key',
      transports: cred.transports,
    })),
    userVerification: 'preferred',
    rpID,
  };

  return await generateAuthenticationOptions(options);
}

// Verifica la risposta di autenticazione
export async function verifyAuthentication(
  expectedChallenge: string,
  response: any,
  credential: UserCredential,
  expectedOrigin: string = origin,
  expectedRPID: string = rpID
) {
  const opts: VerifyAuthenticationResponseOpts = {
    response,
    expectedChallenge,
    expectedOrigin,
    expectedRPID,
    authenticator: {
      credentialID: credential.id,
      credentialPublicKey: credential.publicKey,
      counter: credential.counter,
      transports: credential.transports,
    },
    requireUserVerification: false,
  };

  return await verifyAuthenticationResponse(opts);
}

// Utility per convertire ArrayBuffer in base64URL
export function arrayBufferToBase64URL(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Utility per convertire base64URL in ArrayBuffer
export function base64URLToArrayBuffer(base64URL: string): ArrayBuffer {
  const base64 = base64URL
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const padLength = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLength);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Alias per compatibilità con i file API esistenti
export const getRegistrationOptions = generateRegistrationOptionsForUser;
export const getAuthenticationOptions = generateAuthenticationOptionsForUser;
