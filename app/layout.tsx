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

  // Array de rutas donde NO queremos que aparezca el Navbar
  const rutasSinNavbar = ["/gestion/tareas", "/forgot-password"];
  
  // Comprobamos si la ruta actual está en la lista
  const ocultarNavbar = rutasSinNavbar.includes(pathname);

  return (
    <html lang="es">
      <body className="bg-black text-white">
        {/* Renderizado condicional del Navbar */}
        {!ocultarNavbar && <Navbar />}
        
        {/* Quitamos el pt-20 si el navbar está oculto para evitar el hueco superior */}
        <main className={ocultarNavbar ? "" : "pt-20"}>
          {children}
        </main>
      </body>
    </html>
  )
}