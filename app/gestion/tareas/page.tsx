"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut, Mail, Phone, Plus, Trash2, Send, Loader2, Car, Search,
  CheckCircle, Printer, MessageSquare, Wrench, X, FilePlus2,
  UserPlus, ChevronRight, ChevronLeft, AlertCircle, Package,
  History, FileText, Briefcase
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AlertModal from "../../../components/AlertModal";

// --- INTERFACES ---
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

  const [presupuestos, setPresupuestos] = useState<PresupuestoPedido[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [seleccionado, setSeleccionado] = useState<PresupuestoPedido | null>(null);
  const [facturas, setFacturas] = useState<any[]>([]);

  const [codigoBusqueda, setCodigoBusqueda] = useState("");
  const [filtroStock, setFiltroStock] = useState("");
  const [lineas, setLineas] = useState<LineaPresupuesto[]>([]);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [facturando, setFacturando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const [showNuevoPresupuesto, setShowNuevoPresupuesto] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [showModalNuevoUsuario, setShowModalNuevoUsuario] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [usuarioExiste, setUsuarioExiste] = useState(false);
  const [sugerencias, setSugerencias] = useState<Articulo[]>([]);

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    documento_identidad: "",
    vehiculo: "",
    anio: new Date().getFullYear(),
    mensaje: "",
    tipo_cliente: "particular"   // ← Cambia esta línea
  });

  // ==================== ESTADO PARA ALERTAS ====================
  const [alert, setAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const router = useRouter();

  const showAlert = (title: string, message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    setAlert({ isOpen: true, title, message, type });
  };

  const closeAlert = () => setAlert(prev => ({ ...prev, isOpen: false }));

  const cargarTodo = useCallback(async () => {
    setLoading(true);
    try {
      const [resPres, resArt, resFac] = await Promise.all([
        fetch("/api/presupuestos"),
        fetch("/api/articulos"),
        fetch("/api/facturas")
      ]);

      if (resPres.ok) setPresupuestos(await resPres.json());
      if (resArt.ok) setArticulos(await resArt.json());
      if (resFac.ok) setFacturas(await resFac.json());
    } catch (error) {
      console.error("Error cargando datos:", error);
      showAlert("Error de carga", "No se pudieron cargar los datos. Inténtalo de nuevo.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (!role) router.push("/login");
    else {
      setNombreUsuario(localStorage.getItem("user_name") || "Trabajador");
      cargarTodo();
    }
  }, [router, cargarTodo]);

  // ====================== VERIFICACIÓN POR DNI ======================
  const verificarUsuario = async () => {
    const dni = nuevoCliente.documento_identidad.trim().toUpperCase();
    if (!dni) return;

    setVerificando(true);
    try {
      const res = await fetch(`/api/usuarios?dni=${encodeURIComponent(dni)}`);
      const data = await res.json();

      if (res.ok && data.existe) {
        setUsuarioExiste(true);
        setNuevoCliente(prev => ({
          ...prev,
          nombre: data.usuario.nombre || prev.nombre,
          apellidos: `${data.usuario.apellido1 || ""} ${data.usuario.apellido2 || ""}`.trim(),
          email: data.usuario.email || prev.email,
          telefono: data.usuario.telefono || prev.telefono,
          documento_identidad: data.usuario.documento_identidad || prev.documento_identidad,
          tipo_cliente: data.usuario.tipo_cliente || "Particular"
        }));
        showAlert("Cliente encontrado", "Los datos se han cargado automáticamente.", "success");
      } else {
        setUsuarioExiste(false);
        setShowModalNuevoUsuario(true);
      }
    } catch (error) {
      console.error("Error verificando DNI:", error);
      showAlert("Error", "No se pudo verificar el DNI. Inténtalo de nuevo.", "error");
    } finally {
      setVerificando(false);
    }
  };

  const crearUsuarioYContinuar = async () => {
    if (!nuevoCliente.documento_identidad || !nuevoCliente.nombre || !nuevoCliente.email) {
      showAlert("Datos incompletos", "El DNI, Nombre y Email son obligatorios", "warning");
      return;
    }

    const telefonoLimpio = nuevoCliente.telefono.replace(/[\s\-\(\)\.]/g, "");
    if (!telefonoLimpio || !/^[6-9]\d{8}$/.test(telefonoLimpio)) {
      showAlert("Teléfono inválido", "El teléfono debe tener 9 dígitos empezando por 6-9", "warning");
      return;
    }

    const partes = nuevoCliente.apellidos.trim().split(/\s+/);
    const ape1 = partes[0]?.toUpperCase() || "";
    const ape2 = partes.slice(1).join(" ").toUpperCase() || "";

    setVerificando(true);

    try {
      const resUsuario = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevoCliente.nombre.trim().toUpperCase(),
          apellido1: ape1,
          apellido2: ape2,
          email: nuevoCliente.email.trim().toLowerCase(),
          telefono: telefonoLimpio,
          documento_identidad: nuevoCliente.documento_identidad.trim().toUpperCase(),
          tipo_cliente: nuevoCliente.tipo_cliente   // ← enviamos directamente lo del estado
        })
      });

      const data: any = await resUsuario.json().catch(() => ({}));

      if (resUsuario.ok) {
        setUsuarioExiste(true);
        setShowModalNuevoUsuario(false);
        showAlert("¡Cliente registrado!", "El cliente se ha creado correctamente.", "success");
        await cargarTodo();
      } else {
        console.error("❌ Error del servidor:", data);
        showAlert(
          "Error al registrar cliente",
          data?.detalle || data?.error || `Error ${resUsuario.status}`,
          "error"
        );
      }
    } catch (error: any) {
      console.error("Error de conexión:", error);
      showAlert("Error de conexión", "No se pudo conectar con el servidor.", "error");
    } finally {
      setVerificando(false);
    }
  };

  const buscarYAñadirArticuloModal = async () => {
    const cod = codigoBusqueda.toUpperCase().trim();
    if (!cod) return;
    try {
      const res = await fetch(`/api/articulos/${cod}`);
      if (res.ok) {
        const art: Articulo = await res.json();
        setLineas(prev => {
          const existe = prev.find(item => item.codigo.toUpperCase() === art.codigo.toUpperCase());
          if (existe) {
            return prev.map(item => item.codigo.toUpperCase() === art.codigo.toUpperCase() ? { ...item, cantidad: item.cantidad + 1 } : item);
          }
          return [...prev, { ...art, cantidad: 1 }];
        });
        setCodigoBusqueda("");
        setSugerencias([]);
      } else {
        showAlert("Artículo no encontrado", "No existe ningún artículo con ese código", "warning");
      }
    } catch (e) {
      console.error(e);
      showAlert("Error", "No se pudo buscar el artículo", "error");
    }
  };

  const manejarCreacionPresupuesto = async () => {
    const partes = nuevoCliente.apellidos.trim().split(/\s+/);
    const ape1 = partes[0]?.toUpperCase() || "";
    const ape2 = partes.slice(1).join(" ").toUpperCase() || "";

    setVerificando(true);
    try {
      const resPres = await fetch("/api/presupuestos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...nuevoCliente,
          nombre: nuevoCliente.nombre.trim().toUpperCase(),
          apellidos1: ape1,
          apellidos2: ape2,
          estado: "Pendiente",
          articulos: lineas
        })
      });

      if (resPres.ok) {
        setShowNuevoPresupuesto(false);
        setModalStep(1);
        setLineas([]);
        setSugerencias([]);
        setNuevoCliente({ nombre: "", apellidos: "", email: "", telefono: "", documento_identidad: "", vehiculo: "", anio: new Date().getFullYear(), mensaje: "", tipo_cliente: "Particular" });
        await cargarTodo();
        showAlert("¡Presupuesto creado!", "El presupuesto se ha guardado correctamente.", "success");
      } else {
        showAlert("Error al guardar", "No se pudo guardar el presupuesto", "error");
      }
    } catch (error: any) {
      showAlert("Error", `ERROR AL GUARDAR: ${error.message}`, "error");
    } finally {
      setVerificando(false);
    }
  };

  // ====================== FUNCIÓN PDF ======================
  const generarFacturaPDF = (data: any, abrirEnVentana: boolean = true) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, pageWidth, 55, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);

    const titulo = data.esPresupuesto ? "AJCAR 25 - PRESUPUESTO" : "AJCAR 25 - FACTURA";
    doc.text(titulo, margin, 35);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Nº: ${data.numero_factura || data.id || "TEMP"}`, margin, 70);
    doc.text(
      `FECHA: ${new Date(data.fecha_emision || Date.now()).toLocaleDateString('es-ES')}`,
      pageWidth - margin,
      70,
      { align: "right" }
    );

    let y = 85;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL CLIENTE:", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const clienteNombre = data.cliente_nombre || `${data.nombre || "N/A"} ${data.apellidos1 || ""}`.trim();

    doc.text(`Cliente: ${clienteNombre}`, margin, y); y += 7;
    if (data.vehiculo) doc.text(`Vehículo: ${data.vehiculo}`, margin, y); y += 7;
    doc.text(`Email: ${data.email || "N/A"}`, margin, y); y += 12;

    const tableBody = (data.articulos || []).map((art: any) => [
      art.descripcion || art.nombre || "Artículo",
      art.cantidad.toString(),
      `${Number(art.precio_unitario || 0).toFixed(2)}€`,
      `${(art.cantidad * Number(art.precio_unitario || 0)).toFixed(2)}€`
    ]);

    autoTable(doc, {
      startY: y,
      head: [["DESCRIPCIÓN", "CANT.", "PRECIO UN.", "TOTAL"]],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: [17, 24, 39],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 10,
        halign: "center"
      },
      styles: { fontSize: 9, cellPadding: 6, lineColor: [200, 200, 200] },
      columnStyles: {
        0: { halign: "left", cellWidth: "auto" },
        1: { halign: "center", cellWidth: 25 },
        2: { halign: "right", cellWidth: 35 },
        3: { halign: "right", cellWidth: 35 }
      },
      margin: { left: margin, right: margin }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;
    const total = data.total || tableBody.reduce((acc: number, row: any[]) => acc + parseFloat(row[3].replace("€", "")), 0);

    doc.setFillColor(41, 128, 185);
    doc.rect(margin, finalY, pageWidth - margin * 2, 12, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(data.esPresupuesto ? "TOTAL PRESUPUESTO" : "TOTAL FACTURA", margin + 8, finalY + 8.5);

    doc.setFontSize(14);
    doc.text(`${total.toFixed(2)}€`, pageWidth - margin - 8, finalY + 8.5, { align: "right" });

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Gracias por confiar en AJCAR 25", margin, finalY + 30);

    if (abrirEnVentana) {
      window.open(doc.output("bloburl"), "_blank");
    }

    return doc.output('datauristring');
  };

  const imprimirFacturaExistente = (factura: any) => {
    generarFacturaPDF(factura, true);
  };

  const procesarFactura = async () => {
    const articulosAFacturar = (view === "mantenimientos" || view === "aceptados")
      ? seleccionado?.articulos
      : lineas;

    if (!seleccionado || !articulosAFacturar || articulosAFacturar.length === 0) {
      showAlert("Sin artículos", "No hay artículos seleccionados para facturar.", "warning");
      return;
    }

    setFacturando(true);

    try {
      const totalCalculado = articulosAFacturar.reduce((acc, item) => acc + Number(item.precio_unitario) * item.cantidad, 0);

      const facturaData = {
        ...seleccionado,
        articulos: articulosAFacturar,
        total: totalCalculado,
        fecha_emision: new Date(),
        cliente_nombre: `${seleccionado.nombre} ${seleccionado.apellidos1 || ""}`.trim(),
      };

      const pdfDataUri = generarFacturaPDF(facturaData, true);
      const pdfBase64 = pdfDataUri.includes(',') ? pdfDataUri.split(',')[1] : pdfDataUri;

      const payload = {
        presupuesto_id: seleccionado.id,
        cliente_nombre: facturaData.cliente_nombre,
        email: seleccionado.email || "cliente@ajcar25.com",
        vehiculo: seleccionado.vehiculo || "",
        total: totalCalculado.toFixed(2),
        articulos: articulosAFacturar,
        pdfBase64
      };

      const res = await fetch("/api/facturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const responseData = await res.json().catch(() => ({}));

      if (res.ok) {
        showAlert("¡Factura generada!", "Factura creada, stock actualizado y email enviado.", "success");
        await cargarTodo();
        setSeleccionado(null);
      } else {
        showAlert("Error al facturar", responseData.error || "No se pudo procesar la factura", "error");
      }
    } catch (e: any) {
      console.error("Error al facturar:", e);
      showAlert("Error de conexión", "Revisa tu conexión e inténtalo de nuevo.", "error");
    } finally {
      setFacturando(false);
    }
  };

  const totalPresupuesto = lineas.reduce((acc, item) => acc + (Number(item.precio_unitario) * item.cantidad), 0);

  const enviarPresupuestoPDF = async () => {
    if (!seleccionado || !seleccionado.id || !seleccionado.email) {
      showAlert("Datos incompletos", "El presupuesto no tiene ID o el cliente no tiene email asignado.", "warning");
      return;
    }
    if (lineas.length === 0) {
      showAlert("Sin artículos", "No hay artículos en el presupuesto.", "warning");
      return;
    }

    setEnviandoEmail(true);

    try {
      const totalCalc = lineas.reduce((acc, item) => acc + Number(item.precio_unitario) * item.cantidad, 0);

      const presupuestoData = {
        ...seleccionado,
        articulos: lineas,
        total: totalCalc,
        fecha_emision: new Date(),
        cliente_nombre: `${seleccionado.nombre} ${seleccionado.apellidos1 || ""}`.trim(),
        esPresupuesto: true
      };

      const pdfDataUri = generarFacturaPDF(presupuestoData, false);
      const pdfBase64 = pdfDataUri.includes(',') ? pdfDataUri.split(',')[1] : pdfDataUri;

      const res = await fetch("/api/enviar-presupuesto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: seleccionado.id,
          email: seleccionado.email,
          nombre: `${seleccionado.nombre} ${seleccionado.apellidos1 || ""}`.trim(),
          vehiculo: seleccionado.vehiculo || "",
          total: totalCalc.toFixed(2),
          pdfBase64,
          articulos: lineas
        })
      });

      if (res.ok) {
        showAlert("¡Presupuesto enviado!", "Se ha enviado correctamente por correo electrónico.", "success");
        await cargarTodo();
        setSeleccionado(null);
      } else {
        showAlert("Error al enviar", "No se pudo enviar el presupuesto.", "error");
      }
    } catch (e: any) {
      console.error("Error al enviar presupuesto:", e);
      showAlert("Error de conexión", "Revisa la consola para más detalles.", "error");
    } finally {
      setEnviandoEmail(false);
    }
  };

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    setCambiandoEstado(true);
    try {
      const res = await fetch(`/api/presupuestos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (res.ok) {
        await cargarTodo();
        setSeleccionado(null);
        showAlert("Estado actualizado", "El estado del presupuesto se ha cambiado correctamente.", "success");
      } else {
        showAlert("Error", "No se pudo actualizar el estado.", "error");
      }
    } catch (e) {
      showAlert("Error", "Error al actualizar el estado.", "error");
    } finally {
      setCambiandoEstado(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-gray-400 font-sans selection:bg-blue-500/30">
      <main className="w-full flex flex-col min-h-screen">
        <div className="p-8 lg:p-16 max-w-7xl w-full mx-auto">

          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-900/20">AJ</div>
                <div>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest leading-none mb-1">{nombreUsuario}</p>
                  <p className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter">Panel de Gestión</p>
                </div>
              </div>
              <h1 className="text-white text-5xl lg:text-7xl font-black italic uppercase tracking-tighter leading-none">
                {view === 'mantenimientos' ? 'TALLER' : view.toUpperCase()}
              </h1>
            </div>

            <nav className="flex items-center gap-1 bg-white/[0.03] p-1.5 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-md">
              {[
                { id: 'presupuestos', label: 'Presupuestos' },
                { id: 'aceptados', label: 'Aceptados' },
                { id: 'mantenimientos', label: 'Taller' },
                { id: 'stock', label: 'Almacén' },
                { id: 'facturas', label: 'Facturas' }
              ].map((v) => (
                <button key={v.id} onClick={() => { setView(v.id as any); setSeleccionado(null); }}
                  className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === v.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-gray-300'}`}>
                  {v.label}
                </button>
              ))}
              <button
                onClick={() => {
                  setShowNuevoPresupuesto(true);
                  setModalStep(1);
                  setLineas([]);
                  setSugerencias([]);
                  setUsuarioExiste(false);
                  setNuevoCliente({ nombre: "", apellidos: "", email: "", telefono: "", documento_identidad: "", vehiculo: "", anio: new Date().getFullYear(), mensaje: "", tipo_cliente: "Particular" });
                }}
                className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-600/10 transition-all border border-blue-500/20 ml-1 flex items-center gap-2"
              >
                <FilePlus2 size={14} /> Crear
              </button>
              <button onClick={handleLogout} className="p-2.5 text-red-500/80 hover:text-red-400 hover:bg-red-500/5 rounded-2xl transition-all ml-2"><LogOut size={18} /></button>
            </nav>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7 space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[#0f0f12] rounded-[40px] border border-white/5">
                  <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
                  <p className="text-[10px] uppercase font-black tracking-widest">Cargando Sistema...</p>
                </div>
              ) : view === "stock" ? (
                /* ... mismo código de stock ... */
                <div className="bg-[#0f0f12] rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
                  {/* (código de stock sin cambios) */}
                  <div className="p-8 border-b border-white/5 bg-white/[0.01] flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-black italic uppercase tracking-tighter">Últimos artículos utilizados</h3>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest">Mostrando los 5 más recientes</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl flex items-center px-6 border border-white/5 flex-1 max-w-md ml-8">
                      <Search size={16} className="text-gray-600 mr-4" />
                      <input type="text" value={filtroStock} onChange={(e) => setFiltroStock(e.target.value)} placeholder="FILTRAR..." className="bg-transparent border-none focus:ring-0 text-xs text-white w-full py-4 uppercase font-bold tracking-tight" />
                    </div>
                  </div>
                  <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-black/20 text-[10px] font-black uppercase tracking-widest text-gray-500 sticky top-0 backdrop-blur-md">
                        <tr><th className="p-8">Referencia</th><th className="p-8">Descripción</th><th className="p-8 text-center">En Stock</th></tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {articulos
                          .filter(a => {
                            const termino = filtroStock.toLowerCase();
                            return a.codigo?.toLowerCase().includes(termino) || a.descripcion?.toLowerCase().includes(termino);
                          })
                          .sort((a, b) => b.id - a.id)
                          .map(art => (
                            <tr key={art.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="p-8 font-mono text-blue-400 font-bold">{art.codigo}</td>
                              <td className="p-8 text-gray-300 uppercase text-[11px] font-bold">{art.descripcion}</td>
                              <td className={`p-8 text-center font-black text-lg italic ${art.stock < 5 ? 'text-red-500' : 'text-white'}`}>{art.stock}</td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : view === "facturas" ? (
                <div className="grid grid-cols-1 gap-4">
                  {facturas.map(f => (
                    <div key={f.id} className="bg-[#0f0f12] p-10 rounded-[40px] border border-white/5 flex justify-between items-center group hover:border-blue-500/30 transition-all shadow-xl">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-gray-500 group-hover:text-blue-500 transition-colors">
                          <FileText size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-600 uppercase mb-1 tracking-widest">Factura No. {String(f.id).slice(0, 8)}</p>
                          <h4 className="text-white text-xl font-black italic uppercase tracking-tighter">{f.cliente_nombre}</h4>
                          <p className="text-xs text-gray-500 font-bold uppercase">{f.vehiculo} • {new Date(f.fecha_emision).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-3xl font-black text-white italic tracking-tighter">{Number(f.total).toFixed(2)}€</p>
                          <div className="flex items-center gap-3 justify-end mt-2">
                            <span className="text-[9px] bg-green-500/10 text-green-500 px-4 py-1.5 rounded-full font-black uppercase tracking-widest border border-green-500/20">Liquidada</span>
                            <button onClick={() => imprimirFacturaExistente(f)} className="p-2 bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white rounded-xl transition-all border border-blue-500/20" title="Imprimir Factura">
                              <Printer size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {presupuestos.filter(p => {
                    if (view === "presupuestos") return p.estado === "Pendiente" || p.estado === "Enviado";
                    if (view === "aceptados") return p.estado === "Aceptado por el cliente";
                    if (view === "mantenimientos") return p.estado === "En Taller";
                    return false;
                  }).map(p => (
                    <div key={p.id} onClick={() => { setSeleccionado(p); setLineas(p.articulos || []); setSugerencias([]); }}
                      className={`p-10 rounded-[48px] border transition-all duration-500 cursor-pointer relative overflow-hidden group ${seleccionado?.id === p.id ? 'bg-blue-600 border-blue-500 text-white shadow-2xl shadow-blue-900/40' : 'bg-[#0f0f12] border-white/5 hover:border-white/10'}`}>
                      {seleccionado?.id === p.id && <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full animate-pulse" />}
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-8">
                          <div className={`p-3 rounded-2xl ${seleccionado?.id === p.id ? 'bg-white/20' : 'bg-blue-500/10 text-blue-500'}`}>
                            <Car size={24} />
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${seleccionado?.id === p.id ? 'bg-black/20 text-white' : 'bg-white/5 text-gray-500'}`}>{p.estado}</span>
                        </div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${seleccionado?.id === p.id ? 'text-blue-100/70' : 'text-gray-600'}`}>{p.vehiculo}</p>
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{p.nombre} {p.apellidos1}</h3>
                        <div className="mt-6 flex items-center gap-2 opacity-50 text-[9px] font-bold uppercase">
                          <History size={12} /> {new Date(p.creado_en).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <aside className="lg:col-span-5 sticky top-8">
              <div className="bg-[#0f0f12] rounded-[56px] border border-white/5 overflow-hidden shadow-2xl min-h-[600px] flex flex-col">
                {seleccionado ? (
                  <div className="p-12 space-y-10 animate-in slide-in-from-right-8 duration-500 flex-1 flex flex-col">
                    {/* ... todo el contenido del aside sin cambios ... */}
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Expediente Detallado</span>
                      <button onClick={() => { setSeleccionado(null); setSugerencias([]); }} className="bg-white/5 p-3 rounded-2xl text-gray-600 hover:text-white transition-all"><X size={20} /></button>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-4xl font-black italic uppercase text-white leading-[0.8] tracking-tighter">{seleccionado.nombre}<br />{seleccionado.apellidos1}</h3>
                      <div className="flex flex-wrap gap-6 pt-2">
                        <div className="space-y-1">
                          <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Contacto Directo</p>
                          <div className="flex items-center gap-3 text-xs uppercase font-bold text-gray-400 hover:text-blue-400 transition-colors cursor-pointer"><Mail size={14} /> {seleccionado.email}</div>
                          <div className="flex items-center gap-3 text-xs uppercase font-bold text-gray-400 hover:text-blue-400 transition-colors cursor-pointer"><Phone size={14} /> {seleccionado.telefono}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-600/5 border border-blue-500/10 p-8 rounded-[40px] relative group overflow-hidden">
                      <MessageSquare className="absolute -bottom-2 -right-2 text-blue-500/10 group-hover:scale-110 transition-transform duration-700" size={80} />
                      <p className="text-[9px] font-black uppercase text-blue-500 mb-3 tracking-widest flex items-center gap-2">
                        <AlertCircle size={12} /> Motivo del Ingreso
                      </p>
                      <p className="text-sm text-gray-300 italic font-medium leading-relaxed relative z-10 uppercase tracking-tight">
                        "{seleccionado.mensaje || "Sin observaciones específicas del cliente."}"
                      </p>
                    </div>

                    {view === "presupuestos" && (
                      <div className="space-y-8 flex-1 flex flex-col justify-end">
                        <div className="space-y-4">
                          <div className="flex gap-3 relative">
                            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl flex items-center px-5 focus-within:border-blue-500 transition-all shadow-inner relative">
                              <Package size={16} className="text-gray-600 mr-4" />
                              <input
                                value={codigoBusqueda}
                                onChange={(e) => {
                                  const valor = e.target.value.toUpperCase();
                                  setCodigoBusqueda(valor);
                                  if (valor.length > 0) {
                                    const filtrados = articulos.filter(a =>
                                      a.codigo.toUpperCase().includes(valor) || a.descripcion.toUpperCase().includes(valor)
                                    ).slice(0, 5);
                                    setSugerencias(filtrados);
                                  } else {
                                    setSugerencias([]);
                                  }
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && buscarYAñadirArticuloModal()}
                                placeholder="AÑADIR PIEZA..."
                                className="bg-transparent border-none focus:ring-0 text-[10px] text-white w-full py-5 uppercase font-black"
                              />
                              {sugerencias.length > 0 && (
                                <div className="absolute top-full left-0 w-full bg-[#16161a] border border-white/10 rounded-2xl mt-2 z-[150] shadow-2xl overflow-hidden">
                                  {sugerencias.map((sug) => (
                                    <div
                                      key={sug.id}
                                      onClick={() => {
                                        setLineas(prev => {
                                          const existe = prev.find(item => item.codigo === sug.codigo);
                                          if (existe) return prev.map(item => item.codigo === sug.codigo ? { ...item, cantidad: item.cantidad + 1 } : item);
                                          return [...prev, { ...sug, cantidad: 1 }];
                                        });
                                        setCodigoBusqueda("");
                                        setSugerencias([]);
                                      }}
                                      className="p-4 hover:bg-blue-600/20 cursor-pointer border-b border-white/5 flex justify-between items-center transition-colors group"
                                    >
                                      <div>
                                        <p className="text-[10px] text-white font-black uppercase tracking-tight group-hover:text-blue-400">{sug.descripcion}</p>
                                        <p className="text-[8px] text-gray-500 font-mono font-bold">{sug.codigo}</p>
                                      </div>
                                      <span className="text-[10px] text-blue-500 font-black italic">{Number(sug.precio_unitario).toFixed(2)}€</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button onClick={buscarYAñadirArticuloModal} className="bg-blue-600 w-16 rounded-2xl text-white flex items-center justify-center hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all active:scale-95"><Plus size={24} /></button>
                          </div>

                          <div className="space-y-2 max-h-56 overflow-y-auto pr-4 custom-scrollbar">
                            {lineas.map((l, i) => (
                              <div key={i} className="flex justify-between items-center bg-white/[0.02] p-5 rounded-3xl border border-white/5 group hover:border-blue-500/20 transition-all">
                                <div>
                                  <p className="text-[10px] text-gray-300 font-black uppercase tracking-tight">{l.descripcion}</p>
                                  <p className="text-[8px] text-blue-500 font-mono font-bold">{l.codigo} • QTY: {l.cantidad}</p>
                                </div>
                                <div className="flex items-center gap-6">
                                  <span className="text-sm font-black text-white italic">{(l.cantidad * l.precio_unitario).toFixed(2)}€</span>
                                  <button onClick={() => setLineas(lineas.filter((_, idx) => idx !== i))} className="text-gray-800 hover:text-red-500 transition-colors p-2"><Trash2 size={18} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-10 bg-blue-600 rounded-[48px] flex justify-between items-center shadow-3xl shadow-blue-900/50 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-bl-full group-hover:scale-150 transition-transform duration-700" />
                          <div className="flex flex-col relative z-10">
                            <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Presupuesto Total</span>
                            <span className="text-5xl font-black italic text-white tracking-tighter leading-none">{totalPresupuesto.toFixed(2)}€</span>
                          </div>
                          <button onClick={enviarPresupuestoPDF} disabled={enviandoEmail || lineas.length === 0} className="bg-white text-blue-600 px-8 py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:scale-105 transition-all shadow-xl disabled:opacity-50 relative z-10 active:scale-95">
                            {enviandoEmail ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Enviar
                          </button>
                        </div>
                      </div>
                    )}

                    {view === "aceptados" && (
                      <div className="mt-auto space-y-6">
                        <div className="bg-white/5 rounded-[40px] p-8 border border-white/5">
                          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-6">Resumen de Intervención</p>
                          <div className="space-y-3">
                            {seleccionado.articulos?.map((art, idx) => (
                              <div key={idx} className="flex justify-between text-xs font-bold uppercase tracking-tight text-gray-400">
                                <span>{art.descripcion} x{art.cantidad}</span>
                                <span className="text-white italic">{(art.precio_unitario * art.cantidad).toFixed(2)}€</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <button onClick={() => cambiarEstado(seleccionado.id, "En Taller")} disabled={cambiandoEstado} className="w-full bg-green-600 text-white py-8 rounded-[40px] font-black text-[11px] uppercase tracking-[0.5em] flex items-center justify-center gap-4 hover:bg-green-500 transition-all shadow-2xl shadow-green-900/30 active:scale-95">
                          {cambiandoEstado ? <Loader2 className="animate-spin" size={20} /> : <Wrench size={20} />} Ingresar a Taller
                        </button>
                      </div>
                    )}

                    {view === "mantenimientos" && (
                      <div className="mt-auto">
                        <button onClick={procesarFactura} disabled={facturando} className="w-full bg-white text-black py-8 rounded-[40px] font-black text-[11px] uppercase tracking-[0.5em] flex items-center justify-center gap-4 shadow-2xl hover:bg-gray-200 transition-all active:scale-95">
                          {facturando ? <Loader2 className="animate-spin" size={20} /> : <Printer size={20} />} Finalizar y Facturar
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center opacity-10 py-40">
                    <Car size={120} className="mb-10 animate-pulse text-blue-600" strokeWidth={1} />
                    <p className="text-lg font-black uppercase tracking-[1em] italic">AJCAR 25</p>
                    <p className="text-[10px] uppercase tracking-[0.3em] mt-4 font-bold">Selecciona una ficha para gestionar</p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* MODAL NUEVA FICHA */}
      {showNuevoPresupuesto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6">
          <div className="bg-[#0f0f12] border border-white/10 w-full max-w-3xl rounded-[64px] overflow-hidden shadow-3xl animate-in zoom-in duration-500 flex flex-col max-h-[90vh]">
            {/* ... todo el contenido del modal paso 1 y 2 sin cambios ... */}
            <div className="p-12 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-600/10 via-transparent to-transparent">
              <div>
                <h2 className="text-white text-4xl font-black italic uppercase tracking-tighter leading-none">Apertura de Ficha</h2>
                <div className="flex gap-6 mt-6">
                  <div className={`flex items-center gap-3 transition-opacity ${modalStep === 1 ? 'opacity-100' : 'opacity-30'}`}>
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-black">1</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Identificación</span>
                  </div>
                  <div className={`flex items-center gap-3 transition-opacity ${modalStep === 2 ? 'opacity-100' : 'opacity-30'}`}>
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-black">2</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Configuración</span>
                  </div>
                </div>
              </div>
              <button onClick={() => { setShowNuevoPresupuesto(false); setModalStep(1); setLineas([]); setSugerencias([]); }} className="bg-white/5 p-6 rounded-full text-gray-500 hover:text-white transition-all hover:rotate-90"><X size={24} /></button>
            </div>

            <div className="p-12 overflow-y-auto custom-scrollbar flex-1">
              {modalStep === 1 ? (
                <div className="space-y-8 animate-in slide-in-from-left-8 duration-500">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-gray-600 uppercase ml-5 tracking-widest">DNI / CIF del Cliente</p>
                    <div className="flex gap-4">
                      <input placeholder="00000000X o CIF" className="flex-1 bg-white/5 border border-white/10 rounded-[28px] p-6 text-sm text-white uppercase outline-none focus:border-blue-500 transition-all font-bold tracking-tight shadow-inner" value={nuevoCliente.documento_identidad} onChange={(e) => { setNuevoCliente({ ...nuevoCliente, documento_identidad: e.target.value.toUpperCase() }); setUsuarioExiste(false); }} onBlur={verificarUsuario} />
                      <button onClick={verificarUsuario} disabled={verificando || !nuevoCliente.documento_identidad} className="bg-blue-600 px-8 rounded-[28px] text-white font-black uppercase text-xs tracking-widest hover:bg-blue-500 disabled:opacity-50">{verificando ? <Loader2 className="animate-spin" size={20} /> : "Verificar"}</button>
                    </div>
                  </div>

                  {usuarioExiste && (
                    <div className="flex items-center gap-4 bg-green-500/10 border border-green-500/20 p-6 rounded-[32px] text-xs text-green-400 font-black uppercase tracking-widest animate-in fade-in zoom-in shadow-lg">
                      <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center"><CheckCircle size={20} /></div>
                      Cliente verificado y listo para operar
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-gray-600 uppercase ml-5 tracking-widest">Nombre del Cliente</p>
                      <input placeholder="EJ: JUAN" className="w-full bg-white/5 border border-white/10 rounded-[28px] p-6 text-sm text-white uppercase outline-none focus:border-blue-500 transition-all font-bold tracking-tight shadow-inner" value={nuevoCliente.nombre} onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value.toUpperCase() })} />
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-gray-600 uppercase ml-5 tracking-widest">Apellidos Completos</p>
                      <input placeholder="EJ: PÉREZ GARCÍA" className="w-full bg-white/5 border border-white/10 rounded-[28px] p-6 text-sm text-white uppercase outline-none focus:border-blue-500 transition-all font-bold tracking-tight shadow-inner" value={nuevoCliente.apellidos} onChange={(e) => setNuevoCliente({ ...nuevoCliente, apellidos: e.target.value.toUpperCase() })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-8">
                    <div className="col-span-2 space-y-3">
                      <p className="text-[10px] font-black text-gray-600 uppercase ml-5 tracking-widest">Modelo de Vehículo</p>
                      <input placeholder="MARCA, MODELO Y MOTORIZACIÓN" className="w-full bg-white/5 border border-white/10 rounded-[28px] p-6 text-sm text-white uppercase outline-none focus:border-blue-500 transition-all font-bold shadow-inner" value={nuevoCliente.vehiculo} onChange={(e) => setNuevoCliente({ ...nuevoCliente, vehiculo: e.target.value.toUpperCase() })} />
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-gray-600 uppercase ml-5 tracking-widest">Año</p>
                      <input type="number" className="w-full bg-white/5 border border-white/10 rounded-[28px] p-6 text-sm text-white outline-none focus:border-blue-500 font-bold shadow-inner" value={nuevoCliente.anio} onChange={(e) => setNuevoCliente({ ...nuevoCliente, anio: parseInt(e.target.value) || 2024 })} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-gray-600 uppercase ml-5 tracking-widest">Descripción de la Avería / Mantenimiento</p>
                    <textarea placeholder="DETALLA LOS SÍNTOMAS O LAS PIEZAS A REVISAR..." className="w-full bg-white/5 border border-white/10 rounded-[40px] p-8 text-sm text-white uppercase outline-none focus:border-blue-500 h-32 resize-none font-bold shadow-inner leading-relaxed" value={nuevoCliente.mensaje} onChange={(e) => setNuevoCliente({ ...nuevoCliente, mensaje: e.target.value.toUpperCase() })} />
                  </div>

                  <button onClick={() => setModalStep(2)} disabled={!usuarioExiste || verificando || !nuevoCliente.nombre} className={`w-full font-black py-8 rounded-[40px] uppercase text-[11px] tracking-[0.5em] transition-all flex items-center justify-center gap-4 shadow-2xl ${(!usuarioExiste || verificando || !nuevoCliente.nombre) ? 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/30'}`}>
                    {verificando ? <Loader2 className="animate-spin" size={20} /> : "Siguiente Paso"} <ChevronRight size={20} />
                  </button>
                </div>
              ) : (
                <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                  <div className="flex gap-4 relative">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-[32px] flex items-center px-8 focus-within:border-blue-500 transition-all shadow-inner relative">
                      <Package size={20} className="text-gray-600 mr-4" />
                      <input value={codigoBusqueda} onChange={(e) => { const valor = e.target.value.toUpperCase(); setCodigoBusqueda(valor); if (valor.length > 0) { const filtrados = articulos.filter(a => a.codigo.toUpperCase().includes(valor) || a.descripcion.toUpperCase().includes(valor)).slice(0, 5); setSugerencias(filtrados); } else { setSugerencias([]); } }} onKeyDown={(e) => { if (e.key === 'Enter') buscarYAñadirArticuloModal(); }} placeholder="ESCRIBE CÓDIGO O NOMBRE DE PIEZA..." className="bg-transparent border-none focus:ring-0 text-xs text-white w-full py-6 uppercase font-black tracking-widest" />
                      {sugerencias.length > 0 && (
                        <div className="absolute top-full left-0 w-full bg-[#16161a] border border-white/10 rounded-[24px] mt-2 z-[150] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                          {sugerencias.map((sug) => (
                            <div key={sug.id} onClick={() => { setLineas(prev => { const existe = prev.find(item => item.codigo === sug.codigo); if (existe) return prev.map(item => item.codigo === sug.codigo ? { ...item, cantidad: item.cantidad + 1 } : item); return [...prev, { ...sug, cantidad: 1 }]; }); setCodigoBusqueda(""); setSugerencias([]); }} className="p-5 hover:bg-blue-600/20 cursor-pointer border-b border-white/5 flex justify-between items-center transition-colors group">
                              <div>
                                <p className="text-[11px] text-white font-black uppercase tracking-tight group-hover:text-blue-400">{sug.descripcion}</p>
                                <p className="text-[9px] text-gray-500 font-mono font-bold">{sug.codigo}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-blue-500 font-black italic">{Number(sug.precio_unitario).toFixed(2)}€</p>
                                <p className="text-[8px] text-gray-600 uppercase font-bold tracking-tighter">Stock: {sug.stock}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={buscarYAñadirArticuloModal} className="bg-blue-600 px-10 rounded-[32px] text-white hover:bg-blue-500 shadow-xl shadow-blue-600/30 transition-all active:scale-95"><Plus size={32} /></button>
                  </div>

                  <div className="bg-black/40 rounded-[48px] border border-white/5 p-4 min-h-[300px] max-h-[400px] overflow-y-auto custom-scrollbar">
                    {lineas.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 opacity-20">
                        <Package size={64} className="mb-4" />
                        <p className="text-sm font-black uppercase tracking-[0.4em]">Sin piezas seleccionadas</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {lineas.map((l, i) => (
                          <div key={i} className="flex justify-between items-center p-6 bg-white/[0.03] hover:bg-white/[0.06] rounded-[32px] transition-all group border border-transparent hover:border-blue-500/30">
                            <div className="flex items-center gap-6">
                              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-blue-500 font-black italic">#{i + 1}</div>
                              <div>
                                <p className="text-sm text-white font-black uppercase tracking-tight">{l.descripcion}</p>
                                <p className="text-[10px] text-gray-600 font-mono font-bold tracking-widest">{l.codigo}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-10">
                              <div className="flex items-center gap-4 bg-black/40 rounded-2xl px-5 py-2 border border-white/5 shadow-inner">
                                <button onClick={() => setLineas(lineas.map((item, idx) => idx === i ? { ...item, cantidad: Math.max(1, item.cantidad - 1) } : item))} className="text-blue-500 hover:text-white font-black text-xl transition-colors">-</button>
                                <span className="text-sm font-black text-white w-6 text-center italic">{l.cantidad}</span>
                                <button onClick={() => setLineas(lineas.map((item, idx) => idx === i ? { ...item, cantidad: item.cantidad + 1 } : item))} className="text-blue-500 hover:text-white font-black text-xl transition-colors">+</button>
                              </div>
                              <span className="text-lg font-black text-white italic w-24 text-right">{(l.cantidad * l.precio_unitario).toFixed(2)}€</span>
                              <button onClick={() => setLineas(lineas.filter((_, idx) => idx !== i))} className="text-gray-800 hover:text-red-500 transition-colors p-2"><Trash2 size={22} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-[48px] shadow-3xl shadow-blue-900/40 relative overflow-hidden group">
                    <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                    <div className="relative z-10">
                      <p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.3em] mb-1">Presupuesto Final Estimado</p>
                      <p className="text-5xl font-black italic text-white tracking-tighter leading-none">{totalPresupuesto.toFixed(2)}€</p>
                    </div>
                    <div className="flex gap-4 relative z-10">
                      <button onClick={() => { setModalStep(1); setSugerencias([]); }} className="bg-black/20 px-8 py-5 rounded-[28px] text-[10px] font-black text-white uppercase tracking-widest hover:bg-black/30 transition-all flex items-center gap-3"><ChevronLeft size={16} /> Volver</button>
                      <button onClick={manejarCreacionPresupuesto} className="bg-white px-10 py-5 rounded-[28px] text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl active:scale-95">Finalizar Apertura</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRO NUEVO CLIENTE */}
      {/* MODAL REGISTRO NUEVO CLIENTE */}
      {showModalNuevoUsuario && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/98 backdrop-blur-2xl p-6">
          <div className="bg-[#16161a] border border-blue-600/30 w-full max-w-lg rounded-[70px] p-16 text-center shadow-3xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-blue-600 to-transparent" />
            <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-blue-500/20 shadow-inner">
              <UserPlus size={40} className="text-blue-500" />
            </div>
            <h3 className="text-white text-3xl font-black italic uppercase tracking-tighter mb-4 leading-none">Alta de Cliente</h3>
            <p className="text-gray-500 text-[10px] uppercase mb-12 tracking-[0.2em] leading-relaxed">
              No hay registros para DNI {nuevoCliente.documento_identidad}.<br />
              Es obligatorio cumplimentar la ficha legal.
            </p>

            <div className="space-y-5 mb-12 text-left">
              {/* Régimen del Cliente */}
              <div className="space-y-2">
                <p className="text-[8px] font-black text-blue-500 uppercase ml-5 tracking-widest flex items-center gap-2">
                  <Briefcase size={10} /> Régimen del Cliente
                </p>
                <select
                  value={nuevoCliente.tipo_cliente}
                  onChange={(e) => setNuevoCliente({ ...nuevoCliente, tipo_cliente: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-[24px] p-6 text-xs text-white uppercase outline-none focus:border-blue-500 transition-all font-bold shadow-inner appearance-none cursor-pointer"
                >
                  <option value="particular">Persona Física / Particular</option>
                  <option value="empresa">Persona Jurídica / Empresa / Autónomo</option>
                </select>
              </div>

              {/* DNI (deshabilitado) */}
              <div className="space-y-2">
                <p className="text-[8px] font-black text-blue-500 uppercase ml-5 tracking-widest">Documento de Identidad (DNI/CIF)</p>
                <input
                  placeholder="00000000X"
                  className="w-full bg-white/5 border border-white/10 rounded-[24px] p-6 text-xs text-white uppercase outline-none focus:border-blue-500 transition-all font-bold shadow-inner"
                  value={nuevoCliente.documento_identidad}
                  disabled
                />
              </div>

              {/* Nombre y Apellidos */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-blue-500 uppercase ml-5 tracking-widest">Nombre</p>
                  <input
                    placeholder="Nombre"
                    className="w-full bg-white/5 border border-white/10 rounded-[24px] p-6 text-xs text-white uppercase outline-none focus:border-blue-500 transition-all font-bold shadow-inner"
                    value={nuevoCliente.nombre}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-blue-500 uppercase ml-5 tracking-widest">Apellidos</p>
                  <input
                    placeholder="Apellidos"
                    className="w-full bg-white/5 border border-white/10 rounded-[24px] p-6 text-xs text-white uppercase outline-none focus:border-blue-500 transition-all font-bold shadow-inner"
                    value={nuevoCliente.apellidos}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, apellidos: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              {/* Teléfono + Email */}
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-blue-500 uppercase ml-5 tracking-widest">Móvil / Teléfono</p>
                  <input
                    placeholder="600 000 000 o 91 123 45 67"
                    className="w-full bg-white/5 border border-white/10 rounded-[24px] p-6 text-xs text-white outline-none focus:border-blue-500 transition-all font-bold shadow-inner"
                    value={nuevoCliente.telefono}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-blue-500 uppercase ml-5 tracking-widest">E-mail</p>
                  <input
                    placeholder="INFO@CLIENTE.COM"
                    className="w-full bg-white/5 border border-white/10 rounded-[24px] p-6 text-xs text-white outline-none focus:border-blue-500 transition-all font-bold shadow-inner"
                    value={nuevoCliente.email}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, email: e.target.value.toLowerCase() })}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={crearUsuarioYContinuar}
                disabled={verificando}
                className="w-full bg-blue-600 text-white font-black py-6 rounded-[32px] uppercase text-[11px] tracking-[0.3em] hover:bg-blue-500 shadow-2xl shadow-blue-900/40 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                {verificando ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                Registrar y Activar Acceso
              </button>
              <button
                onClick={() => setShowModalNuevoUsuario(false)}
                className="text-gray-600 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors py-2"
              >
                Cancelar Operación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================== ALERT MODAL ====================== */}
      <AlertModal
        isOpen={alert.isOpen}
        onClose={closeAlert}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />
    </div>
  );
}