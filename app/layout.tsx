"use client";

import "./globals.css"
import Navbar from "@/components/navbar"
import { usePathname } from "next/navigation"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();

  // Lista de rutas sin Navbar
  const rutasSinNavbar = [
    "/gestion/tareas", 
    "/forgot-password", 
    "/reset-password"
  ];
  
  const ocultarNavbar = rutasSinNavbar.includes(pathname);

  return (
    <html lang="es">
      <body className="bg-black text-white">
        {!ocultarNavbar && <Navbar />}
        
        {/* El padding top (pt-20) solo se aplica si el Navbar es visible */}
        <main className={ocultarNavbar ? "" : "pt-20"}>
          {children}
        </main>
      </body>
    </html>
  )
}