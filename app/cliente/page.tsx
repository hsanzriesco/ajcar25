"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Car, FileText, LogOut, Wrench, Download
} from "lucide-react";

interface Presupuesto {
    id: string;
    vehiculo: string;
    estado: string;
    total: number;
    creado_en: string;
    mensaje?: string;
    fecha_cita?: string;
    hora_cita?: string;
    motivo_cancelacion?: string;
}

interface Factura {
    id: string;
    vehiculo: string;
    total: number;
    creado_en: string;
    fecha_emision?: string;
    estado: string;
    numero_factura?: string;
}

export default function ClientePage() {
    const [cliente, setCliente] = useState<any>(null);
    const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"estado" | "facturas" | "perfil">("estado");

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
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detalle || `Error HTTP ${res.status}`);
            }

            const data = await res.json();

            setCliente(data.cliente);
            setPresupuestos(data.presupuestos || []);
            setFacturas(data.facturas || []);

        } catch (error: any) {
            console.error("Error cargando datos del cliente:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        router.push("/login");
    };

    // Función para descargar factura usando tu API existente
    const descargarFactura = (facturaId: string) => {
        // Llamada a tu ruta /api/facturas con el ID
        window.open(`/api/facturas/${facturaId}`, "_blank");
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
                            <p className="text-blue-500 text-sm font-bold uppercase tracking-widest">ÁREA DE CLIENTE</p>
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
                            className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all ${
                                view === tab.key
                                    ? "bg-blue-600 text-white shadow-lg"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ====================== ESTADO DE MIS VEHÍCULOS ====================== */}
                {view === "estado" && (
                    <div className="space-y-8">
                        <h2 className="text-4xl font-black text-white mb-10">Estado de mis Vehículos</h2>

                        {presupuestos.length > 0 ? (
                            presupuestos.map((p) => {
                                const estadoLower = (p.estado || "").toLowerCase().trim();
                                const estaEnTaller = estadoLower.includes("taller") || estadoLower === "en taller";
                                const estaCancelado = estadoLower === "cancelado";

                                let estadoColor = "bg-gray-600 text-white";
                                let estadoTexto = p.estado || "Pendiente";

                                if (estaEnTaller) {
                                    estadoColor = "bg-orange-600 text-white";
                                    estadoTexto = "En Taller";
                                } else if (estaCancelado) {
                                    estadoColor = "bg-red-600 text-white";
                                    estadoTexto = "Cancelado";
                                }

                                const totalFormateado = (p.total != null && !isNaN(Number(p.total)))
                                    ? `${Number(p.total).toFixed(2)} €`
                                    : "Pendiente";

                                return (
                                    <div
                                        key={p.id}
                                        className={`bg-[#0f0f12] border rounded-[40px] p-12 transition-all ${
                                            estaEnTaller 
                                                ? "border-orange-500/50 bg-orange-500/5" 
                                                : estaCancelado 
                                                ? "border-red-500/50 bg-red-500/5" 
                                                : "border-white/10"
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-10">
                                            <div>
                                                <p className="uppercase text-xs tracking-widest text-gray-500 mb-2">Mi vehículo</p>
                                                <h3 className="text-3xl font-black text-white">{p.vehiculo}</h3>
                                            </div>
                                            <div className={`px-8 py-3 rounded-full font-bold uppercase tracking-widest text-sm ${estadoColor}`}>
                                                {estadoTexto}
                                            </div>
                                        </div>

                                        {estaEnTaller && (
                                            <div className="mb-10 bg-orange-500/10 border border-orange-500/30 rounded-3xl p-10">
                                                <div className="flex items-center gap-5 mb-6">
                                                    <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                                                        <Wrench size={32} className="text-orange-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-orange-400 font-black text-xl">Tu vehículo está en taller</p>
                                                        <p className="text-gray-400 mt-1">Estamos trabajando en él</p>
                                                    </div>
                                                </div>
                                                {p.mensaje && (
                                                    <div className="italic text-gray-300 border-l-4 border-orange-500 pl-6 py-1">
                                                        "{p.mensaje}"
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {estaCancelado && p.motivo_cancelacion && (
                                            <div className="mb-10 bg-red-500/10 border border-red-500/30 rounded-3xl p-10">
                                                <p className="text-red-400 font-bold mb-2">Motivo de cancelación:</p>
                                                <p className="text-gray-300 italic">"{p.motivo_cancelacion}"</p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div>
                                                <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Fecha de solicitud</p>
                                                <p className="text-white font-medium text-lg">
                                                    {new Date(p.creado_en).toLocaleDateString('es-ES')}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Importe estimado</p>
                                                <p className="text-3xl font-black text-white tracking-tighter">
                                                    {totalFormateado}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="bg-[#0f0f12] rounded-[40px] p-20 text-center border border-white/5">
                                <Car size={90} className="mx-auto mb-8 text-gray-600" />
                                <p className="text-3xl font-black text-white mb-4">No tienes vehículos activos en taller</p>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    Cuando envíes un presupuesto y sea aceptado, podrás ver aquí el estado en tiempo real.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ====================== MIS FACTURAS ====================== */}
                {view === "facturas" && (
                    <div className="space-y-6">
                        <h2 className="text-4xl font-black text-white mb-10">Mis Facturas</h2>

                        {facturas.length > 0 ? (
                            facturas.map((f) => (
                                <div 
                                    key={f.id} 
                                    className="bg-[#0f0f12] p-10 rounded-[40px] border border-green-500/30 hover:border-green-500/50 transition-all flex flex-col md:flex-row justify-between gap-8 items-start"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-green-600/20 rounded-2xl flex items-center justify-center">
                                                <FileText size={28} className="text-green-500" />
                                            </div>
                                            <div>
                                                <p className="text-green-400 font-mono text-sm">
                                                    Factura #{f.numero_factura || f.id.slice(0, 8)}
                                                </p>
                                                <h3 className="text-xl font-bold text-white mt-1">{f.vehiculo}</h3>
                                            </div>
                                        </div>
                                        <p className="text-gray-500 mt-4">
                                            Fecha: {new Date(f.creado_en || f.fecha_emision || Date.now()).toLocaleDateString('es-ES')}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-4xl font-black text-green-400 tracking-tighter">
                                            {Number(f.total).toFixed(2)} €
                                        </p>
                                        <button
                                            onClick={() => descargarFactura(f.id)}
                                            className="mt-6 bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2"
                                        >
                                            <Download size={18} /> Descargar Factura PDF
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-[#0f0f12] rounded-[40px] p-20 text-center border border-white/5">
                                <FileText size={80} className="mx-auto mb-6 text-gray-600" />
                                <p className="text-2xl font-bold text-white mb-3">Aún no tienes facturas</p>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    Cuando el taller complete y facture un mantenimiento, aparecerá aquí automáticamente.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ====================== MI PERFIL ====================== */}
                {view === "perfil" && (
                    <div className="bg-[#0f0f12] rounded-[40px] p-12 border border-white/5">
                        <h2 className="text-3xl font-black text-white mb-8">Mi Perfil</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-lg">
                            <div>
                                <p className="text-gray-500 text-sm mb-1">Nombre</p>
                                <p className="text-white font-medium">
                                    {cliente?.nombre} {cliente?.apellido || cliente?.apellido1}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm mb-1">Email</p>
                                <p className="text-white font-medium">{cliente?.email}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm mb-1">Teléfono</p>
                                <p className="text-white font-medium">{cliente?.telefono}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm mb-1">Tipo de cliente</p>
                                <p className="text-white font-medium capitalize">
                                    {cliente?.tipo_cliente || "Particular"}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}