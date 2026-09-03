export const metadata = {
  title: 'AI Tax Copilot Backend',
  description: 'Deterministic Tax Engine & Backend APIs for Indian Taxpayers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', background: '#0f172a', color: '#f8fafc' }}>
        {children}
      </body>
    </html>
  );
}
