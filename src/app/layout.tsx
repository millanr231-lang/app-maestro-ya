import type { Metadata } from 'next';
import { Toaster } from '../components/ui/toaster';
import './globals.css';
import { FirebaseClientProvider } from '../firebase/client-provider';
import { ThemeProvider } from '../components/theme-provider';
import { Inter } from 'next/font/google';
import { cn } from '../lib/utils';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'MaestroYa | Servicios y Reparaciones del Hogar en Quito',
  description: 'Encuentra maestros a domicilio en Quito para plomería, electricidad, albañilería y más. En MaestroYa te conectamos con técnicos verificados para reparaciones del hogar de forma rápida y garantizada.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={cn('min-h-screen bg-background font-sans antialiased', fontSans.variable)}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <FirebaseClientProvider>
              {children}
            </FirebaseClientProvider>
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
