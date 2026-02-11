"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, User } from "lucide-react";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    const links = [
        { label: "Inicio", href: "#inicio" },
        { label: "Servicios", href: "#servicios" },
        { label: "Trabajos", href: "#trabajos" },
        { label: "Sobre Nosotros", href: "#nosotros" },
        { label: "Contacto", href: "#contacto" },
    ];

    return (
        <header className="fixed top-0 left-0 w-full z-50">

            {/* Línea roja superior */}
            <div className="h-[2px] w-full bg-gradient-to-r from-red-900 via-red-600 to-red-900" />

            {/* Fondo navbar */}
            <div className="backdrop-blur-md bg-black/70 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

                    {/* LOGO */}
                    <a href="#inicio" className="flex items-center gap-3">
                        <Image
                            src="/imagenes/prueba_logo_navbar.png"
                            alt="AJCAR25"
                            width={42}
                            height={42}
                            priority
                            className="object-contain"
                        />
                        <span className="text-lg font-semibold tracking-wider">
                            AJCAR25
                        </span>
                    </a>

                    {/* ================= DESKTOP MENU ================= */}
                    <nav className="hidden md:flex items-center gap-8 text-sm text-gray-300">

                        {links.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="hover:text-white transition"
                            >
                                {link.label}
                            </a>
                        ))}

                        {/* ICONO USUARIO */}
                        <Link
                            href="/login"
                            className="ml-4 p-2 rounded-full hover:bg-white/10 transition"
                            aria-label="Login"
                        >
                            <User size={22} />
                        </Link>

                    </nav>

                    {/* ================= MOBILE BUTTON ================= */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden text-white"
                        aria-label="Abrir menú"
                    >
                        {isOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>

                </div>
            </div>

            {/* ================= MOBILE MENU ================= */}
            <div
                className={`md:hidden bg-black/95 backdrop-blur-lg border-b border-white/10 transition-all duration-300 ${isOpen ? "max-h-[450px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                    }`}
            >
                <nav className="flex flex-col px-6 py-4 space-y-4 text-gray-300">

                    {links.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className="hover:text-white transition"
                        >
                            {link.label}
                        </a>
                    ))}

                    {/* LOGIN MOBILE */}
                    <Link
                        href="/login"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 pt-2 border-t border-white/10 hover:text-white transition"
                    >
                        <User size={18} />
                        Iniciar sesión
                    </Link>

                </nav>
            </div>
        </header>
    );
}