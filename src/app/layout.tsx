import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GO An Nahl — Data Santri & SPP Rumah Tahfidz An Nahl",
  description:
    "Sistem manajemen data santri dan SPP Rumah Tahfidz An Nahl. Bersama Al-Qur'an membangun generasi Qur'ani.",
  keywords: [
    "An Nahl",
    "Rumah Tahfidz",
    "Santri",
    "SPP",
    "Tahfidz Qur'an",
    "Manajemen Pesantren",
  ],
  authors: [{ name: "Rumah Tahfidz An Nahl" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "GO An Nahl",
    description: "Data Santri & SPP Rumah Tahfidz An Nahl",
    siteName: "GO An Nahl",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster richColors position="top-right" />
      </body>
    </html>
  );
}
