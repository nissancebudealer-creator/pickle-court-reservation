import type { Metadata } from 'next';
import './globals.css';
import { getUIProperties } from '@/lib/ui-properties';
import { UIPropertiesProvider } from '@/components/UIPropertiesProvider';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const props = await getUIProperties();
  return {
    title: 'Court Reservation Portal',
    description: props.labels.booking_sub || 'Corporate employee court reservation platform.',
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const uiProperties = await getUIProperties();

  return (
    <html lang="en">
      <body className="antialiased font-sans bg-slate-50 text-slate-900 min-h-screen">
        <UIPropertiesProvider initialProperties={uiProperties}>
          {children}
        </UIPropertiesProvider>
      </body>
    </html>
  );
}
