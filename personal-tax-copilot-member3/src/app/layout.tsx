import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaxCopilot AI � Personal Tax Guidance for Indian Taxpayers",
  description:
    "AI-Powered Personal Tax Guidance & Planning Platform for Indian Taxpayers. Immutable Tax Twin, deterministic calculation audits, and Gemini AI assistance for FY 2025-26 / AY 2026-27.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full font-sans antialiased bg-slate-50 text-slate-900 selection:bg-teal-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
