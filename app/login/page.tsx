import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-ajcar text-white px-6">
      <div className="w-full max-w-md bg-black/60 backdrop-blur-lg border border-white/10 rounded-xl p-8 shadow-xl">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-wide">Iniciar Sesión</h1>
          <p className="text-gray-400 text-sm mt-2">Accede a tu cuenta AJCAR25</p>
        </div>

        {/* Llamamos al componente que acabamos de mejorar */}
        <LoginForm />

      </div>
    </main>
  );
}