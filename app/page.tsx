import Image from "next/image";
import Link from "next/link";
import {
  Paintbrush, SprayCan, Hammer, Sparkles,
  ShieldCheck, Gauge, MapPin, Phone, Mail, Clock,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AJCAR 25 - Taller de Chapa y Pintura",
  description: "Taller especializado en chapa y pintura. Calidad, precisión y confianza en cada reparación.",
};

export default function Home() {
  return (
    <main className="bg-ajcar text-white">
      <div className="bg-ajcar-content">

        {/* HERO */}
        <section id="inicio" className="relative h-[70vh] sm:min-h-[85vh] lg:min-h-[90vh] w-full">
          <Image
            src="/imagenes/Hombre_pintando_coche.jpg"
            alt="AJCAR25 Taller de Chapa y Pintura"
            fill priority
            className="object-cover object-[70%_center] sm:object-center"
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 flex h-full flex-col justify-center px-5 sm:px-10 md:px-20 max-w-7xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-wide">
              AJCAR 25
            </h1>
            <h2 className="mt-2 text-base sm:text-xl md:text-3xl text-gray-300">
              Taller de Chapa y Pintura
            </h2>
            <p className="mt-3 sm:mt-4 max-w-xs sm:max-w-lg text-sm sm:text-base text-gray-300">
              Calidad, precisión y confianza en cada reparación
            </p>
            <Link
              href="/presupuesto"
              className="mt-5 sm:mt-6 w-fit rounded bg-gray-200 px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-black transition hover:bg-white inline-block active:scale-[0.98]"
            >
              PIDE TU PRESUPUESTO
            </Link>
          </div>
        </section>

        {/* SERVICIOS */}
        <section id="servicios" className="max-w-7xl mx-auto px-5 sm:px-6 py-10 sm:py-14 lg:py-16">
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-8">
            {[
              { label: "Chapa y Pintura", icon: Paintbrush },
              { label: "Pintura Completa", icon: SprayCan },
              { label: "Reparación de Golpes", icon: Hammer },
              { label: "Pulido y Detallado", icon: Sparkles },
              { label: "Aseguradoras", icon: ShieldCheck },
              { label: "Reparaciones Rápidas", icon: Gauge },
            ].map(({ label, icon: Icon }) => (
              <div key={label}
                className="group flex flex-col items-center gap-2 sm:gap-3 text-[11px] sm:text-sm text-gray-300 hover:text-white transition">
                <div className="flex items-center justify-center h-11 w-11 sm:h-14 sm:w-14 rounded-full bg-neutral-800 border border-white/10 shadow-md shadow-black/40 transition group-hover:bg-red-600">
                  <Icon size={20} className="sm:w-[26px] sm:h-[26px]" />
                </div>
                <span className="text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* POR QUÉ ELEGIRNOS */}
        <section className="relative py-10 sm:py-12 lg:py-14 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#6b1a1a] via-[#3a0d0d] to-[#1b0505]" />
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 opacity-25 bg-[url('/imagenes/fondo_pagina.png')] bg-cover bg-center" />
          <div className="absolute top-0 left-0 w-full h-[2px] bg-white/20" />
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-white/20" />

          <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-6">
            <div className="flex items-center justify-center gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="h-[1px] w-12 sm:w-24 bg-white/30" />
              <h3 className="text-base sm:text-xl font-semibold tracking-wide text-gray-100 text-center">
                ¿Por qué elegir Ajcar 25?
              </h3>
              <div className="h-[1px] w-12 sm:w-24 bg-white/30" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 sm:gap-y-4 gap-x-6 sm:gap-x-10 text-sm text-gray-200">
              {[
                "Más de 20 años de experiencia",
                "Materiales y pintura de alta calidad",
                "Atención personalizada",
                "Materiales y pintura perfecta",
                "Garantía en nuestros trabajos",
                "Cumplimos plazos",
                "Muchos clientes satisfechos",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 hover:text-white transition">
                  <span className="text-red-400 flex-shrink-0">✔</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRABAJOS */}
        <section id="trabajos" className="py-10 sm:py-14 lg:py-16">
          <h3 className="mb-6 sm:mb-10 text-center text-lg sm:text-2xl font-semibold px-5">
            Trabajos Realizados
          </h3>
          <div className="max-w-6xl mx-auto px-5 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="relative h-52 sm:h-72 lg:h-80 overflow-hidden rounded-xl border border-white/5">
                <Image src="/imagenes/Coche_antes_1.png" alt="Antes reparación coche"
                  fill className="object-cover transition duration-300 hover:scale-105" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-4 py-2 text-xs sm:text-sm font-medium text-gray-300">
                  Antes
                </div>
              </div>
              <div className="relative h-52 sm:h-72 lg:h-80 overflow-hidden rounded-xl border border-white/5">
                <Image src="/imagenes/Coche_despues_1.png" alt="Después reparación coche"
                  fill className="object-cover transition duration-300 hover:scale-105" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-4 py-2 text-xs sm:text-sm font-medium text-gray-300">
                  Después
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SOBRE NOSOTROS */}
        <section id="nosotros" className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
          <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6">
            <div className="flex items-center justify-center gap-4 sm:gap-6 mb-8 sm:mb-12">
              <div className="h-[1px] w-12 sm:w-20 bg-white/30" />
              <h3 className="text-lg sm:text-2xl font-semibold text-center">Sobre Nosotros</h3>
              <div className="h-[1px] w-12 sm:w-20 bg-white/30" />
            </div>

            <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
              <div className="space-y-6 sm:space-y-8">
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed max-w-lg">
                  En Ajcar 25 somos un taller especializado en chapa y pintura,
                  comprometidos con ofrecer resultados impecables y un trato
                  cercano. Cada vehículo se trata como si fuera nuestro.
                </p>

                <div className="space-y-3">
                  <h4 className="font-semibold text-base sm:text-lg border-l-2 border-red-600 pl-3">Contáctanos</h4>
                  <div className="space-y-2 text-gray-300 text-sm">
                    <p className="flex items-center gap-2"><MapPin size={15} className="text-red-500 flex-shrink-0" />Calle Ejemplo 123, Ciudad</p>
                    <p className="flex items-center gap-2"><Phone size={15} className="text-red-500 flex-shrink-0" />123 455 789</p>
                    <p className="flex items-center gap-2"><Mail size={15} className="text-red-500 flex-shrink-0" />info@ajcar25.com</p>
                    <p className="flex items-center gap-2"><Clock size={15} className="text-red-500 flex-shrink-0" />Lun - Vie: 9:00 - 18:00</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center lg:justify-end mt-4 lg:mt-0">
                <Image
                  src="/imagenes/prueba_logo_1.png"
                  alt="Logo AJCAR25"
                  width={280}
                  height={280}
                  className="opacity-40 grayscale hover:grayscale-0 transition duration-500 w-48 sm:w-64 lg:w-80 h-auto"
                />
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
