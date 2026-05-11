"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    LogOut, Users, FileText, TrendingUp, Wrench, Car,
    Euro, Plus, Pencil, Trash2, X, Check, Eye, EyeOff,
    ShieldOff, ShieldCheck, Download, Package, Search, Trophy, Target, PackagePlus, AlertTriangle
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Empleado {
    id: string; nombre: string; apellido1: string; apellido2: string;
    email: string; telefono: string; matricula: string | null;
    esta_activo: boolean; fecha_registro: string;
}
interface Cliente {
    id: string; nombre: string; apellido1: string; apellido2: string;
    email: string; telefono: string; tipo_cliente: string;
    esta_activo: boolean; motivo_baja: string | null; fecha_registro: string;
}
interface Presupuesto {
    id: string; nombre: string; email: string; vehiculo: string; estado: string; creado_en: string;
}
interface Factura {
    id: number; numero_factura: string; cliente_nombre: string;
    vehiculo: string; matricula?: string | null; total: number; fecha_emision: string; articulos?: any;
    empleado_nombre: string | null; empleado_apellido1: string | null;
}
interface Articulo {
    id: number; codigo: string; descripcion: string;
    precio_unitario: number; stock: number; stock_reservado: number;
}
interface StatsEmpleado {
    id: string; nombre: string; apellido1: string; matricula: string | null;
    total_facturas: number; total_facturado: number; facturado_mes: number; objetivo_mes: number;
}
interface Stats {
    totalIngresos: number; ingresosMes: number; totalClientes: number;
    totalEmpleados: number; totalPresupuestos: number; totalFacturas: number;
    presupuestosPorEstado: { estado: string; cantidad: number }[];
}
interface FormEmpleado {
    nombre: string; apellido1: string; apellido2: string;
    email: string; telefono: string; password: string;
}
interface EntradaStock {
    articulo_id: number; cantidad: number;
}

const FORM_VACIO: FormEmpleado = {
    nombre: "", apellido1: "", apellido2: "", email: "", telefono: "", password: "Ajcar25&"
};

const mesActual = new Date().toLocaleString("es-ES", { month: "long", year: "numeric" });

