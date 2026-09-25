import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Company Pickleball — Employee Court Reservation',
  description: 'Corporate employee court reservation platform with real-time slot booking and administrative control.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans bg-slate-50 text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
