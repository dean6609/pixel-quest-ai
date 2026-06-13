import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import GSAPProvider from "../components/effects/GSAPProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pixel Quest AI - Ethereal Oracle",
  description: "Asistente de IA para el MMORPG Pixel Quest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" data-theme="dark" style={{ colorScheme: "dark" }}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap"
          rel="stylesheet"
        />
        {/* Font CSS vars are defined in globals.css :root */}
      </head>
      <body
        className={`${inter.variable} ${geistMono.variable}`}
      >
        <GSAPProvider>
          {children}
        </GSAPProvider>
      </body>
    </html>
  );
}
