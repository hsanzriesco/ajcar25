import Image from "next/image";
import {
  Paintbrush,
  SprayCan,
  Hammer,
  Sparkles,
  ShieldCheck,
  Gauge,
} from "lucide-react";

export default function Home() {
  return (
    <main className="bg-neutral-900 text-white pt-20">

      {/* HERO */}
      <section
        id="inicio"
        className="relative min-h-[80vh] sm:min-h-[85vh] lg:min-h-[90vh] w-full"
      >
        <Image
          src="/imagenes/Hombre_pintando_coche.jpg"
          alt="AJCAR25 Taller de Chapa y Pintura"
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 flex h-full flex-col justify-center px-6 sm:px-10 md:px-20 max-w-7xl mx-auto pt-16 sm:pt-20 md:pt-24">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-wide">
            AJCAR 25
          </h1>

          <h2 className="mt-2 text-lg sm:text-xl md:text-3xl text-gray-300">
            Taller de Chapa y Pintura
          </h2>

          <p className="mt-4 max-w-md sm:max-w-lg text-sm sm:text-base text-gray-300">
            Calidad, precisión y confianza en cada reparación
          </p>

          <button className="mt-6 w-fit rounded bg-gray-200 px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-black transition hover:bg-white">
            PIDE TU PRESUPUESTO
          </button>
        </div>
      </section>

      {/* SERVICIOS */}
      <section
        id="servicios"
        className="max-w-7xl mx-auto px-6 py-14 sm:py-16"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
          {[
            { label: "Chapa y Pintura", icon: Paintbrush },
            { label: "Pintura Completa", icon: SprayCan },
            { label: "Reparación de Golpes", icon: Hammer },
            { label: "Pulido y Detallado", icon: Sparkles },
            { label: "Aseguradoras", icon: ShieldCheck },
            { label: "Reparaciones Rápidas", icon: Gauge },
          ].map(({ label, icon: Icon }) => (
            <div
              key={label}
              className="group flex flex-col items-center gap-3 text-xs sm:text-sm text-gray-300 hover:text-white transition"
            >
              <div className="flex items-center justify-center h-14 w-14 rounded-full bg-neutral-800 border border-white/10 shadow-md shadow-black/40 transition group-hover:bg-red-600">
                <Icon size={26} className="text-white" />
              </div>

              <span className="text-center leading-tight">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* POR QUÉ ELEGIRNOS */}
      <section className="relative py-14 sm:py-16 bg-gradient-to-r from-red-900 via-red-700 to-red-900">
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <h3 className="mb-8 text-xl sm:text-2xl font-semibold">
            ¿Por qué elegir Ajcar 25?
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-10 text-sm sm:text-base">
            {[
              "Más de 20 años de experiencia",
              "Materiales y pintura de alta calidad",
              "Atención personalizada",
              "Resultados de acabado perfecto",
              "Garantía en nuestros trabajos",
              "Cumplimos plazos",
            ].map((item) => (
              <div key={item} className="flex items-center justify-center gap-2">
                <span className="text-white">✔</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRABAJOS */}
      <section id="trabajos" className="py-14 sm:py-16">
        <h3 className="mb-10 text-center text-xl sm:text-2xl font-semibold">
          Trabajos Realizados
        </h3>

        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">

            <div className="relative h-64 sm:h-80 overflow-hidden rounded-lg">
              <Image
                src="/imagenes/Coche_antes_1.png"
                alt="Antes reparación coche"
                fill
                className="object-cover transition duration-300 hover:scale-105"
              />
            </div>

            <div className="relative h-64 sm:h-80 overflow-hidden rounded-lg">
              <Image
                src="/imagenes/Coche_despues_1.png"
                alt="Después reparación coche"
                fill
                className="object-cover transition duration-300 hover:scale-105"
              />
            </div>

          </div>
        </div>
      </section>

      {/* SOBRE NOSOTROS */}
      <section id="nosotros" className="relative bg-neutral-800 py-20 overflow-hidden">

        {/* LOGO WATERMARK */}
        <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 opacity-20 pointer-events-none">
          <Image
            src="/imagenes/logo_ajcar25.png"
            alt="Logo AJCAR25"
            width={500}
            height={500}
            className="object-contain"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="max-w-xl">

            <h3 className="mb-6 text-2xl sm:text-3xl font-semibold">
              Sobre Nosotros
            </h3>

            <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
              En Ajcar 25 somos un taller especializado en chapa y pintura,
              comprometidos con ofrecer resultados impecables y un trato cercano.
              Cada vehículo se trata como si fuera nuestro.
            </p>

          </div>
        </div>

      </section>

      {/* CONTACTO */}
      <section id="contacto" className="py-14 sm:py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">

          <h3 className="mb-6 text-xl sm:text-2xl font-semibold">
            Contáctanos
          </h3>

          <div className="space-y-2 text-sm sm:text-base text-gray-300">
            <p>Calle Ejemplo 123, Ciudad</p>
            <p>123 455 789</p>
            <p>info@ajcar25.com</p>
            <p>Lun - Vie: 9:00 - 18:00</p>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-6 text-center text-xs sm:text-sm text-gray-400 px-4">
        © 2024 Ajcar 25 · Aviso Legal · Política de Privacidad
      </footer>

    </main>
  );
}