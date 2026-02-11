import Image from "next/image";

export default function RegistroPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-ajcar text-white px-6 py-16">

            <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">

                {/* ================= PANEL IZQUIERDO (LOGO) ================= */}
                <div className="hidden lg:flex flex-col items-center justify-center text-center space-y-6">

                    <Image
                        src="/imagenes/prueba_logo_1.png"
                        alt="Logo AJCAR25"
                        width={260}
                        height={260}
                        className="opacity-90"
                    />

                    <h2 className="text-2xl font-semibold tracking-wide">
                        Bienvenido a AJCAR 25
                    </h2>

                    <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
                        Regístrate para gestionar tus reparaciones, presupuestos y
                        seguimiento de tu vehículo.
                    </p>

                </div>

                {/* ================= FORMULARIO ================= */}
                <div className="w-full bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl">

                    <h1 className="text-2xl font-semibold text-center mb-6">
                        Crear Cuenta
                    </h1>

                    <form className="space-y-4">

                        {/* Nombre */}
                        <input
                            type="text"
                            placeholder="Nombre"
                            className="w-full px-4 py-2 rounded bg-neutral-800 border border-white/10 focus:outline-none focus:border-red-600"
                        />

                        {/* Primer Apellido */}
                        <input
                            type="text"
                            placeholder="Primer Apellido"
                            className="w-full px-4 py-2 rounded bg-neutral-800 border border-white/10 focus:outline-none focus:border-red-600"
                        />

                        {/* Segundo Apellido */}
                        <input
                            type="text"
                            placeholder="Segundo Apellido"
                            className="w-full px-4 py-2 rounded bg-neutral-800 border border-white/10 focus:outline-none focus:border-red-600"
                        />

                        {/* DNI */}
                        <input
                            type="text"
                            placeholder="DNI / NIF"
                            className="w-full px-4 py-2 rounded bg-neutral-800 border border-white/10 focus:outline-none focus:border-red-600"
                        />

                        {/* Email */}
                        <input
                            type="email"
                            placeholder="Correo electrónico"
                            className="w-full px-4 py-2 rounded bg-neutral-800 border border-white/10 focus:outline-none focus:border-red-600"
                        />

                        {/* Teléfono */}
                        <input
                            type="tel"
                            placeholder="Número de teléfono"
                            className="w-full px-4 py-2 rounded bg-neutral-800 border border-white/10 focus:outline-none focus:border-red-600"
                        />

                        {/* Contraseña */}
                        <input
                            type="password"
                            placeholder="Contraseña"
                            className="w-full px-4 py-2 rounded bg-neutral-800 border border-white/10 focus:outline-none focus:border-red-600"
                        />

                        {/* Repetir Contraseña */}
                        <input
                            type="password"
                            placeholder="Repetir Contraseña"
                            className="w-full px-4 py-2 rounded bg-neutral-800 border border-white/10 focus:outline-none focus:border-red-600"
                        />

                        {/* Botón */}
                        <button
                            type="submit"
                            className="w-full bg-red-700 hover:bg-red-600 transition py-2 rounded font-semibold mt-4"
                        >
                            Registrarse
                        </button>

                    </form>

                    {/* Login link */}
                    <p className="text-center text-gray-400 text-sm mt-6">
                        ¿Ya tienes cuenta?{" "}
                        <a href="/login" className="text-red-500 hover:underline">
                            Inicia sesión
                        </a>
                    </p>

                </div>

            </div>
        </main>
    );
}