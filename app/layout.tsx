// File: app/layout.tsx
export const metadata = {
  title: 'FIDO2 Demo',
  description: 'Login sicuro con WebAuthn + Supabase',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
