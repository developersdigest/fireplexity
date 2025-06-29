import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'sonner'
import { SessionProvider } from "./providers"

export const metadata: Metadata = {
  title: "Fireplexity - AI-Powered Search",
  description: "Advanced search with AI-powered insights and real-time stock information",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SessionProvider>
          {children}
        </SessionProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
