import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: {
    default: 'Sponsia — Every Student Deserves a Chance',
    template: '%s | Sponsia',
  },
  description:
    'Sponsia connects financially struggling students in Pakistan with individuals, donors and organisations who believe that every child deserves access to education.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
