import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-ajcar">
      <div className="bg-neutral-900 p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          Registro Clientes
        </h1>

        <RegisterForm />
      </div>
    </main>
  );
}