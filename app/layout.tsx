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

  // Definimos la ruta donde queremos ocultar el navbar
  // He añadido "/gestion/tareas" que es la que me has mencionado
  const esGestion = pathname === "/gestion/tareas";

  return (
    <html lang="es">
      <body className="bg-black text-white">
        {/* Si NO es gestión, muestra el Navbar */}
        {!esGestion && <Navbar />}
        
        {/* Si es gestión, quitamos el padding superior (pt-20) para que no quede un hueco vacío */}
        <main className={esGestion ? "" : "pt-20"}>
          {children}
        </main>
      </body>
    </html>
  )
}