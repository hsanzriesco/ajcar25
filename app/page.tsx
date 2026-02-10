import Image from "next/image";

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
            "Chapa y Pintura",
            "Pintura Completa",
            "Reparación de Golpes",
            "Pulido y Detallado",
            "Aseguradoras",
            "Reparaciones Rápidas",
          ].map((servicio) => (
            <div
              key={servicio}
              className="flex flex-col items-center gap-3 text-xs sm:text-sm text-gray-300 hover:text-white transition"
            >
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gray-700" />
              <span className="text-center leading-tight">
                {servicio}
              </span>
            </div>
          ))}

        </div>
      </section>

      {/* POR QUÉ ELEGIRNOS — DISEÑO ROJO */}
      <section className="relative py-12 bg-gradient-to-b from-red-700 via-red-600 to-red-800">

        {/* Glow superior */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-red-300 to-transparent opacity-80" />

        <div className="max-w-6xl mx-auto px-6">

          <h3 className="text-center text-lg sm:text-xl md:text-2xl font-semibold text-white mb-8">
            ¿Por qué elegir Ajcar 25?
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8 text-white text-sm sm:text-base">

            {[
              "Más de 20 años de experiencia",
              "Materiales y pintura de alta calidad",
              "Atención personalizada",
              "Materiales y pintura perfecta",
              "Garantía en nuestros trabajos",
              "Atención con aseguradoras",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="text-red-200 text-lg">✔</span>
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

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

          {["antes1.jpg", "antes2.jpg", "despues1.jpg", "despues2.jpg"].map(
            (img) => (
              <div
                key={img}
                className="relative h-56 sm:h-64 overflow-hidden rounded-lg"
              >
                <Image
                  src={`/${img}`}
                  alt="Trabajo realizado"
                  fill
                  className="object-cover transition duration-300 hover:scale-105"
                />
              </div>
            )
          )}

        </div>
      </section>

      {/* SOBRE NOSOTROS */}
      <section id="nosotros" className="bg-neutral-800 py-14 sm:py-16">
        <div className="max-w-7xl mx-auto px-6 grid gap-10 lg:grid-cols-2 items-center">

          <div>
            <h3 className="mb-4 text-xl sm:text-2xl font-semibold">
              Sobre Nosotros
            </h3>

            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              En Ajcar 25 somos un taller especializado en chapa y pintura,
              comprometidos con ofrecer resultados impecables y un trato cercano.
              Cada vehículo se trata como si fuera nuestro.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full bg-gray-700" />
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