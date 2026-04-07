"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Car, FileText, Clock, CheckCircle, AlertCircle,
    Download, LogOut, Wrench, Phone, Mail
} from "lucide-react";

interface VehiculoEstado {
    vehiculo: string;
    estado: "En Taller" | "En Espera" | "Finalizado" | "Presupuesto Pendiente";
    fecha_ingreso?: string;
    mensaje?: string;
    total_estimado?: number;
}

export default function ClientePage() {
    const [cliente, setCliente] = useState<any>(null);
    const [vehiculoEstado, setVehiculoEstado] = useState<VehiculoEstado | null>(null);
    const [presupuestos, setPresupuestos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"estado" | "presupuestos" | "facturas" | "perfil">("estado");

    const router = useRouter();

    useEffect(() => {
        const userId = localStorage.getItem("user_id");
        const role = localStorage.getItem("user_role");

        if (!userId || role?.toLowerCase() !== "cliente") {
            router.push("/login");
            return;
        }

        cargarDatosCliente(userId);
    }, [router]);

    const cargarDatosCliente = async (userId: string) => {
        try {
            const res = await fetch(`/api/cliente/${userId}`);

            if (!res.ok) {
                console.error("Error al cargar datos");
                return;
            }

            const data = await res.json();

            setCliente(data.cliente);
            setPresupuestos(data.presupuestos || []);

            // Simulamos estado del vehículo (más adelante lo traeremos de la BD)
            if (data.presupuestos && data.presupuestos.length > 0) {
                const ultimo = data.presupuestos[0];
                setVehiculoEstado({
                    vehiculo: ultimo.vehiculo,
                    estado: ultimo.estado === "En Taller" ? "En Taller" : "Presupuesto Pendiente",
                    fecha_ingreso: ultimo.creado_en,
                    mensaje: ultimo.mensaje || "Tu vehículo está siendo revisado.",
                    total_estimado: ultimo.total
                });
            }

        } catch (error) {
            console.error("Error cargando datos:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Cargando tu información...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-gray-400 font-sans">
            <div className="p-8 lg:p-16 max-w-7xl mx-auto">

                {/* Header */}
                <header className="flex justify-between items-center mb-16">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl italic">AJ</div>
                        <div>
                            <h1 className="text-5xl font-black italic text-white tracking-tighter">
                                Hola, {cliente?.nombre}
                            </h1>
                            <p className="text-blue-500 text-sm font-bold uppercase tracking-widest">Área de Cliente</p>
                        </div>
                    </div>

                    <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl transition-all">
                        <LogOut size={20} /> Cerrar Sesión
                    </button>
                </header>

                {/* Tabs */}
                <div className="flex gap-2 mb-12 bg-white/[0.03] p-1.5 rounded-3xl border border-white/5 w-fit">
                    {[
                        { key: "estado", label: "Estado de mi Vehículo" },
                        { key: "presupuestos", label: "Mis Presupuestos" },
                        { key: "facturas", label: "Mis Facturas" },
                        { key: "perfil", label: "Mi Perfil" }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setView(tab.key as any)}
                            className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all ${view === tab.key
                                ? "bg-blue-600 text-white shadow-lg"
                                : "text-gray-400 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ==================== ESTADO DEL VEHÍCULO ==================== */}
                {view === "estado" && (
                    <div className="bg-[#0f0f12] rounded-[40px] p-12 border border-white/5">
                        {presupuestos.length > 0 ? (
                            <>
                                <div className="flex items-center gap-4 mb-10">
                                    <Car size={48} className="text-blue-600" />
                                    <div>
                                        <h2 className="text-3xl font-black text-white">Estado de mi Vehículo</h2>
                                        <p className="text-gray-500">Información actual de tus vehículos</p>
                                    </div>
                                </div>

                                {presupuestos.map((p) => {
                                    const estadoLower = p.estado.toLowerCase();
                                    const isInTaller = estadoLower.includes("taller") ||
                                        estadoLower.includes("proceso") ||
                                        estadoLower.includes("ingres");

                                    const isAceptado = estadoLower.includes("aceptado");

                                    return (
                                        <div key={p.id} className={`mb-8 p-10 rounded-3xl border transition-all ${isInTaller
                                                ? 'border-green-500/50 bg-green-500/5'
                                                : isAceptado
                                                    ? 'border-blue-500/50 bg-blue-500/5'
                                                    : 'border-white/10'
                                            }`}>
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <p className="text-blue-400 font-mono">{p.vehiculo}</p>
                                                    <h3 className="text-2xl font-black text-white mt-1">Presupuesto #{p.id.slice(0, 8)}</h3>
                                                </div>

                                                <div className={`px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${isInTaller
                                                        ? "bg-green-500/20 text-green-400"
                                                        : isAceptado
                                                            ? "bg-blue-500/20 text-blue-400"
                                                            : "bg-gray-500/20 text-gray-400"
                                                    }`}>
                                                    {isInTaller && <Wrench size={20} />}
                                                    {p.estado}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                                                <div>
                                                    <p className="text-gray-500 text-xs mb-1">FECHA DE INGRESO</p>
                                                    <p className="font-medium text-white">
                                                        {new Date(p.creado_en).toLocaleDateString('es-ES', {
                                                            weekday: 'long',
                                                            day: 'numeric',
                                                            month: 'long'
                                                        })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-xs mb-1">TOTAL ESTIMADO</p>
                                                    <p className="text-2xl font-black text-white tracking-tighter">
                                                        {p.total ? p.total.toFixed(2) + " €" : "Pendiente"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-xs mb-1">ESTADO ACTUAL</p>
                                                    <p className={`font-bold ${isInTaller ? 'text-green-400' : 'text-white'}`}>
                                                        {isInTaller ? "En Taller" : p.estado}
                                                    </p>
                                                </div>
                                            </div>

                                            {p.mensaje && (
                                                <div className="mt-8 pt-6 border-t border-white/10 text-gray-300 italic">
                                                    "{p.mensaje}"
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </>
                        ) : (
                            <div className="text-center py-20">
                                <Car size={80} className="mx-auto mb-6 text-gray-600" />
                                <p className="text-2xl font-bold text-white mb-3">No tienes vehículos registrados</p>
                                <p className="text-gray-500">Cuando ingreses un vehículo al taller, aparecerá aquí su estado en tiempo real.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Otras vistas (por ahora vacías) */}
                {view === "presupuestos" && (
                    <div className="text-center py-20 text-gray-500">
                        Tus presupuestos aparecerán aquí
                    </div>
                )}

                {view === "facturas" && (
                    <div className="text-center py-20 text-gray-500">
                        Tus facturas aparecerán aquí
                    </div>
                )}

                {view === "perfil" && (
                    <div className="bg-[#0f0f12] rounded-[40px] p-12">
                        <h2 className="text-3xl font-black text-white mb-8">Mi Perfil</h2>
                        <div className="space-y-4 text-lg">
                            <p><strong>Nombre:</strong> {cliente?.nombre} {cliente?.apellido1}</p>
                            <p><strong>Email:</strong> {cliente?.email}</p>
                            <p><strong>Teléfono:</strong> {cliente?.telefono}</p>
                            <p><strong>DNI:</strong> {cliente?.documento_identidad}</p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}