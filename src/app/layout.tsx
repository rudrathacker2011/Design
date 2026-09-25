import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'YatraSetu — Travel with a clearer next step',
  description: 'Reality-aware travel planning with clear choices and practical support.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
