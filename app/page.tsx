// app/page.tsx
import Image from "next/image";

export default function Home() {
  return (
    <main className="bg-neutral-900 text-white">
      {/* HERO */}
      <section className="relative h-[90vh] w-full">
        <Image
          src="/imagenes/Hombre_pintando_coche.png"
          alt="AJCAR25 Taller de Chapa y Pintura"
        fill
        priority
        className="object-cover opacity-60"
/>
        <div className="relative z-10 flex h-full flex-col justify-center px-8 md:px-20">
          <h1 className="text-4xl md:text-6xl font-bold">AJCAR 25</h1>
          <h2 className="mt-2 text-xl md:text-3xl text-gray-300">
            Taller de Chapa y Pintura
          </h2>
          <p className="mt-4 max-w-xl text-gray-300">
            Calidad, precisión y confianza en cada reparación
          </p>
          <button className="mt-6 w-fit rounded bg-gray-200 px-6 py-3 font-semibold text-black hover:bg-white">
            PIDE TU PRESUPUESTO
          </button>
        </div>
      </section>

      {/* SERVICIOS */}
      <section className="mx-auto grid max-w-6xl grid-cols-2 gap-6 py-16 md:grid-cols-6">
        {[
          "Chapa y Pintura",
          "Pintura Completa",
          "Reparación de Golpes",
          "Pulido y Detallado",
          "Aseguradoras",
          "Reparaciones Rápidas",
        ].map((s) => (
          <div
            key={s}
            className="flex flex-col items-center gap-2 text-sm text-gray-300"
          >
            <div className="h-12 w-12 rounded-full bg-gray-700" />
            <span>{s}</span>
          </div>
        ))}
      </section>

      {/* POR QUÉ ELEGIRNOS */}
      <section className="bg-neutral-800 py-16">
        <h3 className="mb-8 text-center text-2xl font-semibold">
          ¿Por qué elegir Ajcar 25?
        </h3>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-6 md:grid-cols-3">
          {[
            "Más de 20 años de experiencia",
            "Cumplimos plazos",
            "Garantía en nuestros trabajos",
            "Materiales de alta calidad",
            "Atención personalizada",
            "Atención con aseguradoras",
          ].map((item) => (
            <div key={item} className="flex gap-2 text-gray-300">
              <span>✓</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* TRABAJOS */}
      <section className="py-16">
        <h3 className="mb-8 text-center text-2xl font-semibold">
          Trabajos Realizados
        </h3>
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 md:grid-cols-4">
          {["antes1.jpg", "antes2.jpg", "despues1.jpg", "despues2.jpg"].map(
            (img) => (
              <div key={img} className="relative h-56">
                <Image
                  src={`/${img}`}
                  alt="Trabajo realizado"
                  fill
                  className="object-cover rounded"
                />
              </div>
            )
          )}
        </div>
      </section>

      {/* SOBRE NOSOTROS */}
      <section className="bg-neutral-800 py-16">
        <div className="mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-2xl font-semibold mb-4">Sobre Nosotros</h3>
            <p className="text-gray-300">
              En Ajcar 25 somos un taller especializado en chapa y pintura,
              comprometidos con ofrecer resultados impecables y un trato cercano.
              Cada vehículo se trata como si fuera nuestro.
            </p>
          </div>
          <div className="flex items-center justify-center">
            <div className="h-40 w-40 rounded-full bg-gray-700" />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-6 text-center text-sm text-gray-400">
        © 2024 Ajcar 25 · Aviso Legal · Política de Privacidad
      </footer>
    </main>
  );
}
