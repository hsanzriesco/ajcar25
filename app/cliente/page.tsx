"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Car, FileText, LogOut, Wrench, Download, Pencil, Check, X, KeyRound, Eye, EyeOff, AlertTriangle
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

// ====================== SUBCOMPONENTES ======================

const ModalConfirmar = ({ titulo, mensaje, detalle, onConfirmar, onCerrar, guardando, colorBoton = "bg-blue-600 hover:bg-blue-700" }: {
    titulo: string; mensaje: string; detalle?: string;
    onConfirmar: () => void; onCerrar: () => void;
    guardando?: boolean; colorBoton?: string;
}) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[#0f0f12] border border-white/10 rounded-[30px] sm:rounded-[40px] p-6 sm:p-10 w-full max-w-md">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={20} className="text-yellow-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">{titulo}</h3>
            </div>
            <p className="text-gray-300 text-sm mb-2">{mensaje}</p>
            {detalle && <p className="text-gray-500 text-xs">{detalle}</p>}
            <div className="flex gap-3 mt-8">
                <button onClick={onCerrar} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 py-3 rounded-xl font-bold transition-all">
                    Cancelar
                </button>
                <button onClick={onConfirmar} disabled={guardando}
                    className={`flex-1 ${colorBoton} disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2`}>
                    <Check size={16} /> {guardando ? "Procesando..." : "Confirmar"}
                </button>
            </div>
        </div>
    </div>
);

const ModalAlerta = ({ mensaje, onCerrar }: { mensaje: string; onCerrar: () => void }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="bg-[#0f0f12] border border-white/10 rounded-[30px] sm:rounded-[40px] p-6 sm:p-10 w-full max-w-md">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={20} className="text-red-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">Aviso</h3>
            </div>
            <p className="text-gray-300 text-sm mb-8">{mensaje}</p>
            <button onClick={onCerrar} className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold transition-all">
                Entendido
            </button>
        </div>
    </div>
);

