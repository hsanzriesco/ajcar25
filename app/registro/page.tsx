"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
    };

    return (
        <main className="min-h-screen bg-ajcar text-white flex items-center justify-center px-6 py-10">

            <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-10 items-center">

                {/* ================= LADO IZQUIERDO - LOGO ================= */}
                <div className="hidden lg:flex flex-col items-center justify-center text-center space-y-6">

                    <Image
                        src="/imagenes/prueba_logo_1.png"
                        alt="AJCAR25"
                        width={220}
                        height={220}
                        priority
                        className="object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]"
                    />

                    <div className="space-y-3 max-w-sm">
                        <h2 className="text-3xl font-bold tracking-wide">
                            Bienvenido a AJCAR25
                        </h2>

                        <p className="text-gray-400 text-sm">
                            Regístrate para gestionar tus reparaciones,
                            presupuestos y seguimiento de tu vehículo.
                        </p>
                    </div>

                </div>

                {/* ================= FORMULARIO ================= */}
                <div className="w-full bg-black/60 backdrop-blur-lg border border-white/10 rounded-xl p-8 shadow-xl">

                    {/* LOGO MOVIL */}
                    <div className="flex justify-center mb-6 lg:hidden">
                        <Image
                            src="/imagenes/prueba_logo_navbar.png"
                            alt="AJCAR25"
                            width={90}
                            height={90}
                            className="object-contain"
                        />
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold">
                            Crear Cuenta
                        </h1>

                        <p className="text-gray-400 text-sm mt-2">
                            Regístrate en AJCAR25
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        <InputField
                            icon={User}
                            placeholder="Nombre"
                            name="nombre"
                            value={form.nombre}
                            onChange={handleChange}
                        />

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

                        <InputField
                            icon={IdCard}
                            placeholder="DNI / NIF"
                            name="dni"
                            value={form.dni}
                            onChange={handleChange}
                        />

                        <InputField
                            icon={Mail}
                            placeholder="Correo electrónico"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                        />

                        <InputField
                            icon={Phone}
                            placeholder="Número de teléfono"
                            name="telefono"
                            value={form.telefono}
                            onChange={handleChange}
                        />

                        <InputField
                            icon={Lock}
                            placeholder="Contraseña"
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                        />

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

                        <button
                            type="submit"
                            className="w-full bg-gray-200 text-black font-semibold py-2.5 rounded-lg hover:bg-white transition"
                        >
                            Registrarse
                        </button>

                    </form>

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
            </div>
        </main>
    );
}

/* ===== INPUT COMPONENT ===== */

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