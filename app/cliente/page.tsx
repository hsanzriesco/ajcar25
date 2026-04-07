"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Car, FileText, Clock, CheckCircle, AlertCircle,
    Download, LogOut, Wrench
} from "lucide-react";

interface Presupuesto {
    id: string;
    vehiculo: string;
    estado: string;
    total: number;
    creado_en: string;
    mensaje?: string;
}

interface Factura {
    id: string;
    vehiculo: string;
    total: number;
    fecha_emision: string;
    estado: string;
}

export default function ClientePage() {
    const [cliente, setCliente] = useState<any>(null);
    const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
    const [facturas, setFacturas] = useState<Factura[]>([]);   // ← Esta era la que faltaba
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

            if (!res.ok) throw new Error("Error al cargar datos");

            const data = await res.json();

            setCliente(data.cliente);
            setPresupuestos(data.presupuestos || []);
            setFacturas(data.facturas || []);        // ← Aquí asignamos las facturas

        } catch (error) {
            console.error("Error cargando datos del cliente:", error);
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

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl transition-all"
                    >
                        <LogOut size={20} /> Cerrar Sesión
                    </button>
                </header>

                {/* Tabs */}
                <div className="flex gap-2 mb-12 bg-white/[0.03] p-1.5 rounded-3xl border border-white/5 w-fit">
                    {[
                        { key: "estado", label: "Estado de mi Vehículo" },
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

                {/* ESTADO DEL VEHÍCULO */}
                {view === "estado" && (
                    <div className="bg-[#0f0f12] rounded-[40px] p-12 border border-white/5">
                        {presupuestos.length > 0 ? (
                            <>
                                <div className="flex items-center gap-4 mb-10">
                                    <Car size={48} className="text-blue-600" />
                                    <div>
                                        <h2 className="text-3xl font-black text-white">Estado de mi Vehículo</h2>
                                        <p className="text-gray-500">Última intervención</p>
                                    </div>
                                </div>

                                {presupuestos.map((p) => {
                                    const estadoLower = (p.estado || "").toLowerCase();
                                    const isInTaller = estadoLower.includes("taller");

                                    return (
                                        <div key={p.id} className={`mb-8 p-10 rounded-3xl border ${isInTaller ? 'border-green-500/50 bg-green-500/10' : 'border-white/10'
                                            }`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-blue-400 font-mono">{p.vehiculo}</p>
                                                    <h3 className="text-2xl font-black text-white mt-2">Presupuesto #{p.id.slice(0, 8)}</h3>
                                                </div>
                                                <div className={`px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest ${isInTaller ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300"
                                                    }`}>
                                                    {p.estado}
                                                </div>
                                            </div>

                                            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">FECHA</p>
                                                    <p className="text-white font-medium">
                                                        {new Date(p.creado_en).toLocaleDateString('es-ES')}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">TOTAL</p>
                                                    <p className="text-3xl font-black text-white tracking-tighter">
                                                        {p.total ? p.total.toFixed(2) + " €" : "Pendiente"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">ESTADO</p>
                                                    <p className={`text-lg font-bold ${isInTaller ? 'text-green-400' : 'text-white'}`}>
                                                        {p.estado}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        ) : (
                            <div className="text-center py-20">
                                <Car size={80} className="mx-auto mb-6 text-gray-600" />
                                <p className="text-2xl font-bold text-white">No tienes vehículos en proceso</p>
                            </div>
                        )}
                    </div>
                )}

                {view === "facturas" && (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-black text-white mb-8">Mis Facturas</h2>

                        {facturas.length > 0 ? (
                            facturas.map((f) => (
                                <div key={f.id} className="bg-[#0f0f12] p-10 rounded-[40px] border border-white/5 hover:border-green-500/30 transition-all flex flex-col md:flex-row justify-between gap-8 items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-green-600/20 rounded-2xl flex items-center justify-center">
                                                <FileText size={28} className="text-green-500" />
                                            </div>
                                            <div>
                                                <p className="text-green-400 font-mono text-sm">Factura #{f.id}</p>
                                                <h3 className="text-xl font-bold text-white mt-1">{f.vehiculo}</h3>
                                            </div>
                                        </div>
                                        <p className="text-gray-500 mt-4">
                                            Fecha: {new Date(f.fecha_emision).toLocaleDateString('es-ES')}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-4xl font-black text-white tracking-tighter">
                                            {Number(f.total).toFixed(2)}€
                                        </p>
                                        <button
                                            onClick={() => window.open(`/api/pdf/factura/${f.id}`, "_blank")}
                                            className="mt-6 bg-white text-black px-8 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all flex items-center gap-2"
                                        >
                                            <Download size={18} /> Descargar Factura PDF
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-[#0f0f12] rounded-[40px] p-16 text-center border border-white/5">
                                <FileText size={80} className="mx-auto mb-6 text-gray-600" />
                                <p className="text-2xl font-bold text-white mb-3">Aún no tienes facturas</p>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    Cuando el taller facture uno de tus vehículos, la factura aparecerá aquí automáticamente.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Otras vistas */}
                {view === "perfil" && (
                    <div className="bg-[#0f0f12] rounded-[40px] p-12">
                        <h2 className="text-3xl font-black text-white mb-8">Mi Perfil</h2>
                        <div className="space-y-4">
                            <p><strong>Nombre:</strong> {cliente?.nombre} {cliente?.apellido1}</p>
                            <p><strong>Email:</strong> {cliente?.email}</p>
                            <p><strong>Teléfono:</strong> {cliente?.telefono}</p>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}