const CampoPassword = ({ label, value, onChange, ver, setVer }: {
    label: string; value: string; onChange: (v: string) => void; ver: boolean; setVer: (v: boolean) => void;
}) => (
    <div>
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">{label}</p>
        <div className="relative">
            <input type={ver ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-blue-500" />
            <button type="button" onClick={() => setVer(!ver)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                {ver ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    </div>
);

const CampoSoloLectura = ({ label, valor, nota }: { label: string; valor: string; nota?: string }) => (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 sm:p-6">
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">{label}</p>
        <p className="text-white font-medium mt-1 capitalize break-all">{valor || "—"}</p>
        {nota && <p className="text-gray-600 text-xs mt-2">{nota}</p>}
    </div>
);

const CampoEditable = ({ label, campo, valor, editando, valorEdit, guardando, onEditar, onCancelar, onGuardar, onCambio }: {
    label: string; campo: string; valor: string;
    editando: string | null; valorEdit: string; guardando: boolean;
    onEditar: (campo: string, valor: string) => void;
    onCancelar: () => void;
    onGuardar: (campo: string) => void;
    onCambio: (v: string) => void;
}) => {
    const esteEditando = editando === campo;
    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 sm:p-6 transition-all hover:border-white/10">
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">{label}</p>
            {esteEditando ? (
                <div className="flex items-center gap-2 mt-1">
                    <input type="text" value={valorEdit} onChange={(e) => onCambio(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") onGuardar(campo); if (e.key === "Escape") onCancelar(); }}
                        autoFocus className="flex-1 bg-white/5 border border-blue-500/50 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 min-w-0" />
                    <button onClick={() => onGuardar(campo)} disabled={guardando}
                        className="w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0">
                        <Check size={16} />
                    </button>
                    <button onClick={onCancelar}
                        className="w-9 h-9 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl flex items-center justify-center transition-all flex-shrink-0">
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-between gap-4 mt-1">
                    <p className="text-white font-medium break-all">{valor || "—"}</p>
                    <button onClick={() => onEditar(campo, valor)}
                        className="w-8 h-8 bg-white/5 hover:bg-blue-500/20 text-gray-500 hover:text-blue-400 rounded-xl flex items-center justify-center transition-all flex-shrink-0">
                        <Pencil size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

const requisitosPassword = [
    { regex: /.{6,}/, label: "Mínimo 6 caracteres" },
    { regex: /[a-z]/, label: "Una letra minúscula" },
    { regex: /[A-Z]/, label: "Una letra mayúscula" },
    { regex: /[0-9]/, label: "Un número" },
    { regex: /[^a-zA-Z0-9]/, label: "Un carácter especial (!@#$...)" },
];

const IndicadorPassword = ({ password }: { password: string }) => {
    if (!password) return null;
    return (
        <div className="grid grid-cols-1 gap-1.5 mt-2">
            {requisitosPassword.map((r) => {
                const cumple = r.regex.test(password);
                return (
                    <div key={r.label} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${cumple ? "bg-green-500" : "bg-white/10"}`}>
                            {cumple && <Check size={10} className="text-white" />}
                        </div>
                        <span className={`text-xs transition-colors ${cumple ? "text-green-400" : "text-gray-500"}`}>{r.label}</span>
                    </div>
                );
            })}
        </div>
    );
};

// ====================== COMPONENTE PRINCIPAL ======================

export default function ClientePage() {
    const [cliente, setCliente] = useState<any>(null);
    const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"estado" | "facturas" | "cancelados" | "perfil">("estado");

    const [editando, setEditando] = useState<string | null>(null);
    const [valorEdit, setValorEdit] = useState<string>("");
    const [guardando, setGuardando] = useState(false);

    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [passwordActual, setPasswordActual] = useState("");
    const [passwordNueva, setPasswordNueva] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [guardandoPassword, setGuardandoPassword] = useState(false);
    const [errorPassword, setErrorPassword] = useState("");
    const [okPassword, setOkPassword] = useState(false);

    const [verActual, setVerActual] = useState(false);
    const [verNueva, setVerNueva] = useState(false);
    const [verConfirm, setVerConfirm] = useState(false);

    const [alerta, setAlerta] = useState<string | null>(null);
    const mostrarAlerta = (msg: string) => setAlerta(msg);
    const [confirmLogout, setConfirmLogout] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const userId = sessionStorage.getItem("user_id");
        const role = sessionStorage.getItem("user_role");
        if (!userId || role?.toLowerCase() !== "cliente") { router.push("/login"); return; }
        cargarDatosCliente(userId);

        // ✅ Refresco automático cada 15 segundos sin mostrar spinner
        const intervalo = setInterval(async () => {
            try {
                const res = await fetch(`/api/cliente/${userId}`);
                if (!res.ok) return;
                const data = await res.json();
                setCliente(data.cliente);
                setPresupuestos(data.presupuestos || []);
                setFacturas(data.facturas || []);
            } catch { /* silencioso */ }
        }, 15000);

        return () => clearInterval(intervalo);
    }, [router]);

    const cargarDatosCliente = async (userId: string) => {
        try {
            const res = await fetch(`/api/cliente/${userId}`);
            if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detalle || `Error HTTP ${res.status}`); }
            const data = await res.json();
            setCliente(data.cliente);
            setPresupuestos(data.presupuestos || []);
            setFacturas(data.facturas || []);
        } catch (error: any) { console.error("Error cargando datos del cliente:", error); }
        finally { setLoading(false); }
    };

    const handleLogout = () => { sessionStorage.clear(); router.push("/login"); };
    const iniciarEdicion = (campo: string, valorActual: string) => { setEditando(campo); setValorEdit(valorActual || ""); };
    const cancelarEdicion = () => { setEditando(null); setValorEdit(""); };

    const guardarCampo = async (campo: string) => {
        const userId = sessionStorage.getItem("user_id");
        if (!userId) return;
        setGuardando(true);
        try {
            const res = await fetch(`/api/cliente/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [campo]: valorEdit }) });
            if (!res.ok) throw new Error("Error al guardar");
            setCliente((prev: any) => ({ ...prev, [campo]: valorEdit }));
            setEditando(null); setValorEdit("");
        } catch { mostrarAlerta("No se pudo guardar el cambio. Inténtalo de nuevo."); }
        finally { setGuardando(false); }
    };

    const guardarPassword = async () => {
        setErrorPassword(""); setOkPassword(false);
        if (!passwordActual || !passwordNueva || !passwordConfirm) { setErrorPassword("Rellena todos los campos."); return; }
        if (passwordNueva !== passwordConfirm) { setErrorPassword("Las contraseñas nuevas no coinciden."); return; }
        const fallida = requisitosPassword.find(r => !r.regex.test(passwordNueva));
        if (fallida) { setErrorPassword(`La contraseña no cumple: ${fallida.label.toLowerCase()}`); return; }
        setConfirmPassword(true);
    };

    const ejecutarGuardarPassword = async () => {
        setConfirmPassword(false);
        const userId = sessionStorage.getItem("user_id");
        if (!userId) return;
        setGuardandoPassword(true);
        try {
            const res = await fetch(`/api/cliente/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password_actual: passwordActual, password_nueva: passwordNueva }) });
            const data = await res.json();
            if (!res.ok) { setErrorPassword(data.error || "Error al cambiar la contraseña."); return; }
            setOkPassword(true);
            setPasswordActual(""); setPasswordNueva(""); setPasswordConfirm("");
            setVerActual(false); setVerNueva(false); setVerConfirm(false);
            setTimeout(() => { setMostrarPassword(false); setOkPassword(false); }, 2000);
        } catch { mostrarAlerta("No se pudo guardar. Inténtalo de nuevo."); }
        finally { setGuardandoPassword(false); }
    };

    const descargarFactura = (factura: any) => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            doc.setFillColor(17, 24, 39); doc.rect(0, 0, pageWidth, 55, "F");
            doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(26);
            doc.text("AJCAR 25 - FACTURA", pageWidth / 2, 35, { align: "center" });
            doc.setFontSize(10); doc.setTextColor(0);
            doc.text(`Nº: ${factura.numero_factura || "N/A"}`, 20, 70);
            doc.text(`Fecha: ${new Date().toLocaleDateString("es-ES")}`, pageWidth - 20, 70, { align: "right" });
            let y = 85;
            doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("DATOS DEL CLIENTE:", 20, y); y += 10;
            doc.setFont("helvetica", "normal"); doc.setFontSize(10);
            doc.text(`Cliente: ${factura.cliente_nombre || "Sin nombre"}`, 20, y); y += 7;
            doc.text(`Vehículo: ${factura.vehiculo || "—"}`, 20, y); y += 15;
            let articulos = [];
            if (factura.articulos) { articulos = Array.isArray(factura.articulos) ? factura.articulos : JSON.parse(factura.articulos || "[]"); }
            if (articulos.length > 0) {
                const tableBody = articulos.filter((art: any) => art && (art.descripcion || art.nombre)).map((art: any) => [
                    art.descripcion || art.nombre || "Servicio", String(Number(art.cantidad) || 1),
                    `${Number(art.precio_unitario || art.precio || 0).toFixed(2)}€`,
                    `${(Number(art.cantidad || 1) * Number(art.precio_unitario || art.precio || 0)).toFixed(2)}€`,
                ]);
                autoTable(doc, { startY: y, head: [["DESCRIPCIÓN", "CANT.", "PRECIO UN.", "TOTAL"]], body: tableBody, theme: "grid",
                    headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: "bold" }, styles: { fontSize: 9.5, cellPadding: 6 },
                    columnStyles: { 0: { halign: "left", cellWidth: 95 }, 1: { halign: "center", cellWidth: 22 }, 2: { halign: "right", cellWidth: 35 }, 3: { halign: "right", cellWidth: 35 } } });
            } else { doc.text("No hay artículos registrados en esta factura.", 20, y + 10); }
            const finalY = (doc as any).lastAutoTable?.finalY || y + 40;
            doc.setFillColor(37, 99, 235); doc.rect(20, finalY, pageWidth - 40, 20, "F");
            doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(14);
            doc.text("TOTAL FACTURA", 25, finalY + 13);
            doc.text(`${Number(factura.total || 0).toFixed(2)}€`, pageWidth - 25, finalY + 13, { align: "right" });
            doc.setTextColor(100); doc.setFontSize(10);
            doc.text("Gracias por confiar en AJCAR 25", pageWidth / 2, finalY + 45, { align: "center" });
            doc.save(`Factura_${factura.numero_factura || factura.id}.pdf`);
        } catch (error) { console.error(error); mostrarAlerta("Error al generar el PDF."); }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Cargando tu información...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-gray-400 font-sans">
            <div className="p-4 sm:p-8 lg:p-16 max-w-7xl mx-auto">

                {/* Header */}
                <header className="flex justify-between items-center mb-8 sm:mb-16 gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <img src="/imagenes/logo_ajcar25.png" alt="AJCAR 25" className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl object-contain flex-shrink-0" />
                        <div className="min-w-0">
                            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black italic text-white tracking-tighter truncate">
                                Hola, {cliente?.nombre}
                            </h1>
                            <p className="text-blue-500 text-xs sm:text-sm font-bold uppercase tracking-widest">ÁREA DE CLIENTE</p>
                        </div>
                    </div>
                    <button onClick={() => setConfirmLogout(true)}
                        className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl transition-all flex-shrink-0 text-sm">
                        <LogOut size={18} /> <span className="hidden sm:inline">Cerrar Sesión</span>
                    </button>
                </header>

                {/* Tabs */}
                <div className="flex flex-wrap gap-1 sm:gap-2 mb-8 sm:mb-12 bg-white/[0.03] p-1 sm:p-1.5 rounded-2xl sm:rounded-3xl border border-white/5 w-full sm:w-fit">
                    {([
                        { key: "estado", label: "Estado" },
                        { key: "facturas", label: "Facturas" },
                        { key: "cancelados", label: "Cancelados" },
                        { key: "perfil", label: "Perfil" }
                    ] as { key: "estado" | "facturas" | "cancelados" | "perfil", label: string }[]).map((tab) => (
                        <button key={tab.key} onClick={() => setView(tab.key)}
                            className={`flex-1 sm:flex-none px-3 sm:px-8 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all ${view === tab.key ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ESTADO */}
                {view === "estado" && (
                    <div className="space-y-6 sm:space-y-8">
                        <h2 className="text-2xl sm:text-4xl font-black text-white mb-6 sm:mb-10">Estado de mis Vehículos</h2>
                        {presupuestos.filter(p => p.estado?.toLowerCase() !== "cancelado").length > 0 ? (
                            presupuestos.filter(p => p.estado?.toLowerCase() !== "cancelado").map((p) => {
                                const estadoLower = (p.estado || "").toLowerCase().trim();
                                const estaEnTaller = estadoLower.includes("taller") || estadoLower === "en taller";
                                let estadoColor = "bg-gray-600 text-white";
                                let estadoTexto = p.estado || "Pendiente";
                                if (estaEnTaller) { estadoColor = "bg-orange-600 text-white"; estadoTexto = "En Taller"; }
                                const totalFormateado = (p.total != null && !isNaN(Number(p.total))) ? `${Number(p.total).toFixed(2)} €` : "Pendiente";
                                return (
                                    <div key={p.id} className={`bg-[#0f0f12] border rounded-[24px] sm:rounded-[40px] p-6 sm:p-12 transition-all ${estaEnTaller ? "border-orange-500/50 bg-orange-500/5" : "border-white/10"}`}>
                                        <div className="flex justify-between items-start gap-4 mb-6 sm:mb-10">
                                            <div className="min-w-0">
                                                <p className="uppercase text-xs tracking-widest text-gray-500 mb-1 sm:mb-2">Mi vehículo</p>
                                                <h3 className="text-xl sm:text-3xl font-black text-white truncate">{p.vehiculo}</h3>
                                            </div>
                                            <div className={`px-3 sm:px-8 py-2 sm:py-3 rounded-full font-bold uppercase tracking-widest text-xs sm:text-sm flex-shrink-0 ${estadoColor}`}>{estadoTexto}</div>
                                        </div>
                                        {estaEnTaller && (
                                            <div className="mb-6 sm:mb-10 bg-orange-500/10 border border-orange-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-10">
                                                <div className="flex items-center gap-4 sm:gap-5 mb-4 sm:mb-6">
                                                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                                                        <Wrench size={24} className="text-orange-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-orange-400 font-black text-base sm:text-xl">Tu vehículo está en taller</p>
                                                        <p className="text-gray-400 mt-1 text-sm">Estamos trabajando en él</p>
                                                    </div>
                                                </div>
                                                {p.mensaje && <div className="italic text-gray-300 border-l-4 border-orange-500 pl-4 sm:pl-6 py-1 text-sm">"{p.mensaje}"</div>}
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                                            <div>
                                                <p className="text-xs uppercase tracking-widest text-gray-500 mb-1 sm:mb-2">Fecha de solicitud</p>
                                                <p className="text-white font-medium text-base sm:text-lg">{new Date(p.creado_en).toLocaleDateString('es-ES')}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase tracking-widest text-gray-500 mb-1 sm:mb-2">Importe estimado</p>
                                                <p className="text-2xl sm:text-3xl font-black text-white tracking-tighter">{totalFormateado}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="bg-[#0f0f12] rounded-[24px] sm:rounded-[40px] p-12 sm:p-20 text-center border border-white/5">
                                <Car size={60} className="mx-auto mb-6 sm:mb-8 text-gray-600" />
                                <p className="text-xl sm:text-3xl font-black text-white mb-3 sm:mb-4">No tienes vehículos activos en taller</p>
                                <p className="text-gray-500 max-w-md mx-auto text-sm">Cuando envíes un presupuesto y sea aceptado, podrás ver aquí el estado en tiempo real.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* FACTURAS */}
                {view === "facturas" && (
                    <div className="space-y-4 sm:space-y-6">
                        <h2 className="text-2xl sm:text-4xl font-black text-white mb-6 sm:mb-10">Mis Facturas</h2>
                        {facturas.length > 0 ? facturas.map((f) => (
                            <div key={f.id} className="bg-[#0f0f12] p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] border border-green-500/30 hover:border-green-500/50 transition-all flex flex-col sm:flex-row justify-between gap-6 items-start">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                                            <FileText size={22} className="text-green-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-green-400 font-mono text-xs sm:text-sm">Factura #{f.numero_factura || f.id.slice(0, 8)}</p>
                                            <h3 className="text-lg sm:text-xl font-bold text-white mt-1 truncate">{f.vehiculo}</h3>
                                        </div>
                                    </div>
                                    <p className="text-gray-500 mt-3 sm:mt-4 text-sm">Fecha: {new Date(f.creado_en || f.fecha_emision || Date.now()).toLocaleDateString('es-ES')}</p>
                                </div>
                                <div className="w-full sm:w-auto sm:text-right">
                                    <p className="text-3xl sm:text-4xl font-black text-green-400 tracking-tighter">{Number(f.total).toFixed(2)} €</p>
                                    <button onClick={() => descargarFactura(f)} className="mt-4 sm:mt-6 w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-sm">
                                        <Download size={16} /> Descargar PDF
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-[#0f0f12] rounded-[24px] sm:rounded-[40px] p-12 sm:p-20 text-center border border-white/5">
                                <FileText size={60} className="mx-auto mb-6 text-gray-600" />
                                <p className="text-xl sm:text-2xl font-bold text-white mb-3">Aún no tienes facturas</p>
                                <p className="text-gray-500 max-w-md mx-auto text-sm">Cuando el taller complete y facture un mantenimiento, aparecerá aquí automáticamente.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* CANCELADOS */}
                {view === "cancelados" && (
                    <div className="space-y-6 sm:space-y-8">
                        <h2 className="text-2xl sm:text-4xl font-black text-white mb-6 sm:mb-10">Mantenimientos Cancelados</h2>
                        {presupuestos.filter(p => p.estado?.toLowerCase() === "cancelado").length > 0 ? (
                            presupuestos.filter(p => p.estado?.toLowerCase() === "cancelado").map((p) => {
                                const totalFormateado = (p.total != null && !isNaN(Number(p.total))) ? `${Number(p.total).toFixed(2)} €` : "—";
                                return (
                                    <div key={p.id} className="bg-[#0f0f12] border border-red-500/30 bg-red-500/5 rounded-[24px] sm:rounded-[40px] p-6 sm:p-12 transition-all">
                                        <div className="flex justify-between items-start gap-4 mb-6 sm:mb-10">
                                            <div className="min-w-0">
                                                <p className="uppercase text-xs tracking-widest text-gray-500 mb-1 sm:mb-2">Vehículo</p>
                                                <h3 className="text-xl sm:text-3xl font-black text-white truncate">{p.vehiculo}</h3>
                                            </div>
                                            <div className="px-3 sm:px-8 py-2 sm:py-3 rounded-full font-bold uppercase tracking-widest text-xs sm:text-sm bg-red-600 text-white flex-shrink-0">Cancelado</div>
                                        </div>
                                        {p.motivo_cancelacion && (
                                            <div className="mb-6 sm:mb-10 bg-red-500/10 border border-red-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-10">
                                                <p className="text-red-400 font-bold mb-2 text-sm">Motivo de cancelación:</p>
                                                <p className="text-gray-300 italic text-sm">"{p.motivo_cancelacion}"</p>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                                            <div>
                                                <p className="text-xs uppercase tracking-widest text-gray-500 mb-1 sm:mb-2">Fecha de solicitud</p>
                                                <p className="text-white font-medium text-base sm:text-lg">{new Date(p.creado_en).toLocaleDateString('es-ES')}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase tracking-widest text-gray-500 mb-1 sm:mb-2">Importe estimado</p>
                                                <p className="text-2xl sm:text-3xl font-black text-white tracking-tighter">{totalFormateado}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="bg-[#0f0f12] rounded-[24px] sm:rounded-[40px] p-12 sm:p-20 text-center border border-white/5">
                                <Car size={60} className="mx-auto mb-6 sm:mb-8 text-gray-600" />
                                <p className="text-xl sm:text-3xl font-black text-white mb-3 sm:mb-4">No tienes mantenimientos cancelados</p>
                                <p className="text-gray-500 max-w-md mx-auto text-sm">Si algún servicio es cancelado, aparecerá aquí con el motivo.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* MI PERFIL */}
                {view === "perfil" && (
                    <div className="space-y-4 sm:space-y-6">
                        <div className="bg-[#0f0f12] rounded-[24px] sm:rounded-[40px] p-6 sm:p-12 border border-white/5">
                            <h2 className="text-2xl sm:text-3xl font-black text-white mb-6 sm:mb-8">Mi Perfil</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <CampoEditable label="Nombre" campo="nombre" valor={cliente?.nombre || ""}
                                    editando={editando} valorEdit={valorEdit} guardando={guardando}
                                    onEditar={iniciarEdicion} onCancelar={cancelarEdicion}
                                    onGuardar={guardarCampo} onCambio={setValorEdit} />
                                <CampoSoloLectura label="Email" valor={cliente?.email || ""} nota="El email no se puede modificar" />
                                <CampoEditable label="Primer Apellido" campo="apellido1" valor={cliente?.apellido1 || ""}
                                    editando={editando} valorEdit={valorEdit} guardando={guardando}
                                    onEditar={iniciarEdicion} onCancelar={cancelarEdicion}
                                    onGuardar={guardarCampo} onCambio={setValorEdit} />
                                <CampoEditable label="Segundo Apellido" campo="apellido2" valor={cliente?.apellido2 || ""}
                                    editando={editando} valorEdit={valorEdit} guardando={guardando}
                                    onEditar={iniciarEdicion} onCancelar={cancelarEdicion}
                                    onGuardar={guardarCampo} onCambio={setValorEdit} />
                                <CampoEditable label="Teléfono" campo="telefono" valor={cliente?.telefono || ""}
                                    editando={editando} valorEdit={valorEdit} guardando={guardando}
                                    onEditar={iniciarEdicion} onCancelar={cancelarEdicion}
                                    onGuardar={guardarCampo} onCambio={setValorEdit} />
                            </div>
                        </div>

                        {/* CAMBIO DE CONTRASEÑA */}
                        <div className="bg-[#0f0f12] rounded-[24px] sm:rounded-[40px] p-6 sm:p-12 border border-white/5">
                            <div className="flex items-center justify-between mb-5 sm:mb-6 gap-4">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <KeyRound size={18} className="text-blue-400" />
                                    </div>
                                    <h3 className="text-base sm:text-xl font-black text-white">Cambiar Contraseña</h3>
                                </div>
                                <button onClick={() => { setMostrarPassword(!mostrarPassword); setErrorPassword(""); setOkPassword(false); setVerActual(false); setVerNueva(false); setVerConfirm(false); setPasswordActual(""); setPasswordNueva(""); setPasswordConfirm(""); }}
                                    className="px-4 sm:px-5 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs sm:text-sm font-medium transition-all flex-shrink-0">
                                    {mostrarPassword ? "Cancelar" : "Modificar"}
                                </button>
                            </div>
                            {mostrarPassword && (
                                <div className="space-y-4 mt-4">
                                    <CampoPassword label="Contraseña actual" value={passwordActual} onChange={setPasswordActual} ver={verActual} setVer={setVerActual} />
                                    <div>
                                        <CampoPassword label="Nueva contraseña" value={passwordNueva} onChange={setPasswordNueva} ver={verNueva} setVer={setVerNueva} />
                                        <IndicadorPassword password={passwordNueva} />
                                    </div>
                                    <CampoPassword label="Confirmar nueva contraseña" value={passwordConfirm} onChange={setPasswordConfirm} ver={verConfirm} setVer={setVerConfirm} />
                                    {errorPassword && <p className="text-red-400 text-sm">{errorPassword}</p>}
                                    {okPassword && <p className="text-green-400 text-sm">✓ Contraseña actualizada correctamente</p>}
                                    <button onClick={guardarPassword} disabled={guardandoPassword}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all mt-2 text-sm">
                                        {guardandoPassword ? "Guardando..." : "Guardar nueva contraseña"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {confirmLogout && (
                <ModalConfirmar titulo="Cerrar Sesión" mensaje="¿Estás seguro de que quieres cerrar sesión?" detalle="Tendrás que volver a introducir tus credenciales para acceder."
                    onConfirmar={() => { setConfirmLogout(false); handleLogout(); }} onCerrar={() => setConfirmLogout(false)} colorBoton="bg-red-600 hover:bg-red-700" />
            )}
            {confirmPassword && (
                <ModalConfirmar titulo="Cambiar Contraseña" mensaje="¿Estás seguro de que quieres cambiar tu contraseña?" detalle="Esta acción actualizará tus credenciales de acceso."
                    onConfirmar={ejecutarGuardarPassword} onCerrar={() => setConfirmPassword(false)} guardando={guardandoPassword} />
            )}
            {alerta && <ModalAlerta mensaje={alerta} onCerrar={() => setAlerta(null)} />}
        </div>
    );
}