const BadgeEstado = ({ estado }: { estado: string }) => {
    const e = (estado || "").toLowerCase().trim();
    let color = "bg-gray-600 text-white";
    if (e.includes("taller")) color = "bg-orange-600 text-white";
    else if (e === "facturado" || e === "facturada") color = "bg-green-600 text-white";
    else if (e === "cancelado") color = "bg-red-600 text-white";
    else if (e === "pendiente") color = "bg-yellow-600 text-white";
    return <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${color}`}>{estado}</span>;
};

const StatCard = ({ label, value, icon, color }: {
    label: string; value: string | number; icon: React.ReactNode; color: string;
}) => (
    <div className={`bg-[#0f0f12] border rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex items-center gap-4 sm:gap-6 ${color}`}>
        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0">{icon}</div>
        <div>
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">{label}</p>
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tighter">{value}</p>
        </div>
    </div>
);

const ModalConfirmar = ({ titulo, mensaje, detalle, onConfirmar, onCerrar, guardando, colorBoton = "bg-blue-600 hover:bg-blue-700" }: {
    titulo: string; mensaje: string; detalle?: string;
    onConfirmar: () => void; onCerrar: () => void;
    guardando?: boolean; colorBoton?: string;
}) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[#0f0f12] border border-white/10 rounded-[30px] sm:rounded-[40px] p-6 sm:p-10 w-full max-w-md">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={20} className="text-yellow-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">{titulo}</h3>
            </div>
            <p className="text-gray-300 text-sm mb-2">{mensaje}</p>
            {detalle && <p className="text-gray-500 text-xs">{detalle}</p>}
            <div className="flex gap-3 mt-6 sm:mt-8">
                <button onClick={onCerrar} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 py-3 rounded-xl font-bold transition-all">Cancelar</button>
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
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={20} className="text-red-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">Aviso</h3>
            </div>
            <p className="text-gray-300 text-sm mb-6 sm:mb-8">{mensaje}</p>
            <button onClick={onCerrar} className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold transition-all">Entendido</button>
        </div>
    </div>
);

const ModalEmpleado = ({ titulo, form, setForm, onGuardar, onCerrar, guardando, error, modoEdicion }: {
    titulo: string; form: FormEmpleado; setForm: (f: FormEmpleado) => void;
    onGuardar: () => void; onCerrar: () => void; guardando: boolean; error: string; modoEdicion: boolean;
}) => {
    const [verPassword, setVerPassword] = useState(false);
    const campo = (label: string, key: keyof FormEmpleado, type = "text", obligatorio = false) => (
        <div>
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">{label} {obligatorio && <span className="text-red-400">*</span>}</p>
            <div className="relative">
                <input type={key === "password" ? (verPassword ? "text" : "password") : type} value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:border-blue-500" />
                {key === "password" && (
                    <button type="button" onClick={() => setVerPassword(!verPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                        {verPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                )}
            </div>
        </div>
    );
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-[#0f0f12] border border-white/10 rounded-t-[40px] sm:rounded-[40px] p-6 sm:p-10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />
                <div className="flex justify-between items-center mb-6 sm:mb-8">
                    <h3 className="text-xl sm:text-2xl font-black text-white">{titulo}</h3>
                    <button onClick={onCerrar} className="w-9 h-9 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl flex items-center justify-center transition-all flex-shrink-0"><X size={18} /></button>
                </div>
                <div className="space-y-4">
                    {campo("Nombre", "nombre", "text", true)}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{campo("Primer Apellido", "apellido1")}{campo("Segundo Apellido", "apellido2")}</div>
                    {campo("Email", "email", "email", true)}
                    {campo("Teléfono", "telefono", "tel", true)}
                    {campo("Contraseña", "password")}
                    {!modoEdicion && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
                            <p className="text-blue-400 text-xs">🎲 Se generará automáticamente un número de matrícula de 6 dígitos para este empleado.</p>
                        </div>
                    )}
                </div>
                {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
                <div className="flex gap-3 mt-6 sm:mt-8">
                    <button onClick={onCerrar} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 py-3 rounded-xl font-bold transition-all">Cancelar</button>
                    <button onClick={onGuardar} disabled={guardando}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                        <Check size={16} /> {guardando ? "Guardando..." : "Guardar"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ModalDenegarAcceso = ({ cliente, onConfirmar, onCerrar, guardando }: {
    cliente: Cliente; onConfirmar: (motivo: string) => void; onCerrar: () => void; guardando: boolean;
}) => {
    const [motivo, setMotivo] = useState("");
    const [motivoCustom, setMotivoCustom] = useState("");
    const [confirmando, setConfirmando] = useState(false);
    const motivosFrecuentes = ["Moroso", "Fraude", "Comportamiento inapropiado", "Solicitud propia", "Otro"];
    const motivoFinal = motivo === "Otro" ? motivoCustom : motivo;
    return (
        <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
                <div className="bg-[#0f0f12] border border-red-500/20 rounded-t-[40px] sm:rounded-[40px] p-6 sm:p-10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                    <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />
                    <div className="flex justify-between items-center mb-6 sm:mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-red-600/20 rounded-xl flex items-center justify-center"><ShieldOff size={18} className="text-red-400" /></div>
                            <h3 className="text-xl sm:text-2xl font-black text-white">Denegar Acceso</h3>
                        </div>
                        <button onClick={onCerrar} className="w-9 h-9 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl flex items-center justify-center transition-all"><X size={18} /></button>
                    </div>
                    <p className="text-gray-400 mb-4 sm:mb-6 text-sm">Vas a denegar el acceso a <span className="text-white font-bold">{cliente.nombre} {cliente.apellido1}</span>. Selecciona el motivo:</p>
                    <div className="space-y-2 mb-4">
                        {motivosFrecuentes.map((m) => (
                            <button key={m} onClick={() => setMotivo(m)}
                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border ${motivo === m ? "bg-red-600/20 border-red-500/50 text-red-300" : "bg-white/[0.02] border-white/5 text-gray-400 hover:border-white/20 hover:text-white"}`}>
                                {m}
                            </button>
                        ))}
                    </div>
                    {motivo === "Otro" && (
                        <div className="mb-4">
                            <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Especifica el motivo</p>
                            <input type="text" value={motivoCustom} onChange={(e) => setMotivoCustom(e.target.value)} placeholder="Escribe el motivo..."
                                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500" />
                        </div>
                    )}
                    <div className="flex gap-3 mt-5 sm:mt-6">
                        <button onClick={onCerrar} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 py-3 rounded-xl font-bold transition-all">Cancelar</button>
                        <button onClick={() => setConfirmando(true)} disabled={guardando || !motivoFinal.trim()}
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                            <ShieldOff size={16} /> {guardando ? "Procesando..." : "Denegar Acceso"}
                        </button>
                    </div>
                </div>
            </div>
            {confirmando && (
                <ModalConfirmar titulo="Confirmar denegación"
                    mensaje={`¿Seguro que quieres denegar el acceso a ${cliente.nombre} ${cliente.apellido1}?`}
                    detalle={`Motivo: ${motivoFinal}`}
                    onConfirmar={() => { setConfirmando(false); onConfirmar(motivoFinal); }}
                    onCerrar={() => setConfirmando(false)}
                    guardando={guardando} colorBoton="bg-red-600 hover:bg-red-700" />
            )}
        </>
    );
};

const ModalEntradaStock = ({ articulos, onCerrar, onConfirmar, guardando }: {
    articulos: Articulo[]; onCerrar: () => void;
    onConfirmar: (entradas: EntradaStock[]) => void; guardando: boolean;
}) => {
    const [filtro, setFiltro] = useState("");
    const [cantidades, setCantidades] = useState<Record<number, string>>({});
    const articulosFiltrados = articulos.filter(a => {
        const t = filtro.toLowerCase();
        return a.codigo.toLowerCase().includes(t) || a.descripcion.toLowerCase().includes(t);
    });
    const entradas = Object.entries(cantidades).map(([id, cant]) => ({ articulo_id: Number(id), cantidad: parseInt(cant) || 0 })).filter(e => e.cantidad > 0);
    const totalArticulos = entradas.length;
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-[#0f0f12] border border-white/10 rounded-t-[40px] sm:rounded-[40px] p-6 sm:p-10 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden flex-shrink-0" />
                <div className="flex justify-between items-center mb-5 sm:mb-6 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-green-600/20 rounded-xl flex items-center justify-center"><PackagePlus size={18} className="text-green-400" /></div>
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black text-white">Entrada de Stock</h3>
                            <p className="text-gray-500 text-xs mt-0.5 hidden sm:block">Indica cuántas unidades añadir a cada artículo</p>
                        </div>
                    </div>
                    <button onClick={onCerrar} className="w-9 h-9 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl flex items-center justify-center transition-all flex-shrink-0"><X size={18} /></button>
                </div>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 mb-4 flex-shrink-0">
                    <Search size={15} className="text-gray-500 flex-shrink-0" />
                    <input type="text" value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Buscar artículo..."
                        className="bg-transparent text-white text-sm focus:outline-none w-full placeholder:text-gray-600" />
                </div>
                <div className="overflow-y-auto flex-1 space-y-2 pr-1">
                    {articulosFiltrados.map((art) => (
                        <div key={art.id} className={`flex items-center justify-between gap-3 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 rounded-2xl border transition-all ${cantidades[art.id] && parseInt(cantidades[art.id]) > 0 ? "bg-green-500/5 border-green-500/20" : "bg-white/[0.02] border-white/5"}`}>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-xs sm:text-sm truncate">{art.descripcion}</p>
                                <div className="flex items-center gap-2 sm:gap-3 mt-0.5">
                                    <span className="text-blue-400 font-mono text-xs">{art.codigo}</span>
                                    <span className="text-gray-600 text-xs hidden sm:inline">Stock: <span className={`font-bold ${art.stock === 0 ? "text-red-400" : art.stock < 5 ? "text-yellow-400" : "text-gray-400"}`}>{art.stock}</span></span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                <input type="number" min="0" value={cantidades[art.id] || ""} onChange={(e) => setCantidades(prev => ({ ...prev, [art.id]: e.target.value }))} placeholder="0"
                                    className="w-14 sm:w-20 bg-white/5 border border-white/10 focus:border-green-500/50 text-white text-center rounded-xl px-2 py-2 text-sm font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors" />
                                <span className="text-gray-600 text-xs">uds.</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex-shrink-0 mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/5">
                    {totalArticulos > 0 && (
                        <div className="mb-3 sm:mb-4 bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-3">
                            <p className="text-green-400 text-sm font-bold">{totalArticulos} artículo{totalArticulos > 1 ? "s" : ""} con entrada de stock</p>
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button onClick={onCerrar} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 py-3 rounded-xl font-bold transition-all">Cancelar</button>
                        <button onClick={() => onConfirmar(entradas)} disabled={guardando || totalArticulos === 0}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2">
                            <PackagePlus size={16} /> {guardando ? "Guardando..." : "Añadir al stock"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function JefePage() {
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [articulos, setArticulos] = useState<Articulo[]>([]);
    const [statsEmpleados, setStatsEmpleados] = useState<StatsEmpleado[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"dashboard" | "empleados" | "presupuestos" | "clientes" | "facturas" | "stock" | "rendimiento">("dashboard");

    const [modalEmpleadoAbierto, setModalEmpleadoAbierto] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [empleadoEditandoId, setEmpleadoEditandoId] = useState<string | null>(null);
    const [form, setForm] = useState<FormEmpleado>(FORM_VACIO);
    const [guardando, setGuardando] = useState(false);
    const [errorForm, setErrorForm] = useState("");
    const [clienteDenegar, setClienteDenegar] = useState<Cliente | null>(null);
    const [guardandoAcceso, setGuardandoAcceso] = useState(false);

    const [filtroStock, setFiltroStock] = useState("");
    const [filtroFacturas, setFiltroFacturas] = useState("");
    const [editandoStock, setEditandoStock] = useState<number | null>(null);
    const [valorStockEdit, setValorStockEdit] = useState<number>(0);
    const [guardandoStock, setGuardandoStock] = useState(false);

    const [modalEntradaStockAbierto, setModalEntradaStockAbierto] = useState(false);
    const [guardandoEntrada, setGuardandoEntrada] = useState(false);

    const [editandoObjetivo, setEditandoObjetivo] = useState<string | null>(null);
    const [valorObjetivoEdit, setValorObjetivoEdit] = useState<string>("");
    const [guardandoObjetivo, setGuardandoObjetivo] = useState(false);

    const [confirmEstado, setConfirmEstado] = useState<{ presupuesto_id: string; estadoNuevo: string; estadoActual: string; vehiculo: string } | null>(null);
    const [guardandoEstado, setGuardandoEstado] = useState(false);
    const [confirmEliminar, setConfirmEliminar] = useState<{ empleado_id: string; nombre: string } | null>(null);
    const [guardandoEliminar, setGuardandoEliminar] = useState(false);
    const [confirmGuardarEmpleado, setConfirmGuardarEmpleado] = useState(false);
    const [confirmRestaurar, setConfirmRestaurar] = useState<Cliente | null>(null);
    const [guardandoRestaurar, setGuardandoRestaurar] = useState(false);
    const [alerta, setAlerta] = useState<string | null>(null);
    const mostrarAlerta = (msg: string) => setAlerta(msg);
    const [confirmLogout, setConfirmLogout] = useState(false);

    const router = useRouter();

    useEffect(() => {
        const role = sessionStorage.getItem("user_role");
        if (!role || !["jefe", "admin"].includes(role.toLowerCase())) { router.push("/login"); return; }
        cargarDatos();

        // ✅ Refresco automático cada 15 segundos sin mostrar spinner
        const intervalo = setInterval(async () => {
            try {
                const res = await fetch("/api/jefe");
                if (!res.ok) return;
                const data = await res.json();
                setEmpleados(data.empleados || []);
                setClientes(data.clientes || []);
                setPresupuestos(data.presupuestos || []);
                setFacturas(data.facturas || []);
                setArticulos(data.articulos || []);
                setStatsEmpleados(data.statsEmpleados || []);
                setStats(data.stats || null);
            } catch { /* silencioso */ }
        }, 15000);

        return () => clearInterval(intervalo);
    }, [router]);

    const cargarDatos = async () => {
        try {
            const res = await fetch("/api/jefe");
            if (!res.ok) throw new Error("Error al cargar datos");
            const data = await res.json();
            setEmpleados(data.empleados || []); setClientes(data.clientes || []);
            setPresupuestos(data.presupuestos || []); setFacturas(data.facturas || []);
            setArticulos(data.articulos || []); setStatsEmpleados(data.statsEmpleados || []);
            setStats(data.stats || null);
        } catch (error) { console.error("Error cargando datos:", error); }
        finally { setLoading(false); }
    };

    const handleLogout = () => { sessionStorage.clear(); router.push("/login"); };

    const confirmarEntradaStock = async (entradas: EntradaStock[]) => {
        if (entradas.length === 0) return;
        setGuardandoEntrada(true);
        try {
            await Promise.all(entradas.map(({ articulo_id, cantidad }) => {
                const artActual = articulos.find(a => a.id === articulo_id);
                const stockNuevo = (artActual?.stock || 0) + cantidad;
                return fetch("/api/jefe", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: "stock", articulo_id, stock_nuevo: stockNuevo }) });
            }));
            setArticulos(prev => prev.map(a => { const entrada = entradas.find(e => e.articulo_id === a.id); return entrada ? { ...a, stock: a.stock + entrada.cantidad } : a; }));
            setModalEntradaStockAbierto(false);
        } catch { mostrarAlerta("Error de conexión."); }
        finally { setGuardandoEntrada(false); }
    };

    const guardarObjetivo = async (empleado_id: string) => {
        const valor = parseFloat(valorObjetivoEdit);
        if (isNaN(valor) || valor < 0) { mostrarAlerta("Introduce un valor válido."); return; }
        setGuardandoObjetivo(true);
        try {
            const res = await fetch("/api/jefe", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: "objetivo", empleado_id, objetivo: valor }) });
            if (!res.ok) { mostrarAlerta("No se pudo guardar el objetivo."); return; }
            setStatsEmpleados(prev => prev.map(e => e.id === empleado_id ? { ...e, objetivo_mes: valor } : e));
            setEditandoObjetivo(null); setValorObjetivoEdit("");
        } catch { mostrarAlerta("Error de conexión."); }
        finally { setGuardandoObjetivo(false); }
    };

    const actualizarStock = async (articulo_id: number, stock_nuevo: number) => {
        if (stock_nuevo < 0) { mostrarAlerta("El stock no puede ser negativo."); return; }
        setGuardandoStock(true);
        try {
            const res = await fetch("/api/jefe", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: "stock", articulo_id, stock_nuevo }) });
            if (!res.ok) { mostrarAlerta("No se pudo actualizar el stock."); return; }
            setArticulos(prev => prev.map(a => a.id === articulo_id ? { ...a, stock: stock_nuevo } : a));
            setEditandoStock(null);
        } catch { mostrarAlerta("Error de conexión."); }
        finally { setGuardandoStock(false); }
    };

    const generarFacturaPDF = (data: any, abrirEnVentana: boolean = true) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        doc.setFillColor(17, 24, 39); doc.rect(0, 0, pageWidth, 55, "F");
        doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(26);
        doc.text("AJCAR 25 - FACTURA", margin, 35);
        doc.setFontSize(11); doc.setFont("helvetica", "normal");
        doc.text(`Nº: ${data.numero_factura || data.id || "TEMP"}`, margin, 70);
        doc.text(`FECHA: ${new Date(data.fecha_emision || Date.now()).toLocaleDateString('es-ES')}`, pageWidth - margin, 70, { align: "right" });
        let y = 85;
        doc.setTextColor(0, 0, 0); doc.setFontSize(11); doc.setFont("helvetica", "bold");
        doc.text("DATOS DEL CLIENTE:", margin, y); y += 8;
        doc.setFont("helvetica", "normal"); doc.setFontSize(10);
        const clienteNombre = data.cliente_nombre || `${data.nombre || "N/A"} ${data.apellidos1 || ""}`.trim();
        doc.text(`Cliente: ${clienteNombre}`, margin, y); y += 7;
        if (data.vehiculo) { doc.text(`Vehículo: ${data.vehiculo}`, margin, y); y += 7; } y += 5;
        const tableBody = (data.articulos || []).filter((art: any) => art && (art.descripcion || art.nombre)).map((art: any) => [
            art.descripcion || art.nombre || "Artículo", String(Number(art.cantidad) || 1),
            `${Number(art.precio_unitario || art.precio || 0).toFixed(2)}€`,
            `${(Number(art.cantidad || 1) * Number(art.precio_unitario || art.precio || 0)).toFixed(2)}€`
        ]);
        autoTable(doc, { startY: y, head: [["DESCRIPCIÓN", "CANT.", "PRECIO UN.", "TOTAL"]], body: tableBody, theme: 'grid',
            headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: "bold", fontSize: 10, halign: "center" },
            styles: { fontSize: 9, cellPadding: 6, lineColor: [200, 200, 200] },
            columnStyles: { 0: { halign: "left", cellWidth: "auto" }, 1: { halign: "center", cellWidth: 25 }, 2: { halign: "right", cellWidth: 35 }, 3: { halign: "right", cellWidth: 35 } },
            margin: { left: margin, right: margin } });
        const finalY = (doc as any).lastAutoTable.finalY + 8;
        let total = data.total !== undefined ? Number(data.total) : 0; if (isNaN(total)) total = 0;
        doc.setFillColor(41, 128, 185); doc.rect(margin, finalY, pageWidth - margin * 2, 12, "F");
        doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
        doc.text("TOTAL FACTURA", margin + 8, finalY + 8.5); doc.setFontSize(14);
        doc.text(`${total.toFixed(2)}€`, pageWidth - margin - 8, finalY + 8.5, { align: "right" });
        doc.setTextColor(100, 100, 100); doc.setFontSize(9); doc.setFont("helvetica", "normal");
        doc.text("Gracias por confiar en AJCAR 25", margin, finalY + 30);
        if (abrirEnVentana) window.open(doc.output("bloburl"), "_blank");
        else doc.save(`Factura_${data.numero_factura || data.id}.pdf`);
        return doc.output('datauristring');
    };

    const abrirModalNuevo = () => { setForm(FORM_VACIO); setModoEdicion(false); setEmpleadoEditandoId(null); setErrorForm(""); setModalEmpleadoAbierto(true); };
    const abrirModalEditar = (emp: Empleado) => {
        setForm({ nombre: emp.nombre || "", apellido1: emp.apellido1 || "", apellido2: emp.apellido2 || "", email: emp.email || "", telefono: emp.telefono || "", password: "" });
        setModoEdicion(true); setEmpleadoEditandoId(emp.id); setErrorForm(""); setModalEmpleadoAbierto(true);
    };
    const cerrarModalEmpleado = () => { setModalEmpleadoAbierto(false); setErrorForm(""); };

    const guardarEmpleado = async () => {
        setErrorForm("");
        if (!form.nombre || !form.email || !form.telefono) { setErrorForm("Nombre, email y teléfono son obligatorios."); return; }
        if (modoEdicion) { setConfirmGuardarEmpleado(true); return; }
        await ejecutarGuardarEmpleado();
    };

    const ejecutarGuardarEmpleado = async () => {
        setConfirmGuardarEmpleado(false); setGuardando(true);
        try {
            if (modoEdicion && empleadoEditandoId) {
                const res = await fetch("/api/jefe", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: "empleado", empleado_id: empleadoEditandoId, ...form, password: form.password || undefined }) });
                if (!res.ok) { const d = await res.json(); setErrorForm(d.error || "Error al editar."); return; }
                setEmpleados(prev => prev.map(e => e.id === empleadoEditandoId ? { ...e, nombre: form.nombre, apellido1: form.apellido1, apellido2: form.apellido2, email: form.email, telefono: form.telefono } : e));
            } else {
                const res = await fetch("/api/jefe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
                const data = await res.json();
                if (!res.ok) { setErrorForm(data.error || "Error al crear empleado."); return; }
                setEmpleados(prev => [...prev, data.empleado]);
            }
            cerrarModalEmpleado();
        } catch { setErrorForm("Error de conexión. Inténtalo de nuevo."); }
        finally { setGuardando(false); }
    };

    const pedirConfirmacionEliminar = (empleado_id: string, nombre: string) => { setConfirmEliminar({ empleado_id, nombre }); };

    const ejecutarEliminarEmpleado = async () => {
        if (!confirmEliminar) return;
        setGuardandoEliminar(true);
        try {
            const res = await fetch("/api/jefe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ empleado_id: confirmEliminar.empleado_id }) });
            if (!res.ok) { mostrarAlerta("No se pudo eliminar el empleado."); return; }
            setEmpleados(prev => prev.filter(e => e.id !== confirmEliminar.empleado_id));
            setConfirmEliminar(null);
        } catch { mostrarAlerta("Error de conexión."); }
        finally { setGuardandoEliminar(false); }
    };

    const denegarAcceso = async (motivo: string) => {
        if (!clienteDenegar) return;
        setGuardandoAcceso(true);
        try {
            const res = await fetch("/api/jefe", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: "cliente", cliente_id: clienteDenegar.id, esta_activo: false, motivo_baja: motivo }) });
            if (!res.ok) { mostrarAlerta("No se pudo denegar el acceso."); return; }
            setClientes(prev => prev.map(c => c.id === clienteDenegar.id ? { ...c, esta_activo: false, motivo_baja: motivo } : c));
            setClienteDenegar(null);
        } catch { mostrarAlerta("Error de conexión."); }
        finally { setGuardandoAcceso(false); }
    };

    const restaurarAcceso = async (cliente: Cliente) => { setConfirmRestaurar(cliente); };

    const ejecutarRestaurarAcceso = async () => {
        if (!confirmRestaurar) return;
        setGuardandoRestaurar(true);
        try {
            const res = await fetch("/api/jefe", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: "cliente", cliente_id: confirmRestaurar.id, esta_activo: true, motivo_baja: null }) });
            if (!res.ok) { mostrarAlerta("No se pudo restaurar el acceso."); return; }
            setClientes(prev => prev.map(c => c.id === confirmRestaurar.id ? { ...c, esta_activo: true, motivo_baja: null } : c));
            setConfirmRestaurar(null);
        } catch { mostrarAlerta("Error de conexión."); }
        finally { setGuardandoRestaurar(false); }
    };

    const pedirConfirmacionEstado = (presupuesto_id: string, estadoNuevo: string, estadoActual: string, vehiculo: string) => {
        if (estadoNuevo === estadoActual) return;
        setConfirmEstado({ presupuesto_id, estadoNuevo, estadoActual, vehiculo });
    };

    const ejecutarCambioEstado = async () => {
        if (!confirmEstado) return;
        setGuardandoEstado(true);
        try {
            await fetch("/api/jefe", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ presupuesto_id: confirmEstado.presupuesto_id, estado: confirmEstado.estadoNuevo }) });
            setPresupuestos(prev => prev.map(p => p.id === confirmEstado.presupuesto_id ? { ...p, estado: confirmEstado.estadoNuevo } : p));
            setConfirmEstado(null);
        } catch { mostrarAlerta("No se pudo cambiar el estado."); }
        finally { setGuardandoEstado(false); }
    };

    const maxFacturado = Math.max(...statsEmpleados.map(e => Number(e.total_facturado)), 1);

    if (loading) return (
        <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Cargando panel...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0a0c] text-gray-400 font-sans">
            <div className="p-4 sm:p-8 lg:p-16 max-w-7xl mx-auto">

                {/* HEADER */}
                <header className="flex justify-between items-center mb-8 sm:mb-16 gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <img src="/imagenes/logo_ajcar25.png" alt="AJCAR 25" className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl object-contain flex-shrink-0" />
                        <div className="min-w-0">
                            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black italic text-white tracking-tighter truncate">Panel de Jefe</h1>
                            <p className="text-blue-500 text-xs sm:text-sm font-bold uppercase tracking-widest">AJCAR 25 — GESTIÓN</p>
                        </div>
                    </div>
                    <button onClick={() => setConfirmLogout(true)} className="flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl transition-all flex-shrink-0 text-sm">
                        <LogOut size={18} /> <span className="hidden sm:inline">Cerrar Sesión</span>
                    </button>
                </header>

                {/* TABS */}
                <div className="flex flex-wrap gap-1 sm:gap-2 mb-8 sm:mb-12 bg-white/[0.03] p-1 sm:p-1.5 rounded-2xl sm:rounded-3xl border border-white/5 w-full sm:w-fit">
                    {([
                        { key: "dashboard", label: "Dashboard" },
                        { key: "empleados", label: "Empleados" },
                        { key: "presupuestos", label: "Presupuestos" },
                        { key: "clientes", label: "Clientes" },
                        { key: "facturas", label: "Facturas" },
                        { key: "stock", label: "Stock" },
                        { key: "rendimiento", label: "Rendimiento" },
                    ] as { key: typeof view, label: string }[]).map((tab) => (
                        <button key={tab.key} onClick={() => setView(tab.key)}
                            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all ${view === tab.key ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* DASHBOARD */}
                {view === "dashboard" && stats && (
                    <div className="space-y-6 sm:space-y-10">
                        <h2 className="text-2xl sm:text-4xl font-black text-white mb-4 sm:mb-6">Resumen General</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            <StatCard label="Ingresos Totales" value={`${stats.totalIngresos.toFixed(2)} €`} color="border-green-500/20" icon={<Euro size={24} className="text-green-400" />} />
                            <StatCard label="Ingresos este mes" value={`${stats.ingresosMes.toFixed(2)} €`} color="border-blue-500/20" icon={<TrendingUp size={24} className="text-blue-400" />} />
                            <StatCard label="Total Clientes" value={stats.totalClientes} color="border-white/10" icon={<Users size={24} className="text-gray-400" />} />
                            <StatCard label="Empleados" value={stats.totalEmpleados} color="border-white/10" icon={<Wrench size={24} className="text-gray-400" />} />
                            <StatCard label="Presupuestos" value={stats.totalPresupuestos} color="border-white/10" icon={<Car size={24} className="text-gray-400" />} />
                            <StatCard label="Facturas emitidas" value={stats.totalFacturas} color="border-white/10" icon={<FileText size={24} className="text-gray-400" />} />
                        </div>
                        <div className="bg-[#0f0f12] rounded-[24px] sm:rounded-[40px] p-6 sm:p-10 border border-white/5">
                            <h3 className="text-xl sm:text-2xl font-black text-white mb-4 sm:mb-6">Presupuestos por Estado</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                                {stats.presupuestosPorEstado.map((item) => (
                                    <div key={item.estado} className="bg-white/[0.03] rounded-2xl p-4 sm:p-6 text-center border border-white/5">
                                        <p className="text-2xl sm:text-3xl font-black text-white mb-2 sm:mb-3">{item.cantidad}</p>
                                        <BadgeEstado estado={item.estado} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-[#0f0f12] rounded-[24px] sm:rounded-[40px] p-6 sm:p-10 border border-white/5">
                            <h3 className="text-xl sm:text-2xl font-black text-white mb-4 sm:mb-6">Últimas Facturas</h3>
                            {facturas.slice(0, 5).length > 0 ? (
                                <div className="space-y-3">
                                    {facturas.slice(0, 5).map((f) => (
                                        <div key={f.id} className="flex justify-between items-center bg-white/[0.02] border border-white/5 rounded-2xl px-4 sm:px-6 py-3 sm:py-4 gap-3">
                                            <div className="min-w-0">
                                                <p className="text-green-400 font-mono text-xs mb-1">#{f.numero_factura}</p>
                                                <p className="text-white font-medium text-sm truncate">{f.cliente_nombre} — {f.vehiculo}</p>
                                                {f.empleado_nombre && <p className="text-blue-400 text-xs mt-0.5">👤 {f.empleado_nombre} {f.empleado_apellido1 || ""}</p>}
                                            </div>
                                            <p className="text-green-400 font-black text-base sm:text-xl flex-shrink-0">{Number(f.total || 0).toFixed(2)} €</p>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-gray-500 text-sm">No hay facturas aún.</p>}
                        </div>
                    </div>
                )}

                {/* RENDIMIENTO */}
                {view === "rendimiento" && (
                    <div className="space-y-6 sm:space-y-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 sm:mb-6">
                            <h2 className="text-2xl sm:text-4xl font-black text-white">Rendimiento de Empleados</h2>
                            <span className="text-gray-500 text-sm capitalize">{mesActual}</span>
                        </div>
                        {statsEmpleados.length > 0 ? (
                            <>
                                <div className="bg-[#0f0f12] rounded-[24px] sm:rounded-[40px] p-6 sm:p-10 border border-white/5">
                                    <div className="flex items-center gap-3 mb-6 sm:mb-8">
                                        <Target size={22} className="text-blue-400" />
                                        <h3 className="text-xl sm:text-2xl font-black text-white">Objetivos del Mes</h3>
                                    </div>
                                    <div className="space-y-4 sm:space-y-6">
                                        {statsEmpleados.map((emp) => {
                                            const facturado = Number(emp.facturado_mes);
                                            const objetivo = Number(emp.objetivo_mes);
                                            const porcentaje = objetivo > 0 ? Math.min((facturado / objetivo) * 100, 100) : 0;
                                            const superado = objetivo > 0 && facturado >= objetivo;
                                            return (
                                                <div key={emp.id} className={`bg-white/[0.02] border rounded-2xl px-4 sm:px-6 py-4 sm:py-5 transition-all ${superado ? "border-green-500/30 bg-green-500/5" : "border-white/5"}`}>
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400 font-black">{(emp.nombre || "?")[0].toUpperCase()}</div>
                                                            <div>
                                                                <p className="text-white font-bold text-sm">{emp.nombre} {emp.apellido1 || ""}</p>
                                                                {emp.matricula && <p className="text-gray-600 text-xs font-mono">{emp.matricula}</p>}
                                                            </div>
                                                            {superado && <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 sm:px-3 py-1 rounded-full font-bold">✓ Objetivo</span>}
                                                        </div>
                                                        <div className="text-left sm:text-right">
                                                            <p className="text-blue-400 font-bold text-sm">{facturado.toFixed(2)} € <span className="text-gray-600 font-normal text-xs">facturado</span></p>
                                                            {editandoObjetivo === emp.id ? (
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <div className="relative">
                                                                        <input type="number" min="0" value={valorObjetivoEdit} onChange={(e) => setValorObjetivoEdit(e.target.value)}
                                                                            onKeyDown={(e) => { if (e.key === "Enter") guardarObjetivo(emp.id); if (e.key === "Escape") setEditandoObjetivo(null); }}
                                                                            placeholder="0.00" autoFocus
                                                                            className="w-28 sm:w-32 bg-white/5 border border-blue-500/50 text-white text-center rounded-xl px-3 py-2 text-sm font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none">€</span>
                                                                    </div>
                                                                    <button onClick={() => guardarObjetivo(emp.id)} disabled={guardandoObjetivo} className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all"><Check size={14} /></button>
                                                                    <button onClick={() => { setEditandoObjetivo(null); setValorObjetivoEdit(""); }} className="w-8 h-8 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl flex items-center justify-center transition-all"><X size={14} /></button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <p className="text-gray-500 text-xs">Objetivo: <span className="text-white font-bold">{objetivo > 0 ? `${objetivo.toFixed(2)} €` : "Sin definir"}</span></p>
                                                                    <button onClick={() => { setEditandoObjetivo(emp.id); setValorObjetivoEdit(objetivo > 0 ? objetivo.toString() : ""); }} className="w-6 h-6 bg-white/5 hover:bg-blue-500/20 text-gray-500 hover:text-blue-400 rounded-lg flex items-center justify-center transition-all"><Pencil size={11} /></button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="w-full bg-white/5 rounded-full h-2 sm:h-2.5 mt-2">
                                                        <div className={`h-2 sm:h-2.5 rounded-full transition-all duration-700 ${superado ? "bg-green-500" : objetivo > 0 ? "bg-blue-500" : "bg-white/10"}`} style={{ width: `${porcentaje}%` }} />
                                                    </div>
                                                    {objetivo > 0 && <p className="text-xs text-gray-600 mt-1.5 text-right">{porcentaje.toFixed(0)}% del objetivo</p>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="bg-[#0f0f12] rounded-[24px] sm:rounded-[40px] p-6 sm:p-10 border border-white/5">
                                    <div className="flex items-center gap-3 mb-6 sm:mb-8">
                                        <Trophy size={22} className="text-yellow-400" />
                                        <h3 className="text-xl sm:text-2xl font-black text-white">Ranking por Facturación</h3>
                                    </div>
                                    <div className="space-y-3 sm:space-y-4">
                                        {statsEmpleados.map((emp, idx) => {
                                            const porcentaje = (Number(emp.total_facturado) / maxFacturado) * 100;
                                            const barColors = ["bg-yellow-500", "bg-gray-400", "bg-amber-700"];
                                            const barColor = idx < 3 ? barColors[idx] : "bg-blue-600";
                                            return (
                                                <div key={emp.id} className="bg-white/[0.02] border border-white/5 rounded-2xl px-4 sm:px-6 py-4 sm:py-5 hover:border-white/10 transition-all">
                                                    <div className="flex items-center justify-between mb-3 gap-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <span className="text-xl sm:text-2xl flex-shrink-0">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}</span>
                                                            <div className="min-w-0">
                                                                <p className="text-white font-bold text-sm truncate">{emp.nombre} {emp.apellido1 || ""}</p>
                                                                {emp.matricula && <p className="text-gray-600 text-xs font-mono">{emp.matricula}</p>}
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <p className="text-green-400 font-black text-base sm:text-xl">{Number(emp.total_facturado).toFixed(2)} €</p>
                                                            <p className="text-gray-500 text-xs">{emp.total_facturas} facturas</p>
                                                        </div>
                                                    </div>
                                                    <div className="w-full bg-white/5 rounded-full h-2">
                                                        <div className={`${barColor} h-2 rounded-full transition-all duration-700`} style={{ width: `${porcentaje}%` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-[#0f0f12] rounded-[24px] sm:rounded-[40px] p-12 sm:p-20 text-center border border-white/5">
                                <Trophy size={60} className="mx-auto mb-6 text-gray-600" />
                                <p className="text-xl sm:text-2xl font-bold text-white mb-3">No hay datos de rendimiento aún</p>
                                <p className="text-gray-500 text-sm">Cuando los empleados generen facturas aparecerán sus estadísticas aquí.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* EMPLEADOS */}
                {view === "empleados" && (
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex justify-between items-center mb-6 sm:mb-10 gap-4">
                            <h2 className="text-2xl sm:text-4xl font-black text-white">Empleados <span className="text-gray-500 text-lg sm:text-2xl font-normal">({empleados.length})</span></h2>
                            <button onClick={abrirModalNuevo} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-2xl font-bold transition-all text-sm flex-shrink-0">
                                <Plus size={16} /> <span className="hidden sm:inline">Añadir </span>Empleado
                            </button>
                        </div>
                        {empleados.length > 0 ? empleados.map((emp) => (
                            <div key={emp.id} className="bg-[#0f0f12] border border-white/10 rounded-[24px] sm:rounded-[40px] p-6 sm:p-10 flex flex-col sm:flex-row justify-between gap-4 sm:gap-6 items-start">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-400 font-black text-lg sm:text-xl flex-shrink-0">{(emp.nombre || "?")[0].toUpperCase()}</div>
                                        <div className="min-w-0">
                                            <p className="text-white font-bold text-base sm:text-lg truncate">{emp.nombre} {emp.apellido1} {emp.apellido2}</p>
                                            <p className="text-gray-500 text-sm truncate">{emp.email}</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-500 text-sm">📞 {emp.telefono}</p>
                                    {emp.matricula && (
                                        <div className="mt-2 inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-1">
                                            <span className="text-blue-400 text-xs uppercase tracking-widest">Matrícula</span>
                                            <span className="text-white font-mono font-bold text-sm">{emp.matricula}</span>
                                        </div>
                                    )}
                                    <p className="text-gray-600 text-xs mt-2">Registrado: {new Date(emp.fecha_registro).toLocaleDateString("es-ES")}</p>
                                </div>
                                <div className="flex flex-row sm:flex-col gap-3 items-center sm:items-end flex-shrink-0 w-full sm:w-auto">
                                    <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold uppercase tracking-widest ${emp.esta_activo ? "bg-green-600/20 text-green-400 border border-green-500/30" : "bg-red-600/20 text-red-400 border border-red-500/30"}`}>
                                        {emp.esta_activo ? "Activo" : "Inactivo"}
                                    </span>
                                    <div className="flex gap-2 ml-auto sm:ml-0">
                                        <button onClick={() => abrirModalEditar(emp)} className="w-9 h-9 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-xl flex items-center justify-center transition-all"><Pencil size={15} /></button>
                                        <button onClick={() => pedirConfirmacionEliminar(emp.id, emp.nombre)} className="w-9 h-9 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-xl flex items-center justify-center transition-all"><Trash2 size={15} /></button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-[#0f0f12] rounded-[24px] sm:rounded-[40px] p-12 sm:p-20 text-center border border-white/5">
                                <Users size={60} className="mx-auto mb-6 text-gray-600" />
                                <p className="text-xl sm:text-2xl font-bold text-white mb-3">No hay empleados registrados</p>
                            </div>
                        )}
                    </div>
                )}

                {/* PRESUPUESTOS */}
                {view === "presupuestos" && (
                    <div className="space-y-4 sm:space-y-6">
                        <h2 className="text-2xl sm:text-4xl font-black text-white mb-6 sm:mb-10">Presupuestos <span className="text-gray-500 text-lg sm:text-2xl font-normal">({presupuestos.length})</span></h2>
                        {presupuestos.length > 0 ? presupuestos.map((p) => (
                            <div key={p.id} className="bg-[#0f0f12] border border-white/10 rounded-[24px] sm:rounded-[40px] p-5 sm:p-10 flex flex-col sm:flex-row justify-between gap-4 sm:gap-6 items-start">
                                <div className="flex-1 min-w-0">
                                    <div className="mb-2 sm:mb-3"><BadgeEstado estado={p.estado} /></div>
                                    <h3 className="text-white font-black text-base sm:text-xl mb-1 truncate">{p.vehiculo}</h3>
                                    <p className="text-gray-400 text-sm truncate">{p.nombre} — {p.email}</p>
                                    <p className="text-gray-600 text-xs mt-1">{new Date(p.creado_en).toLocaleDateString("es-ES")}</p>
                                </div>
                                <div className="w-full sm:min-w-[200px] sm:w-auto">
                                    <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Cambiar estado</p>
                                    <select value={p.estado} onChange={(e) => pedirConfirmacionEstado(p.id, e.target.value, p.estado, p.vehiculo)}
                                        className="w-full bg-[#0f0f12] border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 [&>option]:bg-[#1a1a1f] [&>option]:text-white">
                                        <option value="pendiente">Pendiente</option>
                                        <option value="En Taller">En Taller</option>
                                        <option value="Facturado">Facturado</option>
                                        <option value="Cancelado">Cancelado</option>
                                    </select>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-[#0f0f12] rounded-[24px] sm:rounded-[40px] p-12 sm:p-20 text-center border border-white/5">
                                <Car size={60} className="mx-auto mb-6 text-gray-600" />
                                <p className="text-xl sm:text-2xl font-bold text-white mb-3">No hay presupuestos</p>
                            </div>
                        )}
                    </div>
                )}

                {/* CLIENTES */}
                {view === "clientes" && (
                    <div className="space-y-4 sm:space-y-6">
                        <h2 className="text-2xl sm:text-4xl font-black text-white mb-6 sm:mb-10">Clientes <span className="text-gray-500 text-lg sm:text-2xl font-normal">({clientes.length})</span></h2>
                        {clientes.length > 0 ? clientes.map((c) => (
                            <div key={c.id} className={`bg-[#0f0f12] border rounded-[24px] sm:rounded-[40px] p-5 sm:p-10 flex flex-col sm:flex-row justify-between gap-4 sm:gap-6 items-start transition-all ${!c.esta_activo ? "border-red-500/20 bg-red-500/5" : "border-white/10"}`}>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl flex-shrink-0 ${c.esta_activo ? "bg-gray-600/30 text-gray-300" : "bg-red-600/20 text-red-400"}`}>{(c.nombre || "?")[0].toUpperCase()}</div>
                                        <div className="min-w-0">
                                            <p className="text-white font-bold text-base sm:text-lg truncate">{c.nombre} {c.apellido1} {c.apellido2}</p>
                                            <p className="text-gray-500 text-sm truncate">{c.email}</p>
                                        </div>
                                    </div>
                                    <p className="text-gray-500 text-sm">📞 {c.telefono}</p>
                                    <p className="text-gray-600 text-xs mt-1">Registrado: {new Date(c.fecha_registro).toLocaleDateString("es-ES")}</p>
                                    {!c.esta_activo && c.motivo_baja && (
                                        <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 inline-block">
                                            <p className="text-red-400 text-xs font-bold">Motivo: {c.motivo_baja}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-row sm:flex-col gap-2 sm:gap-3 items-center sm:items-end flex-shrink-0 w-full sm:w-auto flex-wrap">
                                    <div className="flex gap-2">
                                        <span className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-blue-600/20 text-blue-400 border border-blue-500/30 capitalize">{c.tipo_cliente || "Particular"}</span>
                                        <span className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold uppercase tracking-widest ${c.esta_activo ? "bg-green-600/20 text-green-400 border border-green-500/30" : "bg-red-600/20 text-red-400 border border-red-500/30"}`}>
                                            {c.esta_activo ? "Activo" : "Bloqueado"}
                                        </span>
                                    </div>
                                    {c.esta_activo ? (
                                        <button onClick={() => setClienteDenegar(c)} className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ml-auto sm:ml-0">
                                            <ShieldOff size={14} /> Denegar
                                        </button>
                                    ) : (
                                        <button onClick={() => restaurarAcceso(c)} className="flex items-center gap-2 bg-green-600/20 hover:bg-green-600/40 text-green-400 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ml-auto sm:ml-0">
                                            <ShieldCheck size={14} /> Restaurar
                                        </button>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <div className="bg-[#0f0f12] rounded-[24px] sm:rounded-[40px] p-12 sm:p-20 text-center border border-white/5">
                                <Users size={60} className="mx-auto mb-6 text-gray-600" />
                                <p className="text-xl sm:text-2xl font-bold text-white mb-3">No hay clientes registrados</p>
                            </div>
                        )}
                    </div>
                )}

                {/* FACTURAS */}
                {view === "facturas" && (
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-10">
                            <h2 className="text-2xl sm:text-4xl font-black text-white">Facturas <span className="text-gray-500 text-lg sm:text-2xl font-normal">({facturas.length})</span></h2>
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 sm:px-4 py-2 w-full sm:w-72">
                                <Search size={15} className="text-gray-500 flex-shrink-0" />
                                <input type="text" value={filtroFacturas} onChange={(e) => setFiltroFacturas(e.target.value)}
                                    placeholder="Filtrar por matrícula o vehículo..."
                                    className="bg-transparent text-white text-sm focus:outline-none w-full placeholder:text-gray-600" />
                                {filtroFacturas && (
                                    <button onClick={() => setFiltroFacturas("")} className="text-gray-500 hover:text-white transition-colors flex-shrink-0"><X size={14} /></button>
                                )}
                            </div>
                        </div>
                        {(() => {
                            const facturasFiltradas = filtroFacturas.trim()
                                ? facturas.filter(f => {
                                    const t = filtroFacturas.toLowerCase();
                                    return (f.vehiculo || "").toLowerCase().includes(t) ||
                                           (f.matricula || "").toLowerCase().includes(t) ||
                                           (f.cliente_nombre || "").toLowerCase().includes(t);
                                  })
                                : facturas;
                            if (facturasFiltradas.length === 0) return (
                                <div className="bg-[#0f0f12] rounded-[24px] sm:rounded-[40px] p-12 sm:p-20 text-center border border-white/5">
                                    <FileText size={60} className="mx-auto mb-6 text-gray-600" />
                                    <p className="text-xl sm:text-2xl font-bold text-white mb-3">
                                        {filtroFacturas ? "Sin resultados" : "No hay facturas emitidas"}
                                    </p>
                                    {filtroFacturas && <p className="text-gray-500 text-sm">No hay facturas con "{filtroFacturas}"</p>}
                                </div>
                            );
                            return facturasFiltradas.map((f) => (
                                <div key={f.id} className="bg-[#0f0f12] border border-green-500/20 rounded-[24px] sm:rounded-[40px] p-5 sm:p-10 flex flex-col sm:flex-row justify-between gap-4 sm:gap-6 items-start">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-green-400 font-mono text-sm mb-1">#{f.numero_factura}</p>
                                        <h3 className="text-white font-black text-base sm:text-xl mb-1 truncate">{f.vehiculo}</h3>
                                        {f.matricula && <p className="text-blue-400 font-mono text-xs font-bold mb-1">{f.matricula}</p>}
                                        <p className="text-gray-400 text-sm truncate">{f.cliente_nombre}</p>
                                        <p className="text-gray-600 text-xs mt-1">{f.fecha_emision ? new Date(f.fecha_emision).toLocaleDateString("es-ES") : "—"}</p>
                                        {f.empleado_nombre ? (
                                            <div className="mt-2 sm:mt-3 inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-1.5">
                                                <Wrench size={12} className="text-blue-400" />
                                                <span className="text-blue-400 text-xs font-bold">{f.empleado_nombre} {f.empleado_apellido1 || ""}</span>
                                            </div>
                                        ) : (
                                            <div className="mt-2 sm:mt-3 inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                                                <span className="text-gray-500 text-xs">Sin empleado asignado</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-4 flex-shrink-0 w-full sm:w-auto">
                                        <p className="text-2xl sm:text-4xl font-black text-green-400 tracking-tighter">{Number(f.total || 0).toFixed(2)} €</p>
                                        <button onClick={() => generarFacturaPDF(f, false)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-2xl font-bold transition-all text-sm ml-auto sm:ml-0">
                                            <Download size={14} /> <span className="hidden sm:inline">Descargar </span>PDF
                                        </button>
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                )}

                {/* STOCK */}
                {view === "stock" && (
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-10">
                            <h2 className="text-2xl sm:text-4xl font-black text-white">Stock <span className="text-gray-500 text-lg sm:text-2xl font-normal">({articulos.length})</span></h2>
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
                                <button onClick={() => setModalEntradaStockAbierto(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl font-bold text-sm transition-all">
                                    <PackagePlus size={15} /> Entrada
                                </button>
                                <div className="flex items-center gap-2 sm:gap-3 bg-white/5 border border-white/10 rounded-2xl px-3 sm:px-4 py-2 flex-1 sm:w-72">
                                    <Search size={15} className="text-gray-500 flex-shrink-0" />
                                    <input type="text" value={filtroStock} onChange={(e) => setFiltroStock(e.target.value)} placeholder="Buscar artículo..."
                                        className="bg-transparent text-white text-sm focus:outline-none w-full placeholder:text-gray-600" />
                                </div>
                            </div>
                        </div>
                        {articulos.filter(a => { const t = filtroStock.toLowerCase(); return a.codigo.toLowerCase().includes(t) || a.descripcion.toLowerCase().includes(t); }).length > 0 ? (
                            <div className="bg-[#0f0f12] rounded-[24px] sm:rounded-[40px] border border-white/5 overflow-hidden overflow-x-auto">
                                <div className="grid grid-cols-12 gap-2 sm:gap-4 px-4 sm:px-8 py-3 sm:py-4 bg-white/[0.02] border-b border-white/5 text-xs font-black uppercase tracking-widest text-gray-500 min-w-[400px]">
                                    <div className="col-span-3 sm:col-span-2">Código</div>
                                    <div className="col-span-5">Descripción</div>
                                    <div className="col-span-2 text-right hidden sm:block">Precio</div>
                                    <div className="col-span-4 sm:col-span-3 text-center">Stock</div>
                                </div>
                                <div className="min-w-[400px]">
                                    {articulos.filter(a => { const t = filtroStock.toLowerCase(); return a.codigo.toLowerCase().includes(t) || a.descripcion.toLowerCase().includes(t); }).map((art) => (
                                        <div key={art.id} className="grid grid-cols-12 gap-2 sm:gap-4 px-4 sm:px-8 py-3 sm:py-5 border-b border-white/5 hover:bg-white/[0.02] transition-colors items-center">
                                            <div className="col-span-3 sm:col-span-2"><span className="text-blue-400 font-mono text-xs sm:text-sm font-bold">{art.codigo}</span></div>
                                            <div className="col-span-5"><p className="text-white text-xs sm:text-sm font-medium truncate">{art.descripcion}</p></div>
                                            <div className="col-span-2 text-right hidden sm:block"><span className="text-gray-400 text-sm">{Number(art.precio_unitario).toFixed(2)}€</span></div>
                                            <div className="col-span-4 sm:col-span-3 flex items-center justify-center gap-1 sm:gap-3">
                                                {editandoStock === art.id ? (
                                                    <>
                                                        <button onClick={() => { const v = Math.max(0, valorStockEdit - 1); setValorStockEdit(v); }} className="w-7 h-7 sm:w-8 sm:h-8 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-xl flex items-center justify-center font-black text-lg transition-all">−</button>
                                                        <input type="number" min="0" value={valorStockEdit} onChange={(e) => setValorStockEdit(Math.max(0, parseInt(e.target.value) || 0))} className="w-12 sm:w-16 bg-white/5 border border-blue-500/50 text-white text-center rounded-xl px-1 sm:px-2 py-1 text-sm font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                                        <button onClick={() => { const v = valorStockEdit + 1; setValorStockEdit(v); }} className="w-7 h-7 sm:w-8 sm:h-8 bg-white/5 hover:bg-green-500/20 text-green-400 rounded-xl flex items-center justify-center font-black text-lg transition-all">+</button>
                                                        <button onClick={() => actualizarStock(art.id, valorStockEdit)} disabled={guardandoStock} className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0"><Check size={12} /></button>
                                                        <button onClick={() => setEditandoStock(null)} className="w-7 h-7 sm:w-8 sm:h-8 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl flex items-center justify-center transition-all flex-shrink-0"><X size={12} /></button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className={`text-xl sm:text-2xl font-black ${art.stock === 0 ? "text-red-400" : art.stock < 5 ? "text-yellow-400" : "text-white"}`}>{art.stock}</span>
                                                        <button onClick={() => { setEditandoStock(art.id); setValorStockEdit(art.stock); }} className="w-7 h-7 sm:w-8 sm:h-8 bg-white/5 hover:bg-blue-500/20 text-gray-500 hover:text-blue-400 rounded-xl flex items-center justify-center transition-all"><Pencil size={12} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-[#0f0f12] rounded-[24px] sm:rounded-[40px] p-12 sm:p-20 text-center border border-white/5">
                                <Package size={60} className="mx-auto mb-6 text-gray-600" />
                                <p className="text-xl sm:text-2xl font-bold text-white mb-3">No se encontraron artículos</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {modalEmpleadoAbierto && (
                <ModalEmpleado titulo={modoEdicion ? "Editar Empleado" : "Nuevo Empleado"} form={form} setForm={setForm}
                    onGuardar={guardarEmpleado} onCerrar={cerrarModalEmpleado} guardando={guardando} error={errorForm} modoEdicion={modoEdicion} />
            )}
            {clienteDenegar && (
                <ModalDenegarAcceso cliente={clienteDenegar} onConfirmar={denegarAcceso}
                    onCerrar={() => setClienteDenegar(null)} guardando={guardandoAcceso} />
            )}
            {modalEntradaStockAbierto && (
                <ModalEntradaStock articulos={articulos} onCerrar={() => setModalEntradaStockAbierto(false)}
                    onConfirmar={confirmarEntradaStock} guardando={guardandoEntrada} />
            )}
            {confirmEstado && (
                <ModalConfirmar titulo="Cambiar Estado"
                    mensaje={`¿Cambiar el estado de "${confirmEstado.vehiculo}" de "${confirmEstado.estadoActual}" a "${confirmEstado.estadoNuevo}"?`}
                    detalle="Esta acción actualizará el estado del presupuesto inmediatamente."
                    onConfirmar={ejecutarCambioEstado} onCerrar={() => setConfirmEstado(null)} guardando={guardandoEstado} />
            )}
            {confirmEliminar && (
                <ModalConfirmar titulo="Eliminar Empleado"
                    mensaje={`¿Estás seguro de que quieres eliminar a ${confirmEliminar.nombre}?`}
                    detalle="Esta acción no se puede deshacer."
                    onConfirmar={ejecutarEliminarEmpleado} onCerrar={() => setConfirmEliminar(null)}
                    guardando={guardandoEliminar} colorBoton="bg-red-600 hover:bg-red-700" />
            )}
            {confirmRestaurar && (
                <ModalConfirmar titulo="Restaurar Acceso"
                    mensaje={`¿Restaurar el acceso a ${confirmRestaurar.nombre} ${confirmRestaurar.apellido1 || ""}?`}
                    detalle="El cliente podrá volver a acceder a su cuenta."
                    onConfirmar={ejecutarRestaurarAcceso} onCerrar={() => setConfirmRestaurar(null)}
                    guardando={guardandoRestaurar} colorBoton="bg-green-600 hover:bg-green-700" />
            )}
            {confirmGuardarEmpleado && (
                <ModalConfirmar titulo="Guardar cambios"
                    mensaje="¿Confirmas que quieres guardar los cambios en este empleado?"
                    detalle="Los datos actuales serán reemplazados por los nuevos."
                    onConfirmar={ejecutarGuardarEmpleado} onCerrar={() => setConfirmGuardarEmpleado(false)} />
            )}
            {confirmLogout && (
                <ModalConfirmar titulo="Cerrar Sesión"
                    mensaje="¿Estás seguro de que quieres cerrar sesión?"
                    detalle="Tendrás que volver a introducir tus credenciales para acceder."
                    onConfirmar={() => { setConfirmLogout(false); handleLogout(); }}
                    onCerrar={() => setConfirmLogout(false)} colorBoton="bg-red-600 hover:bg-red-700" />
            )}
            {alerta && <ModalAlerta mensaje={alerta} onCerrar={() => setAlerta(null)} />}
        </div>
    );
}
