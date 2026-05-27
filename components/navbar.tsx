"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, User, LogOut } from "lucide-react";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    /* Rol y nombre del usuario leídos de sessionStorage. Se inicializan en null
       para representar el estado de sesión no iniciada. */
    const [role, setRole] = useState<string | null>(null);
    const [name, setName] = useState<string | null>(null);
    const router = useRouter();

    /* Lee los datos de sesión de sessionStorage al montar el componente.
       Se hace en useEffect porque sessionStorage solo existe en el cliente,
       no durante el renderizado en servidor de Next.js. */
    useEffect(() => {
        const storedRole = sessionStorage.getItem("user_role");
        const storedName = sessionStorage.getItem("user_name");
        setRole(storedRole);
        setName(storedName);
    }, []);

    /* Cierra sesión limpiando todo sessionStorage, reseteando los estados locales,
       cerrando el menú móvil y forzando una recarga completa de la página para
       que todos los componentes reflejen el estado de no autenticado. */
    const handleLogout = () => {
        sessionStorage.clear();
        setRole(null);
        setName(null);
        setIsOpen(false);
        router.push("/");
        window.location.reload();
    };

    return (
        <header className="fixed top-0 left-0 w-full z-50">

            {/* Línea decorativa degradada en rojo que actúa como borde superior de la navbar. */}
            <div className="h-[2px] w-full bg-gradient-to-r from-red-900 via-red-600 to-red-900" />

            <div className="backdrop-blur-md bg-black/70 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

                    {/* Logo con imagen y nombre de marca. priority en Image evita CLS
                        al cargar el logo antes que el resto de imágenes de la página. */}
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <Image
                            src="/imagenes/prueba_logo_navbar.png"
                            alt="AJCAR25"
                            width={42}
                            height={42}
                            priority
                            className="object-contain"
                        />
                        <span className="text-lg font-semibold tracking-wider text-white">
                            AJCAR25
                        </span>
                    </Link>

                    {/* Menú de navegación de escritorio, oculto en móvil con hidden md:flex.
                        Muestra enlaces de rol solo si el rol del usuario los requiere. */}
                    <nav className="hidden md:flex items-center gap-8 text-sm text-gray-300">

                        {/* Acceso al panel de administración solo para el rol Jefe. */}
                        {role === "Jefe" && (
                            <Link href="/admin/dashboard" className="text-red-500 font-bold hover:text-red-400">
                                Panel Jefe
                            </Link>
                        )}
                        {/* Acceso a la gestión de tareas solo para empleados. */}
                        {role === "Empleado" && (
                            <Link href="/gestion/tareas" className="text-blue-400 font-bold hover:text-blue-300">
                                Tareas
                            </Link>
                        )}

                        {/* Sección de usuario separada por un borde vertical.
                            Si hay sesión activa muestra nombre, rol y botón de logout;
                            si no, muestra el icono de acceso al login. */}
                        <div className="flex items-center gap-4 ml-4 pl-4 border-l border-white/10">
                            {role ? (
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                        <span className="text-white text-xs font-medium uppercase">{name}</span>
                                        <span className="text-[10px] text-gray-500">{role}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 rounded-full hover:bg-red-500/20 text-red-500 transition"
                                        title="Cerrar Sesión"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    href="/login"
                                    className="p-2 rounded-full hover:bg-white/10 transition text-white"
                                    aria-label="Login"
                                >
                                    <User size={22} />
                                </Link>
                            )}
                        </div>
                    </nav>

                    {/* Botón hamburguesa/cierre para móvil que alterna el estado isOpen. */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden text-white"
                        aria-label="Abrir menú"
                    >
                        {isOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>

                </div>
            </div>

            {/* Menú móvil con animación de altura y opacidad.
                overflow-hidden en el estado cerrado evita que el contenido
                sea visible o interactuable cuando max-h es 0. */}
            <div
                className={`md:hidden bg-black/95 backdrop-blur-lg border-b border-white/10 transition-all duration-300 ${isOpen ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                    }`}
            >
                <nav className="flex flex-col px-6 py-6 space-y-4 text-gray-300">
                    {role === "Jefe" && (
                        <Link href="/admin/dashboard" onClick={() => setIsOpen(false)} className="text-red-500 font-bold text-lg">
                            Panel Jefe
                        </Link>
                    )}
                    {role === "Empleado" && (
                        <Link href="/gestion/tareas" onClick={() => setIsOpen(false)} className="text-blue-400 font-bold text-lg">
                            Tareas
                        </Link>
                    )}

                    {/* Sección inferior del menú móvil separada por un borde.
                        Replica la lógica de autenticación del menú desktop. */}
                    <div className="pt-4 border-t border-white/10">
                        {role ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-white">
                                    <User size={20} className="text-gray-400" />
                                    <span>{name} ({role})</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 bg-red-600/20 text-red-500 py-3 rounded-lg font-bold"
                                >
                                    <LogOut size={18} />
                                    Cerrar sesión
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-2 text-white bg-white/10 w-fit px-4 py-2 rounded-lg"
                            >
                                <User size={18} />
                                Iniciar sesión
                            </Link>
                        )}
                    </div>
                </nav>
            </div>
        </header>
    );
}