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
  title: "BuzzCryp — Trade Smarter. Grow Faster.",
  description:
    "BuzzCryp — Secure crypto trading platform. Trade smarter, grow faster. Role-based access, multi-tenant isolation, full audit trails.",
  keywords: ["BuzzCryp", "crypto", "trading", "exchange", "wallet", "secure", "RBAC"],
  authors: [{ name: "BuzzCryp" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
        <SonnerToaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#0c1530",
              border: "1px solid rgba(212,175,55,0.25)",
              color: "#f1f5f9",
            },
          }}
        />
      </body>
    </html>
  );
}
