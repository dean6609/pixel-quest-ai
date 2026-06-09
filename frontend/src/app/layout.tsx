import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import localFont from 'next/font/local';
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bricolage = Bricolage_Grotesque({ 
  subsets: ["latin"],
  variable: "--font-bricolage"
});

// Since Geist might not be perfectly supported by next/font/google depending on Next.js version,
// we'll load it via Google Fonts in the Head just to be safe, or we can try using it via CSS.
// The easiest is just using a class with Inter for body, but let's stick to the generated html approach.

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
    <html lang="es" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <style>{`
          :root {
            --font-geist: 'Geist', sans-serif;
          }
          .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          }
        `}</style>
      </head>
      <body className={`${inter.variable} ${bricolage.variable} font-body-md`}>
        {/* Particles Background */}
        <div className="particles-bg">
          <svg className="w-full h-full opacity-30" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="glow">
                <feGaussianBlur result="coloredBlur" stdDeviation="2.5"></feGaussianBlur>
                <feMerge>
                  <feMergeNode in="coloredBlur"></feMergeNode>
                  <feMergeNode in="SourceGraphic"></feMergeNode>
                </feMerge>
              </filter>
            </defs>
            <circle cx="100" cy="100" fill="#4edea3" r="1">
              <animate attributeName="opacity" dur="4s" repeatCount="indefinite" values="0;1;0"></animate>
              <animate attributeName="cy" dur="4s" repeatCount="indefinite" values="100;120;100"></animate>
            </circle>
            <circle cx="800" cy="300" fill="#c0c1ff" r="1.5">
              <animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0.8;0"></animate>
              <animate attributeName="cx" dur="6s" repeatCount="indefinite" values="800;820;800"></animate>
            </circle>
            <circle cx="400" cy="700" fill="#ffb95f" r="1">
              <animate attributeName="opacity" dur="5s" repeatCount="indefinite" values="0;1;0"></animate>
            </circle>
          </svg>
        </div>
        {children}
      </body>
    </html>
  );
}
