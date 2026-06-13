import type { Metadata } from "next";
import { Inter, DM_Mono } from "next/font/google";
import "./globals.css";
import GSAPProvider from "../components/effects/GSAPProvider";
import { SmoothScroll } from "../components/SmoothScroll";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pixel Quest AI - Ethereal Oracle",
  description: "Asistente de IA para el MMORPG Pixel Quest",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className="dark"
      data-theme="dark"
      style={{ colorScheme: "dark" }}
    >
      <body className={`${inter.variable} ${dmMono.variable}`}>
        <GSAPProvider>
          <SmoothScroll>{children}</SmoothScroll>
        </GSAPProvider>
      </body>
    </html>
  );
}
