"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Car, FileText, LogOut, Wrench, Download, Pencil, Check, X, KeyRound, Eye, EyeOff, AlertTriangle
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Tipos de datos que devuelve la API para presupuestos y facturas
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

// Modal de confirmación genérico con icono de advertencia, mensaje y botones de cancelar/confirmar
const ModalConfirmar = ({ titulo, mensaje, detalle, onConfirmar, onCerrar, guardando, colorBoton = "bg-violet-600 hover:bg-violet-700" }: {
    titulo: string; mensaje: string; detalle?: string;
    onConfirmar: () => void; onCerrar: () => void;
    guardando?: boolean; colorBoton?: string;
}) => (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-[#110d20] border border-white/10 rounded-2xl p-6 sm:p-8 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-yellow-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={18} className="text-yellow-400" />
                </div>
                <h3 className="text-base font-semibold text-white">{titulo}</h3>
            </div>
            <p className="text-gray-400 text-sm mb-1">{mensaje}</p>
            {detalle && <p className="text-gray-600 text-xs mt-1">{detalle}</p>}
            <div className="flex gap-2 mt-6">
                <button onClick={onCerrar} className="flex-1 bg-white/5 hover:bg-white/8 text-gray-400 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/8">
                    Cancelar
                </button>
                <button onClick={onConfirmar} disabled={guardando}
                    className={`flex-1 ${colorBoton} disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2`}>
                    <Check size={14} /> {guardando ? "Procesando..." : "Confirmar"}
                </button>
            </div>
        </div>
    </div>
);

// Modal de alerta simple (errores o avisos) con un único botón de cierre
const ModalAlerta = ({ mensaje, onCerrar }: { mensaje: string; onCerrar: () => void }) => (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[60] p-4">
        <div className="bg-[#110d20] border border-white/10 rounded-2xl p-6 sm:p-8 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={18} className="text-red-400" />
                </div>
                <h3 className="text-base font-semibold text-white">Aviso</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6">{mensaje}</p>
            <button onClick={onCerrar} className="w-full bg-white/5 hover:bg-white/8 text-white py-2.5 rounded-xl text-sm font-medium transition-all border border-white/8">
                Entendido
            </button>
        </div>
    </div>
);

// Campo de contraseña con botón para alternar visibilidad (ojo)
const CampoPassword = ({ label, value, onChange, ver, setVer }: {
    label: string; value: string; onChange: (v: string) => void; ver: boolean; setVer: (v: boolean) => void;
}) => (
    <div>
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">{label}</p>
        <div className="relative">
            <input type={ver ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:border-violet-500/50 transition-all" />
            <button type="button" onClick={() => setVer(!ver)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                {ver ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        </div>
    </div>
);

// Campo de solo lectura para datos que no puede editar el usuario (como el email)
const CampoSoloLectura = ({ label, valor, nota }: { label: string; valor: string; nota?: string }) => (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
        <p className="text-gray-600 text-[10px] uppercase tracking-widest mb-2">{label}</p>
        <p className="text-gray-300 text-sm break-all">{valor || "—"}</p>
        {nota && <p className="text-gray-700 text-[11px] mt-2">{nota}</p>}
    </div>
);

// Campo editable en línea: muestra el valor con botón de lápiz, o un input con confirmar/cancelar al editar
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
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 transition-all hover:border-white/[0.1]">
            <p className="text-gray-600 text-[10px] uppercase tracking-widest mb-2">{label}</p>
            {esteEditando ? (
                // Modo edición: input con Enter para guardar, Escape para cancelar
                <div className="flex items-center gap-2">
                    <input type="text" value={valorEdit} onChange={(e) => onCambio(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") onGuardar(campo); if (e.key === "Escape") onCancelar(); }}
                        autoFocus className="flex-1 bg-white/5 border border-violet-500/40 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-violet-500/60 min-w-0" />
                    <button onClick={() => onGuardar(campo)} disabled={guardando}
                        className="w-7 h-7 text-white rounded-lg flex items-center justify-center transition-all flex-shrink-0" style={{background:"rgba(139,92,246,0.9)"}}>
                        <Check size={13} />
                    </button>
                    <button onClick={onCancelar}
                        className="w-7 h-7 bg-white/5 hover:bg-white/10 text-gray-500 rounded-lg flex items-center justify-center transition-all flex-shrink-0">
                        <X size={13} />
                    </button>
                </div>
            ) : (
                // Modo lectura: valor actual con botón de lápiz para activar edición
                <div className="flex items-center justify-between gap-3">
                    <p className="text-gray-200 text-sm break-all">{valor || "—"}</p>
                    <button onClick={() => onEditar(campo, valor)}
                        className="w-7 h-7 bg-white/[0.04] hover:bg-violet-500/15 text-gray-600 hover:text-violet-400 rounded-lg flex items-center justify-center transition-all flex-shrink-0">
                        <Pencil size={12} />
                    </button>
                </div>
            )}
        </div>
    );
};

// Requisitos de seguridad que debe cumplir la nueva contraseña
const requisitosPassword = [
    { regex: /.{6,}/, label: "Mínimo 6 caracteres" },
    { regex: /[a-z]/, label: "Una letra minúscula" },
    { regex: /[A-Z]/, label: "Una letra mayúscula" },
    { regex: /[0-9]/, label: "Un número" },
    { regex: /[^a-zA-Z0-9]/, label: "Un carácter especial (!@#$...)" },
];

// Indicador visual de fortaleza: muestra cada requisito como tick verde o círculo gris según se cumpla
const IndicadorPassword = ({ password }: { password: string }) => {
    if (!password) return null;
    return (
        <div className="grid grid-cols-1 gap-1.5 mt-2">
            {requisitosPassword.map((r) => {
                const cumple = r.regex.test(password);
                return (
                    <div key={r.label} className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${cumple ? "bg-emerald-500" : "bg-white/10"}`}>
                            {cumple && <Check size={8} className="text-white" />}
                        </div>
                        <span className={`text-xs transition-colors ${cumple ? "text-violet-400" : "text-gray-600"}`}>{r.label}</span>
                    </div>
                );
            })}
        </div>
    );
};

// ====================== COMPONENTE PRINCIPAL ======================

export default function ClientePage() {
    // Datos del cliente y sus presupuestos/facturas obtenidos de la API
    const [cliente, setCliente] = useState<any>(null);
    const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [loading, setLoading] = useState(true);
    const [autorizado, setAutorizado] = useState(false);

    // Vista activa del menú de pestañas
    const [view, setView] = useState<"estado" | "facturas" | "cancelados" | "perfil" | "presupuesto">("estado");

    // Estado de edición inline de campos del perfil
    const [editando, setEditando] = useState<string | null>(null);
    const [valorEdit, setValorEdit] = useState<string>("");
    const [guardando, setGuardando] = useState(false);

    // Estado del formulario de cambio de contraseña
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [passwordActual, setPasswordActual] = useState("");
    const [passwordNueva, setPasswordNueva] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [guardandoPassword, setGuardandoPassword] = useState(false);
    const [errorPassword, setErrorPassword] = useState("");
    const [okPassword, setOkPassword] = useState(false);

    // Control de visibilidad de los campos de contraseña
    const [verActual, setVerActual] = useState(false);
    const [verNueva, setVerNueva] = useState(false);
    const [verConfirm, setVerConfirm] = useState(false);

    // Mensaje de alerta genérico (errores de red, validación, etc.)
    const [alerta, setAlerta] = useState<string | null>(null);

    // Estado del formulario de nuevo presupuesto
    const [formPres, setFormPres] = useState({ vehiculo: "", matricula: "", anio: new Date().getFullYear().toString(), mensaje: "" });
    const [enviandoPres, setEnviandoPres] = useState(false);
    const [okPres, setOkPres] = useState(false);
    const [erroresPres, setErroresPres] = useState<Record<string, string>>({});

    const mostrarAlerta = (msg: string) => setAlerta(msg);

    // Control de modales de confirmación (logout, cambio de contraseña, edición de campo)
    const [confirmLogout, setConfirmLogout] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState(false);
    const [confirmCampo, setConfirmCampo] = useState<string | null>(null);

    const router = useRouter();

    // Genera las iniciales del cliente para el avatar (primera letra de nombre y primer apellido)
    const iniciales = cliente
        ? `${(cliente.nombre || "").charAt(0)}${(cliente.apellido1 || "").charAt(0)}`.toUpperCase()
        : "??";

    // Al montar el componente: verifica sesión en sessionStorage, carga datos y activa polling cada 15s
    useEffect(() => {
        const userId = sessionStorage.getItem("user_id");
        const role = sessionStorage.getItem("user_role");
        if (!userId || role?.toLowerCase() !== "cliente") { sessionStorage.clear(); router.push("/login"); return; }
        setAutorizado(true);
        cargarDatosCliente(userId);

        // Polling de actualización automática: refresca presupuestos y facturas cada 15 segundos
        const intervalo = setInterval(async () => {
            try {
                const res = await fetch(`/api/cliente/${userId}`);
                if (!res.ok) return;
                const data = await res.json();
                setCliente(data.cliente);
                setPresupuestos(data.presupuestos || []);
                setFacturas(data.facturas || []);
            } catch { }
        }, 15000);
        return () => clearInterval(intervalo);
    }, [router]);

    // Carga inicial de datos del cliente desde la API
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

    // Limpia la sesión y redirige al login
    const handleLogout = () => { sessionStorage.clear(); router.push("/login"); };

    // Activa el modo edición de un campo del perfil
    const iniciarEdicion = (campo: string, valorActual: string) => { setEditando(campo); setValorEdit(valorActual || ""); };
    const cancelarEdicion = () => { setEditando(null); setValorEdit(""); };

    // Solicita confirmación antes de guardar un campo editado
    const guardarCampo = (campo: string) => setConfirmCampo(campo);

    // Ejecuta el PATCH al confirmar el cambio de un campo del perfil
    const ejecutarGuardarCampo = async () => {
        const campo = confirmCampo;
        if (!campo) return;
        setConfirmCampo(null);
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

    // Valida el formulario de contraseña y abre el modal de confirmación si todo es correcto
    const guardarPassword = async () => {
        setErrorPassword(""); setOkPassword(false);
        if (!passwordActual || !passwordNueva || !passwordConfirm) { setErrorPassword("Rellena todos los campos."); return; }
        if (passwordNueva !== passwordConfirm) { setErrorPassword("Las contraseñas nuevas no coinciden."); return; }
        const fallida = requisitosPassword.find(r => !r.regex.test(passwordNueva));
        if (fallida) { setErrorPassword(`La contraseña no cumple: ${fallida.label.toLowerCase()}`); return; }
        setConfirmPassword(true);
    };

    // Ejecuta el PATCH de cambio de contraseña al confirmar en el modal
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
            // Cierra el panel de contraseña automáticamente tras 2 segundos
            setTimeout(() => { setMostrarPassword(false); setOkPassword(false); }, 2000);
        } catch { mostrarAlerta("No se pudo guardar. Inténtalo de nuevo."); }
        finally { setGuardandoPassword(false); }
    };

    // Genera y descarga un PDF de la factura con jsPDF: cabecera oscura, tabla de artículos y total destacado
    const descargarFactura = (factura: any) => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // Cabecera con fondo oscuro y título centrado
            doc.setFillColor(17, 24, 39); doc.rect(0, 0, pageWidth, 55, "F");
            doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(26);
            doc.text("AJCAR 25 - FACTURA", pageWidth / 2, 35, { align: "center" });

            // Número de factura y fecha
            doc.setFontSize(10); doc.setTextColor(0);
            doc.text(`Nº: ${factura.numero_factura || "N/A"}`, 20, 70);
            doc.text(`Fecha: ${new Date().toLocaleDateString("es-ES")}`, pageWidth - 20, 70, { align: "right" });

            // Bloque de datos del cliente
            let y = 85;
            doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("DATOS DEL CLIENTE:", 20, y); y += 10;
            doc.setFont("helvetica", "normal"); doc.setFontSize(10);
            doc.text(`Cliente: ${factura.cliente_nombre || "Sin nombre"}`, 20, y); y += 7;
            doc.text(`Vehículo: ${factura.vehiculo || "—"}`, 20, y); y += 15;

            // Tabla de artículos con autoTable (descripción, cantidad, precio unitario, total)
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

            // Pie de total con fondo verde y texto en blanco
            const finalY = (doc as any).lastAutoTable?.finalY || y + 40;
            doc.setFillColor(5, 150, 105); doc.rect(20, finalY, pageWidth - 40, 20, "F");
            doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(14);
            doc.text("TOTAL FACTURA", 25, finalY + 13);
            doc.text(`${Number(factura.total || 0).toFixed(2)}€`, pageWidth - 25, finalY + 13, { align: "right" });
            doc.setTextColor(100); doc.setFontSize(10);
            doc.text("Gracias por confiar en AJCAR 25", pageWidth / 2, finalY + 45, { align: "center" });
            doc.save(`Factura_${factura.numero_factura || factura.id}.pdf`);
        } catch (error) { console.error(error); mostrarAlerta("Error al generar el PDF."); }
    };

    // Pantalla de espera mientras se verifica la autorización
    if (!autorizado) return (
        <div className="min-h-screen bg-[#0d0a1a] flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
    );

    // Pantalla de carga mientras se obtienen los datos de la API
    if (loading) return (
        <div className="min-h-screen bg-[#0d0a1a] flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
    );

    // Definición de las pestañas de navegación
    const tabs = [
        { key: "estado", label: "Estado" },
        { key: "presupuesto", label: "+ Presupuesto" },
        { key: "facturas", label: "Facturas" },
        { key: "cancelados", label: "Cancelados" },
        { key: "perfil", label: "Perfil" },
    ] as { key: "estado" | "facturas" | "cancelados" | "perfil" | "presupuesto"; label: string }[];

    return (
        <div className="min-h-screen font-sans" style={{ background: "#0d0a1a" }}>
            {/* Orbes decorativos de fondo con gradientes radiales */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute w-[500px] h-[500px] rounded-full top-[-100px] right-[-80px]"
                    style={{ background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)" }} />
                <div className="absolute w-[350px] h-[350px] rounded-full bottom-[60px] left-[-60px]"
                    style={{ background: "radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)" }} />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto">
                {/* HEADER: avatar con iniciales, nombre/email del cliente y botón de cierre de sesión */}
                <header className="px-5 sm:px-8 pt-7 pb-0">
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-sm font-semibold text-violet-400"
                                style={{ background: "rgba(16,185,129,0.12)", border: "0.5px solid rgba(16,185,129,0.2)" }}>
                                {iniciales}
                            </div>
                            <div className="min-w-0">
                                <p className="text-violet-400 text-[10px] font-medium uppercase tracking-widest mb-1">Área de cliente</p>
                                <h1 className="text-lg sm:text-2xl font-semibold text-white leading-none truncate">
                                    {cliente?.nombre} {cliente?.apellido1 || ""}
                                </h1>
                                <p className="text-gray-600 text-xs mt-1 truncate">{cliente?.email}</p>
                            </div>
                        </div>
                        <button onClick={() => setConfirmLogout(true)}
                            className="flex items-center gap-1.5 px-3 py-2 text-gray-600 hover:text-red-400 text-xs transition-all flex-shrink-0 rounded-xl border border-transparent hover:border-red-500/20 hover:bg-red-500/5">
                            <LogOut size={14} /> <span className="hidden sm:inline">Salir</span>
                        </button>
                    </div>
                    <div className="h-px mb-0" style={{ background: "linear-gradient(90deg, rgba(139,92,246,0.35), rgba(167,139,250,0.08), transparent)" }} />
                </header>

                {/* BARRA DE PESTAÑAS: resalta la activa con borde inferior violeta */}
                <div className="px-5 sm:px-8 flex overflow-x-auto" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
                    {tabs.map((tab) => (
                        <button key={tab.key} onClick={() => setView(tab.key)}
                            className={`px-4 py-3.5 text-xs font-medium whitespace-nowrap transition-all border-b-[1.5px] ${
                                view === tab.key
                                    ? "text-violet-400 border-violet-500"
                                    : "text-gray-600 border-transparent hover:text-gray-400"
                            }`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ÁREA DE CONTENIDO: renderiza la vista activa según la pestaña seleccionada */}
                <div className="px-5 sm:px-8 py-6 sm:py-8">

                    {/* VISTA ESTADO: lista de presupuestos activos con indicador visual si el vehículo está en taller */}
                    {view === "estado" && (
                        <div className="space-y-3">
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-4">Mis vehículos</p>
                            {presupuestos.filter(p => p.estado?.toLowerCase() !== "cancelado").length > 0 ? (
                                presupuestos.filter(p => p.estado?.toLowerCase() !== "cancelado").map((p) => {
                                    const estadoLower = (p.estado || "").toLowerCase().trim();
                                    const estaEnTaller = estadoLower.includes("taller") || estadoLower === "en taller";
                                    const totalFormateado = (p.total != null && !isNaN(Number(p.total))) ? `${Number(p.total).toFixed(2)} €` : "Pendiente";
                                    return (
                                        <div key={p.id} className="rounded-2xl p-5 sm:p-6 transition-all"
                                            style={{
                                                background: estaEnTaller ? "rgba(249,115,22,0.04)" : "rgba(255,255,255,0.02)",
                                                border: estaEnTaller ? "0.5px solid rgba(249,115,22,0.2)" : "0.5px solid rgba(255,255,255,0.06)"
                                            }}>
                                            <div className="flex justify-between items-start gap-4 mb-4">
                                                <div className="min-w-0">
                                                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Vehículo</p>
                                                    <h3 className="text-base sm:text-lg font-semibold text-white truncate">{p.vehiculo}</h3>
                                                </div>
                                                {/* Badge de estado: naranja si está en taller, gris neutro en otro caso */}
                                                <span className={`px-3 py-1 rounded-full text-[11px] font-medium flex-shrink-0 ${
                                                    estaEnTaller
                                                        ? "text-orange-400 bg-orange-500/10 border border-orange-500/20"
                                                        : "text-gray-500 bg-white/5 border border-white/8"
                                                }`}>
                                                    {estaEnTaller ? "En taller" : (p.estado || "Pendiente")}
                                                </span>
                                            </div>
                                            {/* Mensaje del taller visible solo si el vehículo está en reparación */}
                                            {estaEnTaller && (
                                                <div className="flex items-start gap-3 p-3 rounded-xl mb-4"
                                                    style={{ background: "rgba(16,185,129,0.04)", border: "0.5px solid rgba(139,92,246,0.12)" }}>
                                                    <Wrench size={14} className="text-violet-400 mt-0.5 flex-shrink-0" />
                                                    <p className="text-gray-400 text-xs leading-relaxed">
                                                        {p.mensaje || "Estamos trabajando en tu vehículo"}
                                                    </p>
                                                </div>
                                            )}
                                            {/* Resumen de fecha de solicitud e importe estimado */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.05)" }}>
                                                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Solicitud</p>
                                                    <p className="text-gray-200 text-sm font-medium">{new Date(p.creado_en).toLocaleDateString('es-ES')}</p>
                                                </div>
                                                <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.05)" }}>
                                                    <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Importe estimado</p>
                                                    <p className="text-violet-400 text-sm font-semibold">{totalFormateado}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                // Estado vacío cuando no hay vehículos activos
                                <div className="text-center py-16 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.05)" }}>
                                    <Car size={36} className="mx-auto mb-4 text-gray-700" />
                                    <p className="text-gray-400 text-sm font-medium mb-1">No tienes vehículos activos</p>
                                    <p className="text-gray-700 text-xs max-w-xs mx-auto">Solicita un presupuesto y cuando sea aceptado aparecerá aquí.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* VISTA PRESUPUESTO: formulario para solicitar un nuevo presupuesto */}
                    {view === "presupuesto" && (
                        <div>
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-4">Nuevo presupuesto</p>
                            {okPres ? (
                                // Pantalla de éxito tras enviar el presupuesto
                                <div className="text-center py-14 rounded-2xl" style={{ background: "rgba(139,92,246,0.06)", border: "0.5px solid rgba(139,92,246,0.18)" }}>
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{background:"rgba(139,92,246,0.15)"}}>
                                        <Check size={22} className="text-violet-400" />
                                    </div>
                                    <p className="text-white font-medium mb-1">¡Presupuesto enviado!</p>
                                    <p className="text-gray-500 text-sm mb-6">Nos pondremos en contacto contigo pronto.</p>
                                    <button onClick={() => { setOkPres(false); setFormPres({ vehiculo: "", matricula: "", anio: new Date().getFullYear().toString(), mensaje: "" }); setView("estado"); }}
                                        className="text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all" style={{background:"rgba(139,92,246,0.85)"}}>
                                        Ver mis vehículos
                                    </button>
                                </div>
                            ) : (
                                <div className="rounded-2xl p-5 sm:p-6 space-y-4" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
                                    {/* Datos del cliente precargados automáticamente (solo lectura) */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.04)" }}>
                                            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Nombre</p>
                                            <p className="text-gray-500 text-sm">{cliente?.nombre} {cliente?.apellido1 || ""}</p>
                                        </div>
                                        <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.04)" }}>
                                            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Email</p>
                                            <p className="text-gray-500 text-xs truncate">{cliente?.email}</p>
                                        </div>
                                    </div>
                                    <div className="h-px" style={{ background: "rgba(255,255,255,0.05)" }} />

                                    {/* Campos editables: vehículo, año y matrícula */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="col-span-2">
                                            <label className="block text-[10px] text-gray-600 uppercase tracking-widest mb-2">Vehículo *</label>
                                            <input type="text" value={formPres.vehiculo} onChange={(e) => setFormPres(p => ({ ...p, vehiculo: e.target.value }))}
                                                placeholder="Marca, modelo..."
                                                className={`w-full text-white text-sm px-3 py-2.5 rounded-xl outline-none transition-all ${erroresPres.vehiculo ? "border border-red-500/50" : "border border-white/8 focus:border-violet-500/40"}`}
                                                style={{ background: "rgba(255,255,255,0.04)" }} />
                                            {erroresPres.vehiculo && <p className="text-red-400 text-[11px] mt-1">{erroresPres.vehiculo}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-gray-600 uppercase tracking-widest mb-2">Año *</label>
                                            <input type="number" value={formPres.anio} onChange={(e) => setFormPres(p => ({ ...p, anio: e.target.value }))}
                                                placeholder="2024"
                                                className={`w-full text-white text-sm px-3 py-2.5 rounded-xl outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${erroresPres.anio ? "border border-red-500/50" : "border border-white/8 focus:border-violet-500/40"}`}
                                                style={{ background: "rgba(255,255,255,0.04)" }} />
                                            {erroresPres.anio && <p className="text-red-400 text-[11px] mt-1">{erroresPres.anio}</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-600 uppercase tracking-widest mb-2">Matrícula</label>
                                        <input type="text" value={formPres.matricula} onChange={(e) => setFormPres(p => ({ ...p, matricula: e.target.value.toUpperCase() }))}
                                            placeholder="1234 ABC"
                                            className="w-full text-white text-sm px-3 py-2.5 rounded-xl outline-none border border-white/8 focus:border-violet-500/40 transition-all uppercase"
                                            style={{ background: "rgba(255,255,255,0.04)" }} />
                                    </div>

                                    {/* Descripción del problema o servicio solicitado */}
                                    <div>
                                        <label className="block text-[10px] text-gray-600 uppercase tracking-widest mb-2">Descripción *</label>
                                        <textarea value={formPres.mensaje} onChange={(e) => setFormPres(p => ({ ...p, mensaje: e.target.value }))}
                                            rows={3} placeholder="Describe el daño o servicio que necesitas..."
                                            className={`w-full text-white text-sm px-3 py-2.5 rounded-xl outline-none transition-all resize-none ${erroresPres.mensaje ? "border border-red-500/50" : "border border-white/8 focus:border-violet-500/40"}`}
                                            style={{ background: "rgba(255,255,255,0.04)" }} />
                                        {erroresPres.mensaje && <p className="text-red-400 text-[11px] mt-1">{erroresPres.mensaje}</p>}
                                    </div>

                                    {/* Botón de envío: valida campos, hace POST a la API y muestra éxito o error */}
                                    <button disabled={enviandoPres}
                                        onClick={async () => {
                                            const errs: Record<string, string> = {};
                                            if (!formPres.vehiculo.trim()) errs.vehiculo = "El vehículo es obligatorio";
                                            if (!formPres.anio || parseInt(formPres.anio) < 1900 || parseInt(formPres.anio) > 2030) errs.anio = "Año no válido";
                                            if (!formPres.mensaje.trim()) errs.mensaje = "Describe el problema";
                                            setErroresPres(errs);
                                            if (Object.keys(errs).length > 0) return;
                                            setEnviandoPres(true);
                                            try {
                                                const res = await fetch("/api/presupuestos", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({
                                                        nombre: cliente?.nombre || "",
                                                        apellidos: `${cliente?.apellido1 || ""} ${cliente?.apellido2 || ""}`.trim(),
                                                        email: cliente?.email || "",
                                                        telefono: cliente?.telefono || "",
                                                        vehiculo: formPres.vehiculo,
                                                        anio: parseInt(formPres.anio),
                                                        mensaje: formPres.mensaje,
                                                        matricula: formPres.matricula || null,
                                                        estado: "Pendiente",
                                                        articulos: []
                                                    })
                                                });
                                                if (res.ok) { setOkPres(true); }
                                                else { mostrarAlerta("No se pudo enviar el presupuesto. Inténtalo de nuevo."); }
                                            } catch { mostrarAlerta("Error de conexión."); }
                                            finally { setEnviandoPres(false); }
                                        }}
                                        className="w-full py-3 rounded-xl text-white text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        style={{ background: "rgba(139,92,246,0.85)" }}>
                                        {enviandoPres ? <><div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" /> Enviando...</> : <><Car size={14} /> Solicitar presupuesto</>}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* VISTA FACTURAS: historial de facturas con botón de descarga en PDF para cada una */}
                    {view === "facturas" && (
                        <div>
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-4">Historial de facturas</p>
                            {facturas.length > 0 ? (
                                <div className="rounded-2xl overflow-hidden" style={{ border: "0.5px solid rgba(255,255,255,0.06)" }}>
                                    {facturas.map((f, i) => (
                                        <div key={f.id} className="flex justify-between items-center p-4 sm:p-5 transition-all hover:bg-white/[0.02]"
                                            style={{ borderBottom: i < facturas.length - 1 ? "0.5px solid rgba(255,255,255,0.04)" : "none", background: "rgba(255,255,255,0.02)" }}>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ background: "rgba(139,92,246,0.08)", border: "0.5px solid rgba(139,92,246,0.15)" }}>
                                                    <FileText size={15} className="text-violet-400" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-violet-400 text-[11px] font-mono">#{f.numero_factura || f.id.slice(0, 8)}</p>
                                                    <p className="text-gray-200 text-sm font-medium truncate">{f.vehiculo}</p>
                                                    <p className="text-gray-600 text-[11px]">{new Date(f.creado_en || f.fecha_emision || Date.now()).toLocaleDateString('es-ES')}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-violet-400 text-base font-semibold mb-1.5">{Number(f.total).toFixed(2)} €</p>
                                                <button onClick={() => descargarFactura(f)}
                                                    className="flex items-center gap-1.5 text-gray-500 hover:text-violet-400 text-[11px] transition-all">
                                                    <Download size={12} /> PDF
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                // Estado vacío cuando aún no hay facturas
                                <div className="text-center py-16 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.05)" }}>
                                    <FileText size={36} className="mx-auto mb-4 text-gray-700" />
                                    <p className="text-gray-400 text-sm font-medium mb-1">Aún no tienes facturas</p>
                                    <p className="text-gray-700 text-xs">Cuando el taller facture un trabajo aparecerá aquí.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* VISTA CANCELADOS: presupuestos con estado cancelado y su motivo de cancelación */}
                    {view === "cancelados" && (
                        <div className="space-y-3">
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-4">Cancelados</p>
                            {presupuestos.filter(p => p.estado?.toLowerCase() === "cancelado").length > 0 ? (
                                presupuestos.filter(p => p.estado?.toLowerCase() === "cancelado").map((p) => (
                                    <div key={p.id} className="rounded-2xl p-5 sm:p-6"
                                        style={{ background: "rgba(239,68,68,0.03)", border: "0.5px solid rgba(239,68,68,0.12)" }}>
                                        <div className="flex justify-between items-start gap-4 mb-4">
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Vehículo</p>
                                                <h3 className="text-base font-semibold text-white truncate">{p.vehiculo}</h3>
                                                <p className="text-gray-600 text-xs mt-1">{new Date(p.creado_en).toLocaleDateString('es-ES')}</p>
                                            </div>
                                            <span className="px-3 py-1 rounded-full text-[11px] font-medium text-red-400 flex-shrink-0"
                                                style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.15)" }}>
                                                Cancelado
                                            </span>
                                        </div>
                                        {/* Motivo de cancelación proporcionado por el taller */}
                                        {p.motivo_cancelacion && (
                                            <div className="p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.04)", border: "0.5px solid rgba(239,68,68,0.08)" }}>
                                                <p className="text-gray-500 text-xs italic leading-relaxed">"{p.motivo_cancelacion}"</p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                // Estado vacío cuando no hay cancelaciones
                                <div className="text-center py-16 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.05)" }}>
                                    <Car size={36} className="mx-auto mb-4 text-gray-700" />
                                    <p className="text-gray-400 text-sm font-medium mb-1">No tienes cancelados</p>
                                    <p className="text-gray-700 text-xs">Si se cancela algún servicio aparecerá aquí.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* VISTA PERFIL: datos personales editables inline y sección de cambio de contraseña */}
                    {view === "perfil" && (
                        <div className="space-y-3">
                            <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-4">Datos personales</p>
                            <div className="rounded-2xl overflow-hidden" style={{ border: "0.5px solid rgba(255,255,255,0.06)" }}>
                                {/* Campos editables: nombre y apellidos */}
                                {[
                                    { label: "Nombre", campo: "nombre", valor: cliente?.nombre || "" },
                                    { label: "Primer apellido", campo: "apellido1", valor: cliente?.apellido1 || "" },
                                    { label: "Segundo apellido", campo: "apellido2", valor: cliente?.apellido2 || "" },
                                    { label: "Teléfono", campo: "telefono", valor: cliente?.telefono || "" },
                                ].map((f, i, arr) => (
                                    <div key={f.campo} className="px-4 py-3.5 transition-all hover:bg-white/[0.02]"
                                        style={{ background: "rgba(255,255,255,0.02)", borderBottom: i < arr.length - 1 ? "0.5px solid rgba(255,255,255,0.04)" : "none" }}>
                                        <CampoEditable label={f.label} campo={f.campo} valor={f.valor}
                                            editando={editando} valorEdit={valorEdit} guardando={guardando}
                                            onEditar={iniciarEdicion} onCancelar={cancelarEdicion}
                                            onGuardar={guardarCampo} onCambio={setValorEdit} />
                                    </div>
                                ))}
                                {/* Email de solo lectura: no puede modificarse */}
                                <div className="px-4 py-3.5" style={{ background: "rgba(255,255,255,0.02)" }}>
                                    <CampoSoloLectura label="Email" valor={cliente?.email || ""} nota="No se puede modificar" />
                                </div>
                            </div>

                            {/* Sección de cambio de contraseña: se expande al pulsar "Cambiar" */}
                            <div className="rounded-2xl p-4 sm:p-5" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
                                <div className="flex items-center justify-between mb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.08)" }}>
                                            <KeyRound size={14} className="text-violet-400" />
                                        </div>
                                        <span className="text-gray-300 text-sm">Contraseña</span>
                                    </div>
                                    <button onClick={() => { setMostrarPassword(!mostrarPassword); setErrorPassword(""); setOkPassword(false); setPasswordActual(""); setPasswordNueva(""); setPasswordConfirm(""); }}
                                        className="text-xs text-gray-600 hover:text-gray-300 transition-all px-3 py-1.5 rounded-lg border border-white/8 hover:border-white/15">
                                        {mostrarPassword ? "Cancelar" : "Cambiar"}
                                    </button>
                                </div>
                                {/* Formulario de cambio de contraseña con indicador de fortaleza */}
                                {mostrarPassword && (
                                    <div className="space-y-3 mt-4 pt-4" style={{ borderTop: "0.5px solid rgba(255,255,255,0.05)" }}>
                                        <CampoPassword label="Contraseña actual" value={passwordActual} onChange={setPasswordActual} ver={verActual} setVer={setVerActual} />
                                        <div>
                                            <CampoPassword label="Nueva contraseña" value={passwordNueva} onChange={setPasswordNueva} ver={verNueva} setVer={setVerNueva} />
                                            <IndicadorPassword password={passwordNueva} />
                                        </div>
                                        <CampoPassword label="Confirmar contraseña" value={passwordConfirm} onChange={setPasswordConfirm} ver={verConfirm} setVer={setVerConfirm} />
                                        {errorPassword && <p className="text-red-400 text-xs">{errorPassword}</p>}
                                        {okPassword && <p className="text-violet-400 text-xs">✓ Contraseña actualizada</p>}
                                        <button onClick={guardarPassword} disabled={guardandoPassword}
                                            className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-50"
                                            style={{ background: "rgba(16,185,129,0.85)" }}>
                                            {guardandoPassword ? "Guardando..." : "Guardar contraseña"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODALES GLOBALES: confirmación de edición de campo, logout y cambio de contraseña */}
            {confirmCampo && (
                <ModalConfirmar titulo="Guardar cambio" mensaje="¿Confirmas que quieres guardar este cambio?" detalle="El dato se actualizará inmediatamente."
                    onConfirmar={ejecutarGuardarCampo} onCerrar={() => setConfirmCampo(null)} guardando={guardando}
                    colorBoton="bg-violet-600 hover:bg-violet-700" />
            )}
            {confirmLogout && (
                <ModalConfirmar titulo="Cerrar sesión" mensaje="¿Seguro que quieres salir?" detalle="Tendrás que volver a iniciar sesión."
                    onConfirmar={() => { setConfirmLogout(false); handleLogout(); }} onCerrar={() => setConfirmLogout(false)}
                    colorBoton="bg-red-500/90 hover:bg-red-500" />
            )}
            {confirmPassword && (
                <ModalConfirmar titulo="Cambiar contraseña" mensaje="¿Confirmas el cambio de contraseña?" detalle="Se actualizarán tus credenciales de acceso."
                    onConfirmar={ejecutarGuardarPassword} onCerrar={() => setConfirmPassword(false)} guardando={guardandoPassword}
                    colorBoton="bg-violet-600 hover:bg-violet-700" />
            )}
            {/* Modal de alerta genérico para errores de red o validación */}
            {alerta && <ModalAlerta mensaje={alerta} onCerrar={() => setAlerta(null)} />}
        </div>
    );
}
