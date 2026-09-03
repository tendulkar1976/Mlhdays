export const metadata = {
  title: 'AI Personal Tax Copilot',
  description: 'Authoritative Indian Tax Copilot for FY 2025-26 / AY 2026-27',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#0b1120', color: '#f8fafc' }}>
        {children}
      </body>
    </html>
  );
}
