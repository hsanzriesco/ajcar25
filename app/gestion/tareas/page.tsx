"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut, Mail, Phone, Plus, Trash2, Send, Loader2, Car, Search,
  CheckCircle, Printer, MessageSquare, Wrench, X, FilePlus2,
  UserPlus, ChevronRight, ChevronLeft, AlertCircle, Package,
  History, FileText, Briefcase, Check, AlertTriangle
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Articulo {
  id: number;
  codigo: string;
  descripcion: string;
  precio_unitario: number;
  stock: number;
  stock_reservado: number;
}

interface LineaPresupuesto extends Articulo {
  cantidad: number;
}

interface Factura {
  id: string;
  numero_factura?: string;
  cliente_nombre: string;
  vehiculo: string;
  matricula?: string;
  total: number;
  fecha_emision: string;
  articulos?: any[];
}

interface PresupuestoPedido {
  id: string;
  nombre: string;
  apellidos1: string;
  apellidos2: string;
  email: string;
  telefono: string;
  vehiculo: string;
  anio: number;
  fecha_cita: string;
  hora_cita: string;
  mensaje: string;
  estado: string;
  creado_en: string;
  articulos: LineaPresupuesto[];
  documento_identidad?: string;
}

// ✅ Modal de confirmación estilizado
const ModalConfirmar = ({ titulo, mensaje, detalle, onConfirmar, onCerrar, guardando, colorBoton = "bg-blue-600 hover:bg-blue-700" }: {
  titulo: string; mensaje: string; detalle?: string;
  onConfirmar: () => void; onCerrar: () => void;
  guardando?: boolean; colorBoton?: string;
}) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[130] p-4">
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
        <button onClick={onCerrar} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 py-3 rounded-xl font-bold transition-all">Cancelar</button>
        <button onClick={onConfirmar} disabled={guardando}
          className={`flex-1 ${colorBoton} disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2`}>
          <Check size={16} /> {guardando ? "Procesando..." : "Confirmar"}
        </button>
      </div>
    </div>
  </div>
);

// ✅ Modal de alerta estilizado (reemplaza AlertModal externo)
const ModalAlerta = ({ titulo, mensaje, tipo, onCerrar }: {
  titulo: string; mensaje: string;
  tipo: "success" | "error" | "warning" | "info";
  onCerrar: () => void;
}) => {
  const colores = {
    success: { bg: "bg-green-500/10", icon: "text-green-400", btn: "bg-green-600 hover:bg-green-700" },
    error:   { bg: "bg-red-500/10",   icon: "text-red-400",   btn: "bg-white/5 hover:bg-white/10" },
    warning: { bg: "bg-yellow-500/10",icon: "text-yellow-400",btn: "bg-white/5 hover:bg-white/10" },
    info:    { bg: "bg-blue-500/10",  icon: "text-blue-400",  btn: "bg-white/5 hover:bg-white/10" },
  };
  const c = colores[tipo];
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-[140] p-0 sm:p-4">
      <div className="bg-[#0f0f12] border border-white/10 rounded-t-[30px] sm:rounded-[40px] p-6 sm:p-10 w-full max-w-md">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />
        <div className="flex items-center gap-3 sm:gap-4 mb-5">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 ${c.bg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
            <AlertTriangle size={20} className={c.icon} />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">{titulo}</h3>
        </div>
        <p className="text-gray-300 text-sm mb-6 sm:mb-8 leading-relaxed">{mensaje}</p>
        <button onClick={onCerrar} className={`w-full ${c.btn} text-white py-3 rounded-xl font-bold transition-all`}>
          Entendido
        </button>
      </div>
    </div>
  );
};

export default function EmpleadoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    }>
      <EmpleadoContent />
    </Suspense>
  );
}

