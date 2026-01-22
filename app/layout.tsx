import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NextAuthProvider } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/sonner";
import { TelegramPrompt } from "@/components/notifications/telegram-prompt";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MyMoney - Smart Personal Finance Tracker",
  description: "Track your income, expenses, and financial goals with ease. Built for smart financial management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <NextAuthProvider>
          {children}
          <Toaster />
          <TelegramPrompt />
        </NextAuthProvider>
      </body>
    </html>
  );
}
