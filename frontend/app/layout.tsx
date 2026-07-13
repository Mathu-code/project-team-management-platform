import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PTMP - Project & Team Management',
  description: 'Project and Team Task Management Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
