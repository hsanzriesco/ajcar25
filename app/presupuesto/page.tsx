import QuoteForm from "@/components/QuoteForm";

export default function PresupuestoPage() {
  return (
    <main className="min-h-screen bg-ajcar pt-24 sm:pt-32 pb-10 sm:pb-12 px-4 sm:px-6 relative overflow-hidden">
      {/* CAPA DE OSCURECIMIENTO */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-7 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3 sm:mb-4 drop-shadow-md">
            <span className="text-white">Pide tu </span>
            <span className="text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.4)]">
              Presupuesto
            </span>
          </h1>

          <p className="text-gray-200 text-sm sm:text-base md:text-lg max-w-xl mx-auto leading-relaxed font-medium">
            Cuéntanos qué necesita tu coche y te daremos una valoración
            <span className="text-white ml-1">
              lo antes posible y sin compromiso.
            </span>
          </p>
        </div>

        {/* CONTENEDOR DEL FORMULARIO */}
        <div className="bg-black/70 backdrop-blur-2xl border border-white/20 p-5 sm:p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <QuoteForm />
        </div>

        <p className="text-center text-gray-400 text-xs mt-6 sm:mt-8 font-light px-4">
          Al enviar este formulario, nos pondremos en contacto contigo a la mayor brevedad.
        </p>
      </div>
    </main>
  );
}
