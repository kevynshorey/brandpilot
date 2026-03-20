import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'BrandPilot — AI-Powered Social Media Management',
    template: '%s | BrandPilot',
  },
  description:
    'Create, schedule, and publish social media content across all platforms with AI. Manage multiple brands from one dashboard.',
  metadataBase: new URL('https://brandpilots.io'),
  openGraph: {
    title: 'BrandPilot — AI-Powered Social Media Management',
    description:
      'Create, schedule, and publish social media content with AI. Manage multiple brands from one dashboard.',
    url: 'https://brandpilots.io',
    siteName: 'BrandPilot',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BrandPilot — AI-Powered Social Media Management',
    description:
      'Create, schedule, and publish social media content with AI. Manage multiple brands from one dashboard.',
  },
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
