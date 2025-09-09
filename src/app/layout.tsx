import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';
import ClientHeader from '@/components/layout/ClientHeader';
import Footer from '@/components/layout/Footer';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CubicJ Cafe',
  description: '미니 서버에서 운영하는 개인 웹 서비스 허브 및 AI 이미지 생성 시스템',
  icons: {
    icon: '/icon',
    apple: '/apple-icon',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CubicJ Cafe',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${inter.variable} ${sora.variable} antialiased`}
      >
        <div className="min-h-screen flex flex-col">
          <ClientHeader />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
