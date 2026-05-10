import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-ajcar text-white px-4 sm:px-6 py-8">
      <div className="w-full max-w-md bg-black/60 backdrop-blur-lg border border-white/10 rounded-2xl sm:rounded-xl p-6 sm:p-8 shadow-xl">

        <div className="text-center mb-6 sm:mb-8">
          <img
            src="/imagenes/logo_ajcar25.png"
            alt="AJCAR 25"
            className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto mb-4 rounded-2xl"
          />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-wide">Iniciar Sesión</h1>
          <p className="text-gray-400 text-sm mt-2">Accede a tu cuenta AJCAR25</p>
        </div>

        <LoginForm />

      </div>
    </main>
  );
}
