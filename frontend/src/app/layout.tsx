import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/components/ui/Toast";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://creditxora.com"),
  title: {
    default: "Creditxora — Understand Your Credit. Take Control of Your Financial Future.",
    template: "%s | Creditxora",
  },
  description:
    "Creditxora helps U.S. consumers identify potential inaccuracies and questionable " +
    "information on their credit reports, and provides guidance on taking appropriate " +
    "steps to improve their credit profile.",
  keywords: [
    "credit report review",
    "credit repair support",
    "credit dispute assistance",
    "credit building guidance",
    "collections review",
    "charge-off review",
  ],
  openGraph: {
    title: "Creditxora — Building Stronger Credit. Creating Better Opportunities.",
    description:
      "Professional credit report review, dispute support and credit-building guidance " +
      "for U.S. consumers.",
    url: "https://creditxora.com",
    siteName: "Creditxora",
    type: "website",
    locale: "en_US",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#112445",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
