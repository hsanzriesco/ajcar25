"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function JefePanel() {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("user_role") !== "Jefe") router.push("/");
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <div className="flex justify-between items-center border-b border-red-600 pb-4">
        <h1 className="text-4xl font-extrabold">CONTROL TOTAL <span className="text-red-600">AJCAR25</span></h1>
        <span className="bg-red-600 px-3 py-1 rounded-full text-xs font-bold">MODO JEFE</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        {/* Acciones de Empleado (también disponibles para el jefe) */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
          <h2 className="font-bold text-lg mb-4">Operaciones</h2>
          <ul className="space-y-2 text-gray-400">
            <li>• Ver Facturación Total</li>
            <li>• Listado de Empleados</li>
          </ul>
        </div>

        {/* Acciones exclusivas de Edición de la Web */}
        <div className="p-6 bg-red-600/10 border border-red-600/50 rounded-xl">
          <h2 className="font-bold text-lg mb-4 text-red-500">Edición Web</h2>
          <button className="w-full py-2 bg-red-600 text-white rounded font-bold mb-2">Editar Servicios</button>
          <button className="w-full py-2 bg-white text-black rounded font-bold">Cambiar Galería Trabajos</button>
        </div>

        {/* Base de Datos */}
        <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
          <h2 className="font-bold text-lg mb-4">Administración</h2>
          <button className="text-sm text-gray-400 hover:text-white underline">Descargar Backup SQL</button>
        </div>
      </div>
    </div>
  );
}