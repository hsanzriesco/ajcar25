"use client"

import Image from "next/image"
import Link from "next/link"
import RegisterForm from "@/components/RegisterForm"

export default function RegistroPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-ajcar text-white px-4 sm:px-6 py-12 sm:py-16">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

        {/* Logo lateral — solo desktop */}
        <div className="hidden lg:flex flex-col items-center justify-center text-center space-y-6">
          <Image
            src="/imagenes/prueba_logo_1.png"
            alt="Logo AJCAR25"
            width={260}
            height={260}
            className="opacity-90"
          />
          <div>
            <p className="text-white font-black italic text-3xl tracking-tighter">AJCAR 25</p>
            <p className="text-gray-400 text-sm mt-1">Taller de Chapa y Pintura</p>
          </div>
        </div>

        {/* Formulario */}
        <div className="w-full bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">

          {/* Logo móvil — solo cuando no se ve el lateral */}
          <div className="flex justify-center mb-5 lg:hidden">
            <img
              src="/imagenes/logo_ajcar25.png"
              alt="AJCAR 25"
              className="w-14 h-14 rounded-2xl object-contain"
            />
          </div>

          <h1 className="text-xl sm:text-2xl font-semibold text-center mb-5 sm:mb-6">
            Crear Cuenta
          </h1>

          <RegisterForm />

          <p className="text-center text-gray-400 text-sm mt-5 sm:mt-6">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-red-500 hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>

      </div>
    </main>
  )
}
