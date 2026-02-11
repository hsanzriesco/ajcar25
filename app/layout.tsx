import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "AJCAR 25 | Taller de Chapa y Pintura",
  description:
    "Taller especializado en chapa y pintura. Más de 20 años ofreciendo reparaciones de calidad, precisión y confianza.",
  keywords: ["taller chapa y pintura", "reparación coches", "AJCAR 25"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutral-900 text-white`}
      >
        {children}
      </body>
    </html>
  );
}