function EmpleadoContent() {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"mantenimientos" | "presupuestos" | "aceptados" | "stock" | "facturas">("presupuestos");
  const [panelAbierto, setPanelAbierto] = useState(false);

  const [presupuestos, setPresupuestos] = useState<PresupuestoPedido[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [seleccionado, setSeleccionado] = useState<PresupuestoPedido | null>(null);
  const [facturas, setFacturas] = useState<any[]>([]);

  const [codigoBusqueda, setCodigoBusqueda] = useState("");
  const [filtroStock, setFiltroStock] = useState("");
  const [filtroFacturas, setFiltroFacturas] = useState("");
  const [lineas, setLineas] = useState<LineaPresupuesto[]>([]);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [facturando, setFacturando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelando, setCancelando] = useState(false);

  const [showNuevoPresupuesto, setShowNuevoPresupuesto] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [showModalNuevoUsuario, setShowModalNuevoUsuario] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [usuarioExiste, setUsuarioExiste] = useState(false);
  const [sugerencias, setSugerencias] = useState<Articulo[]>([]);

  const [dniError, setDniError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [confirmLogout, setConfirmLogout] = useState(false);

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "", apellidos: "", email: "", telefono: "",
    documento_identidad: "", vehiculo: "", anio: new Date().getFullYear(), mensaje: "", tipo_cliente: "particular"
  });

  // ✅ Estado para ModalAlerta inline (reemplaza AlertModal externo)
  const [alerta, setAlerta] = useState<{
    visible: boolean; titulo: string; mensaje: string;
    tipo: "success" | "error" | "warning" | "info";
  }>({ visible: false, titulo: "", mensaje: "", tipo: "info" });

  const router = useRouter();

  const showAlert = (title: string, message: string, type: "success" | "error" | "warning" | "info" = "info") =>
    setAlerta({ visible: true, titulo: title, mensaje: message, tipo: type });
  const closeAlert = () => setAlerta(prev => ({ ...prev, visible: false }));

  const cargarTodo = useCallback(async () => {
    setLoading(true);
    try {
      const [resPres, resArt, resFac] = await Promise.all([fetch("/api/presupuestos"), fetch("/api/articulos"), fetch("/api/facturas")]);
      if (resPres.ok) setPresupuestos(await resPres.json());
      if (resArt.ok) setArticulos(await resArt.json());
      if (resFac.ok) setFacturas(await resFac.json());
    } catch (error) {
      showAlert("Error de carga", "No se pudieron cargar los datos.", "error");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const role = sessionStorage.getItem("user_role");
    if (!role) { router.push("/login"); return; }
    setNombreUsuario(sessionStorage.getItem("user_name") || "Trabajador");
    cargarTodo();

    // ✅ Refresco automático cada 15 segundos sin mostrar spinner
    const intervalo = setInterval(async () => {
      try {
        const [resPres, resArt, resFac] = await Promise.all([
          fetch("/api/presupuestos"),
          fetch("/api/articulos"),
          fetch("/api/facturas")
        ]);
        if (resPres.ok) setPresupuestos(await resPres.json());
        if (resArt.ok) setArticulos(await resArt.json());
        if (resFac.ok) setFacturas(await resFac.json());
      } catch { /* silencioso */ }
    }, 15000);

    return () => clearInterval(intervalo);
  }, [router, cargarTodo]);

  const validarEmail = (email: string): string => {
    if (!email || email.trim() === "") return "El correo electrónico es obligatorio";
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) return "El formato del correo electrónico no es válido";
    return "";
  };

  const validarDNI = (dni: string) => {
    if (!dni) { setDniError(""); return; }
    const valor = dni.toUpperCase().trim();
    const dniRegex = /^[0-9]{8}[A-Z]$/;
    const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;
    const cifRegex = /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/;
    if (dniRegex.test(valor) || nieRegex.test(valor) || cifRegex.test(valor)) setDniError("");
    else setDniError("El formato del DNI / NIE / CIF no es válido");
  };

  const verificarUsuario = async () => {
    const dni = nuevoCliente.documento_identidad.trim().toUpperCase();
    if (!dni) return;
    validarDNI(dni);
    if (dniError) return;
    setVerificando(true);
    try {
      const res = await fetch(`/api/usuarios?dni=${encodeURIComponent(dni)}`);
      const data = await res.json();
      if (res.ok && data.existe) {
        setUsuarioExiste(true);
        setNuevoCliente(prev => ({ ...prev, nombre: data.usuario.nombre || prev.nombre, apellidos: `${data.usuario.apellido1 || ""} ${data.usuario.apellido2 || ""}`.trim(), email: data.usuario.email || prev.email, telefono: data.usuario.telefono || prev.telefono, documento_identidad: data.usuario.documento_identidad || prev.documento_identidad, tipo_cliente: data.usuario.tipo_cliente || "Particular" }));
        showAlert("Cliente encontrado", "Los datos se han cargado automáticamente.", "success");
      } else { setUsuarioExiste(false); setShowModalNuevoUsuario(true); }
    } catch { showAlert("Error", "No se pudo verificar el DNI.", "error"); }
    finally { setVerificando(false); }
  };

  const crearUsuarioYContinuar = async () => {
    if (!nuevoCliente.documento_identidad || !nuevoCliente.nombre || !nuevoCliente.email) { showAlert("Datos incompletos", "El DNI, Nombre y Email son obligatorios", "warning"); return; }
    const errorEmail = validarEmail(nuevoCliente.email);
    if (errorEmail) { setEmailError(errorEmail); showAlert("Correo inválido", errorEmail, "warning"); return; } else setEmailError("");
    const telefonoLimpio = nuevoCliente.telefono.replace(/[\s\-\(\)\.]/g, "");
    if (!telefonoLimpio || !/^[6-9]\d{8}$/.test(telefonoLimpio)) { showAlert("Teléfono inválido", "El teléfono debe tener 9 dígitos empezando por 6-9", "warning"); return; }
    const partes = nuevoCliente.apellidos.trim().split(/\s+/);
    const ape1 = partes[0]?.toUpperCase() || "";
    const ape2 = partes.slice(1).join(" ").toUpperCase() || "";
    setVerificando(true);
    try {
      const resUsuario = await fetch("/api/usuarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: nuevoCliente.nombre.trim().toUpperCase(), apellido1: ape1, apellido2: ape2, email: nuevoCliente.email.trim().toLowerCase(), telefono: telefonoLimpio, documento_identidad: nuevoCliente.documento_identidad.trim().toUpperCase(), tipo_cliente: nuevoCliente.tipo_cliente }) });
      const data: any = await resUsuario.json().catch(() => ({}));
      if (resUsuario.ok) { setUsuarioExiste(true); setShowModalNuevoUsuario(false); showAlert("¡Cliente registrado!", "El cliente se ha creado correctamente.", "success"); await cargarTodo(); }
      else showAlert("Error al registrar cliente", data?.detalle || data?.error || `Error ${resUsuario.status}`, "error");
    } catch { showAlert("Error de conexión", "No se pudo conectar con el servidor.", "error"); }
    finally { setVerificando(false); }
  };

  const buscarYAñadirArticuloModal = async () => {
    const cod = codigoBusqueda.toUpperCase().trim();
    if (!cod) return;
    try {
      const res = await fetch(`/api/articulos/${cod}`);
      if (res.ok) {
        const art: Articulo = await res.json();
        setLineas(prev => { const existe = prev.find(item => item.codigo.toUpperCase() === art.codigo.toUpperCase()); if (existe) return prev.map(item => item.codigo.toUpperCase() === art.codigo.toUpperCase() ? { ...item, cantidad: item.cantidad + 1 } : item); return [...prev, { ...art, cantidad: 1 }]; });
        setCodigoBusqueda(""); setSugerencias([]);
      } else showAlert("Artículo no encontrado", "No existe ningún artículo con ese código", "warning");
    } catch { showAlert("Error", "No se pudo buscar el artículo", "error"); }
  };

  const manejarCreacionPresupuesto = async () => {
    const partes = nuevoCliente.apellidos.trim().split(/\s+/);
    const ape1 = partes[0]?.toUpperCase() || "";
    const ape2 = partes.slice(1).join(" ").toUpperCase() || "";
    setVerificando(true);
    try {
      const resPres = await fetch("/api/presupuestos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...nuevoCliente, nombre: nuevoCliente.nombre.trim().toUpperCase(), apellidos1: ape1, apellidos2: ape2, estado: "Pendiente", articulos: lineas }) });
      if (resPres.ok) {
        setShowNuevoPresupuesto(false); setModalStep(1); setLineas([]); setSugerencias([]);
        setNuevoCliente({ nombre: "", apellidos: "", email: "", telefono: "", documento_identidad: "", vehiculo: "", anio: new Date().getFullYear(), mensaje: "", tipo_cliente: "Particular" });
        await cargarTodo(); showAlert("¡Presupuesto creado!", "El presupuesto se ha guardado correctamente.", "success");
      } else showAlert("Error al guardar", "No se pudo guardar el presupuesto", "error");
    } catch (error: any) { showAlert("Error", `ERROR AL GUARDAR: ${error.message}`, "error"); }
    finally { setVerificando(false); }
  };

  const generarFacturaPDF = (data: any, abrirEnVentana: boolean = true) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    doc.setFillColor(17, 24, 39); doc.rect(0, 0, pageWidth, 55, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(26);
    doc.text(data.esPresupuesto ? "AJCAR 25 - PRESUPUESTO" : "AJCAR 25 - FACTURA", margin, 35);
    doc.setFontSize(11); doc.setFont("helvetica", "normal");
    doc.text(`Nº: ${data.numero_factura || data.id || "TEMP"}`, margin, 70);
    doc.text(`FECHA: ${new Date(data.fecha_emision || Date.now()).toLocaleDateString('es-ES')}`, pageWidth - margin, 70, { align: "right" });
    let y = 85;
    doc.setTextColor(0, 0, 0); doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("DATOS DEL CLIENTE:", margin, y); y += 8;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    const clienteNombre = data.cliente_nombre || `${data.nombre || "N/A"} ${data.apellidos1 || ""}`.trim();
    doc.text(`Cliente: ${clienteNombre}`, margin, y); y += 7;
    if (data.vehiculo) { doc.text(`Vehículo: ${data.vehiculo}`, margin, y); y += 7; } y += 5;
    const tableBody = (data.articulos || []).filter((art: any) => art && (art.descripcion || art.nombre)).map((art: any) => [art.descripcion || art.nombre || "Artículo", String(Number(art.cantidad) || 1), `${Number(art.precio_unitario || art.precio || 0).toFixed(2)}€`, `${(Number(art.cantidad || 1) * Number(art.precio_unitario || art.precio || 0)).toFixed(2)}€`]);
    autoTable(doc, { startY: y, head: [["DESCRIPCIÓN", "CANT.", "PRECIO UN.", "TOTAL"]], body: tableBody, theme: 'grid', headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: "bold", fontSize: 10, halign: "center" }, styles: { fontSize: 9, cellPadding: 6, lineColor: [200, 200, 200] }, columnStyles: { 0: { halign: "left", cellWidth: "auto" }, 1: { halign: "center", cellWidth: 25 }, 2: { halign: "right", cellWidth: 35 }, 3: { halign: "right", cellWidth: 35 } }, margin: { left: margin, right: margin } });
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    let total = 0;
    if (data.total !== undefined && data.total !== null) total = Number(data.total);
    else if (tableBody.length > 0) total = tableBody.reduce((acc: number, row: any[]) => { const valor = parseFloat((row[3] || "0").toString().replace("€", "")); return acc + (isNaN(valor) ? 0 : valor); }, 0);
    if (isNaN(total)) total = 0;
    doc.setFillColor(41, 128, 185); doc.rect(margin, finalY, pageWidth - margin * 2, 12, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    doc.text(data.esPresupuesto ? "TOTAL PRESUPUESTO" : "TOTAL FACTURA", margin + 8, finalY + 8.5); doc.setFontSize(14);
    doc.text(`${total.toFixed(2)}€`, pageWidth - margin - 8, finalY + 8.5, { align: "right" });
    doc.setTextColor(100, 100, 100); doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text("Gracias por confiar en AJCAR 25", margin, finalY + 30);
    if (abrirEnVentana) window.open(doc.output("bloburl"), "_blank");
    return doc.output('datauristring');
  };

  const imprimirFacturaExistente = (factura: any) => generarFacturaPDF(factura, true);

  const procesarFactura = async () => {
    const articulosAFacturar = (view === "mantenimientos" || view === "aceptados") ? seleccionado?.articulos : lineas;
    if (!seleccionado || !articulosAFacturar || articulosAFacturar.length === 0) { showAlert("Sin artículos", "No hay artículos seleccionados para facturar.", "warning"); return; }
    setFacturando(true);
    try {
      const totalCalculado = articulosAFacturar.reduce((acc, item) => acc + Number(item.precio_unitario) * item.cantidad, 0);
      const facturaData = { ...seleccionado, articulos: articulosAFacturar, total: totalCalculado, fecha_emision: new Date(), cliente_nombre: `${seleccionado.nombre} ${seleccionado.apellidos1 || ""}`.trim() };
      const pdfDataUri = generarFacturaPDF(facturaData, true);
      const pdfBase64 = pdfDataUri.includes(',') ? pdfDataUri.split(',')[1] : pdfDataUri;
      const empleado_id = sessionStorage.getItem("user_id") || null;
      const payload = { presupuesto_id: seleccionado.id, cliente_nombre: facturaData.cliente_nombre, email: seleccionado.email || "cliente@ajcar25.com", vehiculo: seleccionado.vehiculo || "", total: totalCalculado.toFixed(2), articulos: articulosAFacturar, pdfBase64, empleado_id };
      const res = await fetch("/api/facturas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const responseData = await res.json().catch(() => ({}));
      if (res.ok) { showAlert("¡Factura generada!", "Factura creada, stock actualizado y email enviado.", "success"); await cargarTodo(); setSeleccionado(null); setPanelAbierto(false); }
      else showAlert("Error al facturar", responseData.error || "No se pudo procesar la factura", "error");
    } catch { showAlert("Error de conexión", "Revisa tu conexión e inténtalo de nuevo.", "error"); }
    finally { setFacturando(false); }
  };

  const totalPresupuesto = lineas.reduce((acc, item) => acc + (Number(item.precio_unitario) * item.cantidad), 0);

  const enviarPresupuestoPDF = async () => {
    if (!seleccionado || !seleccionado.id || !seleccionado.email) { showAlert("Datos incompletos", "El presupuesto no tiene ID o el cliente no tiene email asignado.", "warning"); return; }
    if (lineas.length === 0) { showAlert("Sin artículos", "No hay artículos en el presupuesto.", "warning"); return; }
    setEnviandoEmail(true);
    try {
      const totalCalc = lineas.reduce((acc, item) => acc + Number(item.precio_unitario) * item.cantidad, 0);
      const presupuestoData = { ...seleccionado, articulos: lineas, total: totalCalc, fecha_emision: new Date(), cliente_nombre: `${seleccionado.nombre} ${seleccionado.apellidos1 || ""}`.trim(), esPresupuesto: true };
      const pdfDataUri = generarFacturaPDF(presupuestoData, false);
      const pdfBase64 = pdfDataUri.includes(',') ? pdfDataUri.split(',')[1] : pdfDataUri;
      const res = await fetch("/api/enviar-presupuesto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: seleccionado.id, email: seleccionado.email, nombre: `${seleccionado.nombre} ${seleccionado.apellidos1 || ""}`.trim(), vehiculo: seleccionado.vehiculo || "", total: totalCalc.toFixed(2), pdfBase64, articulos: lineas }) });
      if (res.ok) { showAlert("¡Presupuesto enviado!", "Se ha enviado correctamente por correo electrónico.", "success"); await cargarTodo(); setSeleccionado(null); setPanelAbierto(false); }
      else showAlert("Error al enviar", "No se pudo enviar el presupuesto.", "error");
    } catch { showAlert("Error de conexión", "Revisa la consola para más detalles.", "error"); }
    finally { setEnviandoEmail(false); }
  };

  const cancelarMantenimiento = async () => {
    if (!seleccionado || !cancelReason.trim()) { showAlert("Motivo requerido", "Debes explicar la razón por la que se cancela el mantenimiento.", "warning"); return; }
    setCancelando(true);
    try {
      const res = await fetch(`/api/presupuestos/${seleccionado.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado: "Cancelado", motivo_cancelacion: cancelReason.trim().toUpperCase() }) });
      if (res.ok) { showAlert("Mantenimiento cancelado", "El expediente ha sido cancelado correctamente.", "success"); setShowCancelModal(false); setCancelReason(""); setSeleccionado(null); setPanelAbierto(false); await cargarTodo(); }
      else { const data = await res.json().catch(() => ({})); showAlert("Error al cancelar", data?.error || "No se pudo cancelar el mantenimiento", "error"); }
    } catch { showAlert("Error de conexión", "No se pudo conectar con el servidor.", "error"); }
    finally { setCancelando(false); }
  };

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    setCambiandoEstado(true);
    try {
      const res = await fetch(`/api/presupuestos/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado: nuevoEstado }) });
      if (res.ok) { await cargarTodo(); setSeleccionado(null); setPanelAbierto(false); showAlert("Estado actualizado", "El estado del presupuesto se ha cambiado correctamente.", "success"); }
      else showAlert("Error", "No se pudo actualizar el estado.", "error");
    } catch { showAlert("Error", "Error al actualizar el estado.", "error"); }
    finally { setCambiandoEstado(false); }
  };

  const handleLogout = () => { sessionStorage.clear(); router.push("/"); };

  const presupuestosFiltrados = presupuestos.filter(p => {
    if (view === "presupuestos") return p.estado === "Pendiente" || p.estado === "Enviado";
    if (view === "aceptados") return p.estado === "Aceptado por el cliente";
    if (view === "mantenimientos") return p.estado === "En Taller";
    return false;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-gray-400 font-sans selection:bg-blue-500/30">
      <main className="w-full flex flex-col min-h-screen">
        <div className="p-4 sm:p-8 lg:p-16 max-w-7xl w-full mx-auto">

          {/* HEADER */}
          <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-8 mb-8 sm:mb-16">
            <div className="space-y-2 sm:space-y-4">
              <div className="flex items-center gap-3">
                <img src="/imagenes/logo_ajcar25.png" alt="AJCAR 25" className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-contain flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none mb-1">{nombreUsuario}</p>
                  <p className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter">Panel de Gestión</p>
                </div>
              </div>
              <h1 className="text-white text-4xl sm:text-5xl lg:text-7xl font-black italic uppercase tracking-tighter leading-none">
                {view === 'mantenimientos' ? 'TALLER' : view.toUpperCase()}
              </h1>
            </div>

            <nav className="flex flex-wrap items-center gap-1 bg-white/[0.03] p-1 sm:p-1.5 rounded-2xl sm:rounded-3xl border border-white/5 shadow-2xl backdrop-blur-md w-full sm:w-auto">
              {[
                { id: 'presupuestos', label: 'Presup.' },
                { id: 'aceptados', label: 'Aceptados' },
                { id: 'mantenimientos', label: 'Taller' },
                { id: 'stock', label: 'Almacén' },
                { id: 'facturas', label: 'Facturas' }
              ].map((v) => (
                <button key={v.id} onClick={() => { setView(v.id as any); setSeleccionado(null); setPanelAbierto(false); }}
                  className={`flex-1 sm:flex-none px-2 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${view === v.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-gray-300'}`}>
                  {v.label}
                </button>
              ))}
              <button onClick={() => { setShowNuevoPresupuesto(true); setModalStep(1); setLineas([]); setSugerencias([]); setUsuarioExiste(false); setDniError(""); setNuevoCliente({ nombre: "", apellidos: "", email: "", telefono: "", documento_identidad: "", vehiculo: "", anio: new Date().getFullYear(), mensaje: "", tipo_cliente: "Particular" }); }}
                className="flex-1 sm:flex-none px-2 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-600/10 transition-all border border-blue-500/20 sm:ml-1 flex items-center justify-center gap-1 sm:gap-2">
                <FilePlus2 size={12} /> Crear
              </button>
              <button onClick={() => setConfirmLogout(true)} className="p-2 sm:p-2.5 text-red-500/80 hover:text-red-400 hover:bg-red-500/5 rounded-xl sm:rounded-2xl transition-all sm:ml-2 flex-shrink-0">
                <LogOut size={16} />
              </button>
            </nav>
          </header>

          {/* CONTENIDO PRINCIPAL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
            <div className="lg:col-span-7 space-y-4 sm:space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[#0f0f12] rounded-[32px] sm:rounded-[40px] border border-white/5">
                  <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
                  <p className="text-[10px] uppercase font-black tracking-widest">Cargando Sistema...</p>
                </div>
              ) : view === "stock" ? (
                <div className="bg-[#0f0f12] rounded-[32px] sm:rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
                  <div className="p-4 sm:p-8 border-b border-white/5 bg-white/[0.01] flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between items-start sm:items-center">
                    <h3 className="text-white font-black italic uppercase tracking-tighter text-sm sm:text-base">Artículos en Almacén</h3>
                    <div className="bg-white/5 rounded-2xl flex items-center px-4 sm:px-6 border border-white/5 w-full sm:flex-1 sm:max-w-md sm:ml-8">
                      <Search size={14} className="text-gray-600 mr-3 flex-shrink-0" />
                      <input type="text" value={filtroStock} onChange={(e) => setFiltroStock(e.target.value)} placeholder="FILTRAR..."
                        className="bg-transparent border-none focus:ring-0 text-xs text-white w-full py-3 uppercase font-bold tracking-tight" />
                    </div>
                  </div>
                  <div className="max-h-[500px] sm:max-h-[600px] overflow-y-auto custom-scrollbar overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[400px]">
                      <thead className="bg-black/20 text-[10px] font-black uppercase tracking-widest text-gray-500 sticky top-0 backdrop-blur-md">
                        <tr>
                          <th className="p-4 sm:p-8">Referencia</th>
                          <th className="p-4 sm:p-8">Descripción</th>
                          <th className="p-4 sm:p-8 text-center">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {articulos.filter(a => { const t = filtroStock.toLowerCase(); return a.codigo?.toLowerCase().includes(t) || a.descripcion?.toLowerCase().includes(t); }).sort((a, b) => b.id - a.id).map(art => (
                          <tr key={art.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-4 sm:p-8 font-mono text-blue-400 font-bold text-xs sm:text-sm">{art.codigo}</td>
                            <td className="p-4 sm:p-8 text-gray-300 uppercase text-[10px] sm:text-[11px] font-bold">{art.descripcion}</td>
                            <td className={`p-4 sm:p-8 text-center font-black text-base sm:text-lg italic ${art.stock < 5 ? 'text-red-500' : 'text-white'}`}>{art.stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : view === "facturas" ? (
                <div className="space-y-3 sm:space-y-4">
                  {/* Buscador matrícula */}
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
                    <Search size={14} className="text-gray-500 flex-shrink-0" />
                    <input type="text" value={filtroFacturas} onChange={(e) => setFiltroFacturas(e.target.value)}
                      placeholder="FILTRAR POR MATRÍCULA O VEHÍCULO..."
                      className="bg-transparent text-white text-xs font-bold uppercase focus:outline-none w-full placeholder:text-gray-600 tracking-widest" />
                    {filtroFacturas && (
                      <button onClick={() => setFiltroFacturas("")} className="text-gray-500 hover:text-white transition-colors flex-shrink-0">
                        <X size={14} />
                      </button>
                    )}
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
                      <div className="bg-[#0f0f12] rounded-[32px] sm:rounded-[40px] p-12 sm:p-20 text-center border border-white/5">
                        <FileText size={60} className="mx-auto mb-6 text-gray-600" />
                        <p className="text-xl sm:text-2xl font-black italic uppercase text-white mb-3">
                          {filtroFacturas ? "Sin resultados" : "No hay facturas emitidas"}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {filtroFacturas ? `No hay facturas con "${filtroFacturas}"` : "Las facturas generadas aparecerán aquí."}
                        </p>
                      </div>
                    );
                    return facturasFiltradas.map(f => (
                      <div key={f.id} className="bg-[#0f0f12] p-5 sm:p-10 rounded-[32px] sm:rounded-[40px] border border-white/5 flex flex-col sm:flex-row justify-between gap-4 sm:gap-0 items-start sm:items-center group hover:border-blue-500/30 transition-all shadow-xl">
                        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 group-hover:text-blue-500 transition-colors flex-shrink-0">
                            <FileText size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-gray-600 uppercase mb-1 tracking-widest">Factura No. {String(f.id).slice(0, 8)}</p>
                            <h4 className="text-white text-base sm:text-xl font-black italic uppercase tracking-tighter truncate">{f.cliente_nombre}</h4>
                            <p className="text-xs text-gray-500 font-bold uppercase truncate">{f.vehiculo} • {new Date(f.fecha_emision).toLocaleDateString()}</p>
                            {f.matricula && <p className="text-xs text-blue-400 font-mono font-bold mt-0.5">{f.matricula}</p>}
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 w-full sm:w-auto">
                          <p className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter">{Number(f.total || 0).toFixed(2)}€</p>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-[9px] bg-green-500/10 text-green-500 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-green-500/20 hidden sm:inline">Liquidada</span>
                            <button onClick={() => imprimirFacturaExistente(f)} className="p-2 bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white rounded-xl transition-all border border-blue-500/20">
                              <Printer size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {presupuestosFiltrados.length === 0 ? (
                    <div className="col-span-2 bg-[#0f0f12] rounded-[32px] sm:rounded-[40px] p-12 sm:p-20 text-center border border-white/5">
                      <Car size={60} className="mx-auto mb-6 sm:mb-8 text-gray-600" strokeWidth={1} />
                      <p className="text-xl sm:text-2xl font-black italic uppercase text-white mb-3">
                        {view === "presupuestos" && "No hay presupuestos pendientes"}
                        {view === "aceptados" && "No hay presupuestos aceptados"}
                        {view === "mantenimientos" && "No hay vehículos en taller"}
                      </p>
                      <p className="text-gray-500 text-sm max-w-md mx-auto">
                        {view === "presupuestos" && "Cuando un cliente envíe una solicitud aparecerá aquí."}
                        {view === "aceptados" && "Los presupuestos aceptados por el cliente aparecerán aquí."}
                        {view === "mantenimientos" && "Los vehículos ingresados a taller aparecerán aquí."}
                      </p>
                    </div>
                  ) : presupuestosFiltrados.map(p => (
                    <div key={p.id} onClick={() => { setSeleccionado(p); setLineas(p.articulos || []); setSugerencias([]); setPanelAbierto(true); }}
                      className={`p-6 sm:p-10 rounded-[32px] sm:rounded-[48px] border transition-all duration-500 cursor-pointer relative overflow-hidden group ${seleccionado?.id === p.id ? 'bg-blue-600 border-blue-500 text-white shadow-2xl shadow-blue-900/40' : 'bg-[#0f0f12] border-white/5 hover:border-white/10'}`}>
                      {seleccionado?.id === p.id && <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full animate-pulse" />}
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-5 sm:mb-8">
                          <div className={`p-2 sm:p-3 rounded-2xl ${seleccionado?.id === p.id ? 'bg-white/20' : 'bg-blue-500/10 text-blue-500'}`}><Car size={20} /></div>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 sm:px-3 py-1 rounded-full ${seleccionado?.id === p.id ? 'bg-black/20 text-white' : 'bg-white/5 text-gray-500'}`}>{p.estado}</span>
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 sm:mb-2 ${seleccionado?.id === p.id ? 'text-blue-100/70' : 'text-gray-600'}`}>{p.vehiculo}</p>
                        <h3 className="text-xl sm:text-3xl font-black italic uppercase tracking-tighter leading-none">{p.nombre} {p.apellidos1}</h3>
                        <div className="mt-4 sm:mt-6 flex items-center gap-2 opacity-50 text-[9px] font-bold uppercase">
                          <History size={12} /> {new Date(p.creado_en).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {panelAbierto && seleccionado && (
              <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setPanelAbierto(false)} />
            )}
            <aside className={`
              fixed bottom-0 left-0 right-0 z-50 lg:static lg:z-auto
              lg:col-span-5 lg:sticky lg:top-8
              transition-transform duration-300
              ${panelAbierto ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
            `}>
              <div className="bg-[#0f0f12] rounded-t-[40px] sm:rounded-t-[56px] lg:rounded-[56px] border border-white/5 overflow-hidden shadow-2xl max-h-[85vh] lg:max-h-none lg:min-h-[600px] flex flex-col">
                {seleccionado ? (
                  <div className="p-6 sm:p-12 space-y-6 sm:space-y-10 animate-in slide-in-from-bottom duration-300 lg:animate-in lg:slide-in-from-right-8 flex-1 flex flex-col overflow-y-auto">
                    <div className="w-12 h-1 bg-white/20 rounded-full mx-auto lg:hidden" />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Expediente</span>
                      <button onClick={() => { setSeleccionado(null); setPanelAbierto(false); setSugerencias([]); }} className="bg-white/5 p-2 sm:p-3 rounded-2xl text-gray-600 hover:text-white transition-all"><X size={18} /></button>
                    </div>
                    <div className="space-y-3 sm:space-y-6">
                      <h3 className="text-2xl sm:text-4xl font-black italic uppercase text-white leading-tight tracking-tighter">{seleccionado.nombre} {seleccionado.apellidos1}</h3>
                      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-6 pt-1">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Contacto Directo</p>
                          <div className="flex items-center gap-2 text-xs uppercase font-bold text-gray-400"><Mail size={12} /> <span className="truncate">{seleccionado.email}</span></div>
                          <div className="flex items-center gap-2 text-xs uppercase font-bold text-gray-400"><Phone size={12} /> {seleccionado.telefono}</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-600/5 border border-blue-500/10 p-5 sm:p-8 rounded-[28px] sm:rounded-[40px] relative group overflow-hidden">
                      <p className="text-[9px] font-black uppercase text-blue-500 mb-2 tracking-widest flex items-center gap-2"><AlertCircle size={12} /> Motivo del Ingreso</p>
                      <p className="text-xs sm:text-sm text-gray-300 italic font-medium leading-relaxed uppercase tracking-tight">"{seleccionado.mensaje || "Sin observaciones específicas."}"</p>
                    </div>

                    {view === "presupuestos" && (
                      <div className="space-y-4 sm:space-y-8 flex-1 flex flex-col justify-end">
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex gap-2 sm:gap-3 relative">
                            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl flex items-center px-3 sm:px-5 focus-within:border-blue-500 transition-all shadow-inner relative">
                              <Package size={14} className="text-gray-600 mr-2 sm:mr-4 flex-shrink-0" />
                              <input value={codigoBusqueda} onChange={(e) => { const valor = e.target.value.toUpperCase(); setCodigoBusqueda(valor); if (valor.length > 0) { setSugerencias(articulos.filter(a => a.codigo.toUpperCase().includes(valor) || a.descripcion.toUpperCase().includes(valor)).slice(0, 5)); } else { setSugerencias([]); } }} onKeyDown={(e) => e.key === 'Enter' && buscarYAñadirArticuloModal()} placeholder="AÑADIR PIEZA..."
                                className="bg-transparent border-none focus:ring-0 text-[10px] text-white w-full py-4 uppercase font-black" />
                              {sugerencias.length > 0 && (
                                <div className="absolute top-full left-0 w-full bg-[#16161a] border border-white/10 rounded-2xl mt-2 z-[150] shadow-2xl overflow-hidden">
                                  {sugerencias.map((sug) => (
                                    <div key={sug.id} onClick={() => { setLineas(prev => { const existe = prev.find(item => item.codigo === sug.codigo); if (existe) return prev.map(item => item.codigo === sug.codigo ? { ...item, cantidad: item.cantidad + 1 } : item); return [...prev, { ...sug, cantidad: 1 }]; }); setCodigoBusqueda(""); setSugerencias([]); }} className="p-3 sm:p-4 hover:bg-blue-600/20 cursor-pointer border-b border-white/5 flex justify-between items-center transition-colors">
                                      <div>
                                        <p className="text-[10px] text-white font-black uppercase tracking-tight">{sug.descripcion}</p>
                                        <p className="text-[8px] text-gray-500 font-mono font-bold">{sug.codigo}</p>
                                      </div>
                                      <span className="text-[10px] text-blue-500 font-black italic">{Number(sug.precio_unitario).toFixed(2)}€</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button onClick={buscarYAñadirArticuloModal} className="bg-blue-600 w-12 sm:w-16 rounded-2xl text-white flex items-center justify-center hover:bg-blue-500 shadow-lg transition-all active:scale-95"><Plus size={20} /></button>
                          </div>
                          <div className="space-y-2 max-h-40 sm:max-h-56 overflow-y-auto pr-2 sm:pr-4 custom-scrollbar">
                            {lineas.map((l, i) => (
                              <div key={i} className="flex justify-between items-center bg-white/[0.02] p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/5 group hover:border-blue-500/20 transition-all">
                                <div className="min-w-0">
                                  <p className="text-[10px] text-gray-300 font-black uppercase tracking-tight truncate">{l.descripcion}</p>
                                  <p className="text-[8px] text-blue-500 font-mono font-bold">{l.codigo} • QTY: {l.cantidad}</p>
                                </div>
                                <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
                                  <span className="text-xs sm:text-sm font-black text-white italic">{(l.cantidad * l.precio_unitario).toFixed(2)}€</span>
                                  <button onClick={() => setLineas(lineas.filter((_, idx) => idx !== i))} className="text-gray-600 hover:text-red-500 transition-colors p-1"><Trash2 size={15} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="p-6 sm:p-10 bg-blue-600 rounded-[32px] sm:rounded-[48px] flex justify-between items-center shadow-3xl shadow-blue-900/50 relative overflow-hidden group">
                          <div className="flex flex-col relative z-10">
                            <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Total</span>
                            <span className="text-3xl sm:text-5xl font-black italic text-white tracking-tighter leading-none">{totalPresupuesto.toFixed(2)}€</span>
                          </div>
                          <button onClick={enviarPresupuestoPDF} disabled={enviandoEmail || lineas.length === 0} className="bg-white text-blue-600 px-5 sm:px-8 py-3 sm:py-5 rounded-2xl sm:rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:scale-105 transition-all shadow-xl disabled:opacity-50 relative z-10 active:scale-95">
                            {enviandoEmail ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />} Enviar
                          </button>
                        </div>
                      </div>
                    )}

                    {view === "aceptados" && (
                      <div className="mt-auto space-y-4 sm:space-y-6">
                        <div className="bg-white/5 rounded-[28px] sm:rounded-[40px] p-5 sm:p-8 border border-white/5">
                          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4 sm:mb-6">Resumen de Intervención</p>
                          <div className="space-y-2 sm:space-y-3">
                            {seleccionado.articulos?.map((art, idx) => (
                              <div key={idx} className="flex justify-between text-xs font-bold uppercase tracking-tight text-gray-400">
                                <span className="truncate mr-2">{art.descripcion} x{art.cantidad}</span>
                                <span className="text-white italic flex-shrink-0">{(art.precio_unitario * art.cantidad).toFixed(2)}€</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <button onClick={() => cambiarEstado(seleccionado.id, "En Taller")} disabled={cambiandoEstado} className="w-full bg-green-600 text-white py-5 sm:py-8 rounded-[32px] sm:rounded-[40px] font-black text-[10px] sm:text-[11px] uppercase tracking-[0.3em] sm:tracking-[0.5em] flex items-center justify-center gap-3 sm:gap-4 hover:bg-green-500 transition-all shadow-2xl active:scale-95">
                          {cambiandoEstado ? <Loader2 className="animate-spin" size={18} /> : <Wrench size={18} />} Ingresar a Taller
                        </button>
                      </div>
                    )}

                    {view === "mantenimientos" && (
                      <div className="mt-auto space-y-3 sm:space-y-4">
                        <button onClick={procesarFactura} disabled={facturando} className="w-full bg-white text-black py-5 sm:py-8 rounded-[32px] sm:rounded-[40px] font-black text-[10px] sm:text-[11px] uppercase tracking-[0.3em] sm:tracking-[0.5em] flex items-center justify-center gap-3 sm:gap-4 shadow-2xl hover:bg-gray-200 transition-all active:scale-95">
                          {facturando ? <Loader2 className="animate-spin" size={18} /> : <Printer size={18} />} Finalizar y Facturar
                        </button>
                        <button onClick={() => setShowCancelModal(true)} className="w-full bg-red-600/90 hover:bg-red-600 text-white py-4 sm:py-6 rounded-[32px] sm:rounded-[40px] font-black text-[10px] sm:text-[11px] uppercase tracking-[0.3em] sm:tracking-[0.5em] flex items-center justify-center gap-2 sm:gap-3 transition-all active:scale-95 border border-red-500/30">
                          <X size={18} /> Cancelar Mantenimiento
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-10 py-20 sm:py-40">
                    <Car size={80} className="mb-6 sm:mb-10 animate-pulse text-blue-600" strokeWidth={1} />
                    <p className="text-base sm:text-lg font-black uppercase tracking-[0.5em] sm:tracking-[1em] italic">AJCAR 25</p>
                    <p className="text-[10px] uppercase tracking-[0.3em] mt-4 font-bold text-center px-4">Selecciona una ficha para gestionar</p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* MODAL NUEVA FICHA */}
      {showNuevoPresupuesto && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/95 backdrop-blur-3xl p-0 sm:p-6">
          <div className="bg-[#0f0f12] border border-white/10 w-full max-w-3xl rounded-t-[40px] sm:rounded-[64px] overflow-hidden shadow-3xl animate-in slide-in-from-bottom sm:zoom-in duration-500 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            <div className="p-5 sm:p-12 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-600/10 via-transparent to-transparent flex-shrink-0">
              <div>
                <h2 className="text-white text-2xl sm:text-4xl font-black italic uppercase tracking-tighter leading-none">Apertura de Ficha</h2>
                <div className="flex gap-4 sm:gap-6 mt-3 sm:mt-6">
                  {[{ n: 1, label: "Identificación" }, { n: 2, label: "Configuración" }].map(s => (
                    <div key={s.n} className={`flex items-center gap-2 sm:gap-3 transition-opacity ${modalStep === s.n ? 'opacity-100' : 'opacity-30'}`}>
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 text-white text-[9px] sm:text-[10px] flex items-center justify-center font-black">{s.n}</span>
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white hidden sm:inline">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => { setShowNuevoPresupuesto(false); setModalStep(1); setLineas([]); setSugerencias([]); setDniError(""); }} className="bg-white/5 p-3 sm:p-6 rounded-full text-gray-500 hover:text-white transition-all hover:rotate-90 flex-shrink-0"><X size={20} /></button>
            </div>
            <div className="p-5 sm:p-12 overflow-y-auto custom-scrollbar flex-1">
              {modalStep === 1 ? (
                <div className="space-y-5 sm:space-y-8 animate-in slide-in-from-left-8 duration-500">
                  <div className="space-y-2 sm:space-y-3">
                    <p className="text-[10px] font-black text-gray-600 uppercase ml-3 sm:ml-5 tracking-widest">DNI / CIF del Cliente</p>
                    <div className="flex gap-2 sm:gap-4">
                      <input placeholder="00000000X o CIF"
                        className={`flex-1 bg-white/5 border rounded-[20px] sm:rounded-[28px] p-4 sm:p-6 text-sm text-white uppercase outline-none focus:border-blue-500 transition-all font-bold tracking-tight shadow-inner ${dniError ? "border-red-500" : "border-white/10"}`}
                        value={nuevoCliente.documento_identidad}
                        onChange={(e) => { const valor = e.target.value.toUpperCase().trim(); setNuevoCliente({ ...nuevoCliente, documento_identidad: valor }); setUsuarioExiste(false); validarDNI(valor); }}
                        onBlur={() => validarDNI(nuevoCliente.documento_identidad)} />
                      <button onClick={verificarUsuario} disabled={verificando || !nuevoCliente.documento_identidad || !!dniError}
                        className="bg-blue-600 px-4 sm:px-8 rounded-[20px] sm:rounded-[28px] text-white font-black uppercase text-xs tracking-widest hover:bg-blue-500 disabled:opacity-50 flex-shrink-0">
                        {verificando ? <Loader2 className="animate-spin" size={18} /> : "Verificar"}
                      </button>
                    </div>
                    {dniError && <p className="text-red-500 text-xs ml-3 sm:ml-5 font-medium">{dniError}</p>}
                  </div>
                  {usuarioExiste && (
                    <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 p-4 sm:p-6 rounded-[20px] sm:rounded-[32px] text-xs text-green-400 font-black uppercase tracking-widest">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0"><CheckCircle size={18} /></div>
                      Cliente verificado y listo para operar
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                    {[{ label: "Nombre del Cliente", key: "nombre", placeholder: "EJ: JUAN" }, { label: "Apellidos Completos", key: "apellidos", placeholder: "EJ: PÉREZ GARCÍA" }].map(f => (
                      <div key={f.key} className="space-y-2 sm:space-y-3">
                        <p className="text-[10px] font-black text-gray-600 uppercase ml-3 sm:ml-5 tracking-widest">{f.label}</p>
                        <input placeholder={f.placeholder} className="w-full bg-white/5 border border-white/10 rounded-[20px] sm:rounded-[28px] p-4 sm:p-6 text-sm text-white uppercase outline-none focus:border-blue-500 transition-all font-bold tracking-tight shadow-inner"
                          value={(nuevoCliente as any)[f.key]} onChange={(e) => setNuevoCliente({ ...nuevoCliente, [f.key]: e.target.value.toUpperCase() })} />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3 sm:gap-8">
                    <div className="col-span-2 space-y-2 sm:space-y-3">
                      <p className="text-[10px] font-black text-gray-600 uppercase ml-3 sm:ml-5 tracking-widest">Modelo de Vehículo</p>
                      <input placeholder="MARCA, MODELO Y MOTORIZACIÓN" className="w-full bg-white/5 border border-white/10 rounded-[20px] sm:rounded-[28px] p-4 sm:p-6 text-sm text-white uppercase outline-none focus:border-blue-500 transition-all font-bold shadow-inner" value={nuevoCliente.vehiculo} onChange={(e) => setNuevoCliente({ ...nuevoCliente, vehiculo: e.target.value.toUpperCase() })} />
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <p className="text-[10px] font-black text-gray-600 uppercase ml-3 sm:ml-5 tracking-widest">Año</p>
                      <input type="number" className="w-full bg-white/5 border border-white/10 rounded-[20px] sm:rounded-[28px] p-4 sm:p-6 text-sm text-white outline-none focus:border-blue-500 font-bold shadow-inner" value={nuevoCliente.anio} onChange={(e) => setNuevoCliente({ ...nuevoCliente, anio: parseInt(e.target.value) || 2024 })} />
                    </div>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <p className="text-[10px] font-black text-gray-600 uppercase ml-3 sm:ml-5 tracking-widest">Descripción de la Avería</p>
                    <textarea placeholder="DETALLA LOS SÍNTOMAS O LAS PIEZAS A REVISAR..." className="w-full bg-white/5 border border-white/10 rounded-[24px] sm:rounded-[40px] p-5 sm:p-8 text-sm text-white uppercase outline-none focus:border-blue-500 h-24 sm:h-32 resize-none font-bold shadow-inner leading-relaxed" value={nuevoCliente.mensaje} onChange={(e) => setNuevoCliente({ ...nuevoCliente, mensaje: e.target.value.toUpperCase() })} />
                  </div>
                  <button onClick={() => setModalStep(2)} disabled={!usuarioExiste || verificando || !nuevoCliente.nombre || !!dniError}
                    className={`w-full font-black py-5 sm:py-8 rounded-[24px] sm:rounded-[40px] uppercase text-[10px] sm:text-[11px] tracking-[0.3em] sm:tracking-[0.5em] transition-all flex items-center justify-center gap-3 sm:gap-4 shadow-2xl ${(!usuarioExiste || verificando || !nuevoCliente.nombre || !!dniError) ? 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/30'}`}>
                    {verificando ? <Loader2 className="animate-spin" size={18} /> : "Siguiente Paso"} <ChevronRight size={18} />
                  </button>
                </div>
              ) : (
                <div className="space-y-5 sm:space-y-8 animate-in slide-in-from-right-8 duration-500">
                  <div className="flex gap-2 sm:gap-4 relative">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-[24px] sm:rounded-[32px] flex items-center px-4 sm:px-8 focus-within:border-blue-500 transition-all shadow-inner relative">
                      <Package size={16} className="text-gray-600 mr-3 sm:mr-4 flex-shrink-0" />
                      <input value={codigoBusqueda} onChange={(e) => { const valor = e.target.value.toUpperCase(); setCodigoBusqueda(valor); if (valor.length > 0) { setSugerencias(articulos.filter(a => a.codigo.toUpperCase().includes(valor) || a.descripcion.toUpperCase().includes(valor)).slice(0, 5)); } else { setSugerencias([]); } }} onKeyDown={(e) => { if (e.key === 'Enter') buscarYAñadirArticuloModal(); }} placeholder="CÓDIGO O NOMBRE DE PIEZA..."
                        className="bg-transparent border-none focus:ring-0 text-xs text-white w-full py-4 sm:py-6 uppercase font-black tracking-widest" />
                      {sugerencias.length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-[#16161a] border border-white/10 rounded-[20px] sm:rounded-[24px] mt-2 z-[150] shadow-2xl overflow-hidden">
                          {sugerencias.map((sug) => (
                            <div key={sug.id} onClick={() => { setLineas(prev => { const existe = prev.find(item => item.codigo === sug.codigo); if (existe) return prev.map(item => item.codigo === sug.codigo ? { ...item, cantidad: item.cantidad + 1 } : item); return [...prev, { ...sug, cantidad: 1 }]; }); setCodigoBusqueda(""); setSugerencias([]); }} className="p-4 sm:p-5 hover:bg-blue-600/20 cursor-pointer border-b border-white/5 flex justify-between items-center transition-colors">
                              <div>
                                <p className="text-[10px] sm:text-[11px] text-white font-black uppercase tracking-tight">{sug.descripcion}</p>
                                <p className="text-[8px] sm:text-[9px] text-gray-500 font-mono font-bold">{sug.codigo}</p>
                              </div>
                              <div className="text-right flex-shrink-0 ml-3">
                                <p className="text-[10px] text-blue-500 font-black italic">{Number(sug.precio_unitario).toFixed(2)}€</p>
                                <p className="text-[8px] text-gray-600 uppercase font-bold tracking-tighter">Stock: {sug.stock}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={buscarYAñadirArticuloModal} className="bg-blue-600 px-5 sm:px-10 rounded-[24px] sm:rounded-[32px] text-white hover:bg-blue-500 shadow-xl transition-all active:scale-95"><Plus size={24} /></button>
                  </div>
                  <div className="bg-black/40 rounded-[32px] sm:rounded-[48px] border border-white/5 p-3 sm:p-4 min-h-[200px] sm:min-h-[300px] max-h-[300px] sm:max-h-[400px] overflow-y-auto custom-scrollbar">
                    {lineas.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 sm:py-20 opacity-20">
                        <Package size={48} className="mb-4" />
                        <p className="text-xs sm:text-sm font-black uppercase tracking-[0.4em]">Sin piezas seleccionadas</p>
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
                        {lineas.map((l, i) => (
                          <div key={i} className="flex justify-between items-center p-3 sm:p-6 bg-white/[0.03] hover:bg-white/[0.06] rounded-[24px] sm:rounded-[32px] transition-all group border border-transparent hover:border-blue-500/30">
                            <div className="flex items-center gap-3 sm:gap-6 min-w-0">
                              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center text-blue-500 font-black italic text-xs flex-shrink-0">#{i + 1}</div>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm text-white font-black uppercase tracking-tight truncate">{l.descripcion}</p>
                                <p className="text-[9px] sm:text-[10px] text-gray-600 font-mono font-bold">{l.codigo}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 sm:gap-10 flex-shrink-0">
                              <div className="flex items-center gap-2 sm:gap-4 bg-black/40 rounded-xl sm:rounded-2xl px-2 sm:px-5 py-1 sm:py-2 border border-white/5 shadow-inner">
                                <button onClick={() => setLineas(lineas.map((item, idx) => idx === i ? { ...item, cantidad: Math.max(1, item.cantidad - 1) } : item))} className="text-blue-500 hover:text-white font-black text-lg transition-colors">-</button>
                                <span className="text-xs sm:text-sm font-black text-white w-5 text-center italic">{l.cantidad}</span>
                                <button onClick={() => setLineas(lineas.map((item, idx) => idx === i ? { ...item, cantidad: item.cantidad + 1 } : item))} className="text-blue-500 hover:text-white font-black text-lg transition-colors">+</button>
                              </div>
                              <span className="text-sm sm:text-lg font-black text-white italic w-16 sm:w-24 text-right">{(l.cantidad * l.precio_unitario).toFixed(2)}€</span>
                              <button onClick={() => setLineas(lineas.filter((_, idx) => idx !== i))} className="text-gray-700 hover:text-red-500 transition-colors p-1"><Trash2 size={18} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 sm:p-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-[32px] sm:rounded-[48px] shadow-3xl shadow-blue-900/40 relative overflow-hidden gap-4 sm:gap-0">
                    <div className="relative z-10">
                      <p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.3em] mb-1">Presupuesto Final</p>
                      <p className="text-4xl sm:text-5xl font-black italic text-white tracking-tighter leading-none">{totalPresupuesto.toFixed(2)}€</p>
                    </div>
                    <div className="flex gap-3 sm:gap-4 relative z-10 w-full sm:w-auto">
                      <button onClick={() => { setModalStep(1); setSugerencias([]); }} className="flex-1 sm:flex-none bg-black/20 px-5 sm:px-8 py-3 sm:py-5 rounded-[20px] sm:rounded-[28px] text-[10px] font-black text-white uppercase tracking-widest hover:bg-black/30 transition-all flex items-center justify-center gap-2"><ChevronLeft size={14} /> Volver</button>
                      <button onClick={manejarCreacionPresupuesto} className="flex-1 sm:flex-none bg-white px-5 sm:px-10 py-3 sm:py-5 rounded-[20px] sm:rounded-[28px] text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl active:scale-95">Finalizar</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRO NUEVO CLIENTE */}
      {showModalNuevoUsuario && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center bg-black/98 backdrop-blur-2xl p-0 sm:p-6">
          <div className="bg-[#16161a] border border-blue-600/30 w-full max-w-lg rounded-t-[40px] sm:rounded-[70px] p-8 sm:p-16 text-center shadow-3xl relative overflow-hidden max-h-[95vh] overflow-y-auto">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-blue-600 to-transparent" />
            <div className="w-16 h-16 sm:w-24 sm:h-24 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-10 border border-blue-500/20"><UserPlus size={32} className="text-blue-500" /></div>
            <h3 className="text-white text-2xl sm:text-3xl font-black italic uppercase tracking-tighter mb-3 sm:mb-4 leading-none">Alta de Cliente</h3>
            <p className="text-gray-500 text-[10px] uppercase mb-8 sm:mb-12 tracking-[0.2em] leading-relaxed">No hay registros para DNI {nuevoCliente.documento_identidad}.<br />Es obligatorio cumplimentar la ficha legal.</p>
            <div className="space-y-4 sm:space-y-5 mb-8 sm:mb-12 text-left">
              <div className="space-y-2">
                <p className="text-[8px] font-black text-blue-500 uppercase ml-3 sm:ml-5 tracking-widest flex items-center gap-2"><Briefcase size={10} /> Régimen del Cliente</p>
                <select value={nuevoCliente.tipo_cliente} onChange={(e) => setNuevoCliente({ ...nuevoCliente, tipo_cliente: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 text-xs text-white uppercase outline-none focus:border-blue-500 transition-all font-bold shadow-inner appearance-none cursor-pointer">
                  <option value="particular">Persona Física / Particular</option>
                  <option value="empresa">Persona Jurídica / Empresa / Autónomo</option>
                </select>
              </div>
              <div className="space-y-2">
                <p className="text-[8px] font-black text-blue-500 uppercase ml-3 sm:ml-5 tracking-widest">Documento de Identidad</p>
                <input className="w-full bg-white/5 border border-white/10 rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 text-xs text-white uppercase outline-none font-bold shadow-inner" value={nuevoCliente.documento_identidad} disabled />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-5">
                {[{ label: "Nombre", key: "nombre" }, { label: "Apellidos", key: "apellidos" }].map(f => (
                  <div key={f.key} className="space-y-2">
                    <p className="text-[8px] font-black text-blue-500 uppercase ml-3 sm:ml-5 tracking-widest">{f.label}</p>
                    <input placeholder={f.label} className="w-full bg-white/5 border border-white/10 rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 text-xs text-white uppercase outline-none focus:border-blue-500 transition-all font-bold shadow-inner"
                      value={(nuevoCliente as any)[f.key]} onChange={(e) => setNuevoCliente({ ...nuevoCliente, [f.key]: e.target.value.toUpperCase() })} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-5">
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-blue-500 uppercase ml-3 sm:ml-5 tracking-widest">Teléfono</p>
                  <input placeholder="600 000 000" className="w-full bg-white/5 border border-white/10 rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 text-xs text-white outline-none focus:border-blue-500 transition-all font-bold shadow-inner" value={nuevoCliente.telefono} onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-blue-500 uppercase ml-3 sm:ml-5 tracking-widest">E-mail</p>
                  <input placeholder="INFO@CLIENTE.COM"
                    className={`w-full bg-white/5 border rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 text-xs text-white outline-none focus:border-blue-500 transition-all font-bold shadow-inner ${emailError ? "border-red-500" : "border-white/10"}`}
                    value={nuevoCliente.email} onChange={(e) => { const valor = e.target.value.toLowerCase().trim(); setNuevoCliente({ ...nuevoCliente, email: valor }); setEmailError(validarEmail(valor)); }}
                    onBlur={() => setEmailError(validarEmail(nuevoCliente.email))} />
                  {emailError && <p className="text-red-500 text-xs ml-3 font-medium">{emailError}</p>}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:gap-4">
              <button onClick={crearUsuarioYContinuar} disabled={verificando}
                className="w-full bg-blue-600 text-white font-black py-4 sm:py-6 rounded-[24px] sm:rounded-[32px] uppercase text-[10px] sm:text-[11px] tracking-[0.3em] hover:bg-blue-500 shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2 sm:gap-3">
                {verificando ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />} Registrar y Activar Acceso
              </button>
              <button onClick={() => setShowModalNuevoUsuario(false)} className="text-gray-600 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors py-2">Cancelar Operación</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CANCELAR MANTENIMIENTO */}
      {showCancelModal && seleccionado && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/95 backdrop-blur-3xl p-0 sm:p-6">
          <div className="bg-[#0f0f12] border border-red-500/30 w-full max-w-lg rounded-t-[40px] sm:rounded-[64px] overflow-hidden shadow-3xl">
            <div className="p-6 sm:p-12 border-b border-white/5">
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />
              <div className="flex items-center gap-3 sm:gap-4 text-red-500 mb-4 sm:mb-6">
                <AlertCircle size={24} />
                <h3 className="text-xl sm:text-3xl font-black italic uppercase tracking-tighter text-white">Cancelar Mantenimiento</h3>
              </div>
              <p className="text-gray-400 text-sm">Estás a punto de cancelar el mantenimiento del vehículo:<br /><span className="font-bold text-white">{seleccionado.vehiculo}</span></p>
            </div>
            <div className="p-6 sm:p-12 space-y-5 sm:space-y-8">
              <div className="space-y-2 sm:space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-red-400">MOTIVO DE LA CANCELACIÓN (obligatorio)</p>
                <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Explica la razón por la que no se puede completar el mantenimiento..."
                  className="w-full bg-white/5 border border-white/10 rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 text-sm text-white outline-none focus:border-red-500 h-28 sm:h-40 resize-y font-medium" />
              </div>
              <div className="flex gap-3 sm:gap-4">
                <button onClick={() => { setShowCancelModal(false); setCancelReason(""); }} className="flex-1 py-4 sm:py-6 bg-white/5 hover:bg-white/10 rounded-[24px] sm:rounded-[32px] font-black uppercase tracking-widest text-sm transition-all">Volver</button>
                <button onClick={cancelarMantenimiento} disabled={cancelando || !cancelReason.trim()}
                  className="flex-1 py-4 sm:py-6 bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:opacity-50 rounded-[24px] sm:rounded-[32px] font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 sm:gap-3">
                  {cancelando ? <Loader2 className="animate-spin" size={18} /> : <><X size={18} /> Confirmar</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ ModalConfirmar para cerrar sesión */}
      {confirmLogout && (
        <ModalConfirmar titulo="Cerrar Sesión" mensaje="¿Estás seguro de que quieres cerrar sesión?" detalle="Tendrás que volver a introducir tus credenciales para acceder."
          onConfirmar={() => { setConfirmLogout(false); handleLogout(); }} onCerrar={() => setConfirmLogout(false)} colorBoton="bg-red-600 hover:bg-red-700" />
      )}

      {/* ✅ ModalAlerta inline (reemplaza AlertModal externo) */}
      {alerta.visible && (
        <ModalAlerta
          titulo={alerta.titulo}
          mensaje={alerta.mensaje}
          tipo={alerta.tipo}
          onCerrar={closeAlert}
        />
      )}
    </div>
  );
}
