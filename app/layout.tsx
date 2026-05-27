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

  // Rutas donde el Navbar no debe mostrarse (paneles internos y flujos de autenticación)
  const rutasSinNavbar = [
    "/gestion/tareas",
    "/forgot-password",
    "/reset-password",
    "/cliente",
    "/jefe",
  ];

  const ocultarNavbar = rutasSinNavbar.includes(pathname);

  return (
    <html lang="es">
      <body className="bg-black text-white">
        {!ocultarNavbar && <Navbar />}

        {/* El padding superior compensa la altura fija del Navbar cuando este es visible */}
        <main className={ocultarNavbar ? "" : "pt-20"}>
          {children}
        </main>
      </body>
    </html>
  )
}
