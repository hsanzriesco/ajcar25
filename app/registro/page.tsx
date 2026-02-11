"use client";

import { useState } from "react";
import Link from "next/link";
import {
    User,
    Mail,
    Lock,
    Phone,
    IdCard,
} from "lucide-react";

export default function RegistroPage() {
    const [form, setForm] = useState({
        nombre: "",
        apellido1: "",
        apellido2: "",
        dni: "",
        email: "",
        telefono: "",
        password: "",
        confirmPassword: "",
    });

    const [error, setError] = useState("");

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (form.password !== form.confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        setError("");

        console.log("Registro:", form);

        // Aquí luego conectarás con backend / Prisma
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-ajcar text-white px-6 py-10">

            <div className="w-full max-w-xl bg-black/60 backdrop-blur-lg border border-white/10 rounded-xl p-8 shadow-xl">

                {/* TITULO */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-wide">
                        Crear Cuenta
                    </h1>

                    <p className="text-gray-400 text-sm mt-2">
                        Regístrate en AJCAR25
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* NOMBRE */}
                    <InputField
                        icon={User}
                        placeholder="Nombre"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                    />

                    {/* APELLIDOS */}
                    <div className="grid sm:grid-cols-2 gap-4">
                        <InputField
                            icon={User}
                            placeholder="Primer apellido"
                            name="apellido1"
                            value={form.apellido1}
                            onChange={handleChange}
                        />

                        <InputField
                            icon={User}
                            placeholder="Segundo apellido"
                            name="apellido2"
                            value={form.apellido2}
                            onChange={handleChange}
                        />
                    </div>

                    {/* DNI */}
                    <InputField
                        icon={IdCard}
                        placeholder="DNI / NIF"
                        name="dni"
                        value={form.dni}
                        onChange={handleChange}
                    />

                    {/* EMAIL */}
                    <InputField
                        icon={Mail}
                        placeholder="Correo electrónico"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                    />

                    {/* TELEFONO */}
                    <InputField
                        icon={Phone}
                        placeholder="Número de teléfono"
                        name="telefono"
                        value={form.telefono}
                        onChange={handleChange}
                    />

                    {/* PASSWORD */}
                    <InputField
                        icon={Lock}
                        placeholder="Contraseña"
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                    />

                    {/* CONFIRM PASSWORD */}
                    <InputField
                        icon={Lock}
                        placeholder="Repetir contraseña"
                        type="password"
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                    />

                    {error && (
                        <p className="text-red-400 text-sm">
                            {error}
                        </p>
                    )}

                    {/* BOTON */}
                    <button
                        type="submit"
                        className="w-full bg-gray-200 text-black font-semibold py-2.5 rounded-lg hover:bg-white transition"
                    >
                        Registrarse
                    </button>

                </form>

                {/* LOGIN LINK */}
                <div className="text-center mt-6 text-sm text-gray-400">
                    ¿Ya tienes cuenta?{" "}
                    <Link
                        href="/login"
                        className="text-white hover:underline"
                    >
                        Inicia sesión
                    </Link>
                </div>

            </div>

        </main>
    );
}

/* ================= COMPONENTE INPUT ================= */

function InputField({
    icon: Icon,
    placeholder,
    type = "text",
    name,
    value,
    onChange,
}: any) {
    return (
        <div className="flex items-center bg-neutral-900 border border-white/10 rounded-lg px-3">
            <Icon size={18} className="text-gray-400" />

            <input
                required
                type={type}
                placeholder={placeholder}
                name={name}
                value={value}
                onChange={onChange}
                className="w-full bg-transparent px-3 py-2 text-sm outline-none"
            />
        </div>
    );
}