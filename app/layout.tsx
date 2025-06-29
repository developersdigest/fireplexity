"use client"

import "./globals.css";
import { Toaster } from 'sonner'
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <ConvexProvider client={convex}>
          {children}
        </ConvexProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
