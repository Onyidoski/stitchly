// app/layout.tsx

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { IosInstallPrompt } from "@/components/ios-install-prompt";
import { ThemeProvider } from "@/components/theme-provider"; // [!code ++]
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
  title: "Stitchly",
  description: "Fashion Design Management App",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Stitchly",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // [!code ++] Add suppressHydrationWarning
    <html lang="en" suppressHydrationWarning> 
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* [!code ++] Wrap children with ThemeProvider */}
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            {children}
            <IosInstallPrompt />
            <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}