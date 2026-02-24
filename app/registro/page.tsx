"use client"

import Image from "next/image"
import RegisterForm from "@/components/RegisterForm"

export default function RegistroPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-ajcar text-white px-6 py-16">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">

        <div className="hidden lg:flex flex-col items-center justify-center text-center space-y-6">
          <Image
            src="/imagenes/prueba_logo_1.png"
            alt="Logo AJCAR25"
            width={260}
            height={260}
            className="opacity-90"
          />
        </div>

        <div className="w-full bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl">
          <h1 className="text-2xl font-semibold text-center mb-6">
            Crear Cuenta
          </h1>

          <RegisterForm />

          <p className="text-center text-gray-400 text-sm mt-6">
            ¿Ya tienes cuenta?{" "}
            <a href="/login" className="text-red-500 hover:underline">
              Inicia sesión
            </a>
          </p>
        </div>

      </div>
    </main>
  )
}