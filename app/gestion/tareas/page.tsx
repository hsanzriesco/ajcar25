"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  LogOut,
  User,
  FileText,
  Mail,
  Phone,
  Plus,
  Trash2,
  Send,
  Loader2,
  Car,
  Package,
  Search,
  CheckCircle,
  Printer,
  Calendar,
  ChevronRight,
  MessageSquare,
  Wrench,
  Clock,
  AlertCircle,
  RefreshCw,
  ArrowRightCircle
} from "lucide-react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- INTERFACES Y TIPOS ---
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
}

export default function EmpleadoPage() {
  // --- ESTADOS DE USUARIO Y NAVEGACIÓN ---
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"presupuestos" | "aceptados" | "mantenimientos" | "stock" | "facturas">("presupuestos");

  // --- ESTADOS de DATOS ---
  const [presupuestos, setPresupuestos] = useState<PresupuestoPedido[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [seleccionado, setSeleccionado] = useState<PresupuestoPedido | null>(null);
  const [facturas, setFacturas] = useState<any[]>([]);

  // --- ESTADOS DE FORMULARIO Y BUSQUEDA ---
  const [codigoBusqueda, setCodigoBusqueda] = useState("");
  const [filtroStock, setFiltroStock] = useState("");
  const [lineas, setLineas] = useState<LineaPresupuesto[]>([]);
  
  // --- ESTADOS DE CARGA (SPINNERS) ---
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [facturando, setFacturando] = useState(false);
  const [notificandoCita, setNotificandoCita] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const router = useRouter();

  // --- UTILIDADES DE FORMATO ---
  const formatearFechaParaInput = (fechaRaw: string | null | undefined) => {
    if (!fechaRaw) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaRaw)) return fechaRaw;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaRaw)) {
      const [dia, mes, año] = fechaRaw.split('/');
      return `${año}-${mes}-${dia}`;
    }
    return "";
  };

  const formatearFechaVisual = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // --- FUNCIONES DE CARGA DE DATOS ---
  const cargarTodo = useCallback(async () => {
    setLoading(true);
    console.log("Iniciando sincronización de datos AJCAR 25...");
    try {
      const [resPres, resArt, resFac] = await Promise.all([
        fetch("/api/presupuestos"),
        fetch("/api/articulos"),
        fetch("/api/facturas")
      ]);

      if (resPres.ok) {
        const data = await resPres.json();
        setPresupuestos(data);
      }
      if (resArt.ok) {
        const data = await resArt.json();
        setArticulos(data);
      }
      if (resFac.ok) {
        const data = await resFac.json();
        setFacturas(data);
      }
    } catch (error) {
      console.error("Error crítico en la carga de datos:", error);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    const name = localStorage.getItem("user_name");
    
    if (!role || role !== "empleado") {
      router.push("/login");
    } else {
      setNombreUsuario(name || "Trabajador AJCAR");
      cargarTodo();
    }
  }, [router, cargarTodo]);

  // --- LÓGICA DE INVENTARIO Y LÍNEAS ---
  const buscarYAñadirArticulo = async () => {
    const cod = codigoBusqueda.toUpperCase().trim();
    if (!cod) return;

    try {
      console.log(`Buscando referencia: ${cod}`);
      const res = await fetch(`/api/articulos/${cod}`);
      
      if (res.ok) {
        const art: Articulo = await res.json();
        
        if (art.stock <= 0) {
          alert("Advertencia: No hay stock disponible de este artículo.");
        }

        setLineas(prev => {
          const existe = prev.find(item => item.codigo === art.codigo);
          if (existe) {
            return prev.map(item =>
              item.codigo === art.codigo ? { ...item, cantidad: item.cantidad + 1 } : item
            );
          }
          return [...prev, { ...art, cantidad: 1 }];
        });
        setCodigoBusqueda("");
      } else {
        alert("Referencia no encontrada en el almacén.");
      }
    } catch (e) {
      console.error("Error en búsqueda de artículos:", e);
    }
  };

  const eliminarLinea = (index: number) => {
    const nuevasLineas = [...lineas];
    nuevasLineas.splice(index, 1);
    setLineas(nuevasLineas);
  };

  const totalPresupuesto = useMemo(() => {
    return lineas.reduce((acc, item) => acc + (Number(item.precio_unitario) * item.cantidad), 0);
  }, [lineas]);

  // --- GESTIÓN DE CITAS Y ESTADOS ---
  const actualizarCitaYNotificar = async (nuevaFecha: string, nuevaHora: string) => {
    if (!seleccionado) return;
    setNotificandoCita(true);
    
    try {
      const res = await fetch(`/api/presupuestos/${seleccionado.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha_cita: nuevaFecha, hora_cita: nuevaHora })
      });

      if (res.ok) {
        // Enviar notificación al cliente por el cambio
        await fetch("/api/enviar-notificacion-cita", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: seleccionado.email,
            nombre: seleccionado.nombre,
            vehiculo: seleccionado.vehiculo,
            nuevaFecha,
            nuevaHora
          })
        });

        setPresupuestos(prev => prev.map(p =>
          p.id === seleccionado.id ? { ...p, fecha_cita: nuevaFecha, hora_cita: nuevaHora } : p
        ));
        setSeleccionado({ ...seleccionado, fecha_cita: nuevaFecha, hora_cita: nuevaHora });
        console.log("Cita actualizada y cliente notificado.");
      }
    } catch (error) {
      console.error("Error actualizando la cita:", error);
    } finally {
      setNotificandoCita(false);
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
        console.log(`Estado actualizado a ${nuevoEstado}`);
      }
    } catch (e) {
      alert("Error en el cambio de estado.");
    } finally {
      setCambiandoEstado(false);
    }
  };

  // --- GENERACIÓN DE DOCUMENTOS (PDF) ---
  const enviarPresupuestoPDF = async () => {
    if (!seleccionado || lineas.length === 0) {
      alert("Debes añadir artículos al presupuesto antes de enviar.");
      return;
    }
    setEnviandoEmail(true);

    try {
      const doc = new jsPDF();
      
      // Estilo de encabezado
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("AJCAR 25 - PRESUPUESTO", 14, 25);
      
      doc.setFontSize(10);
      doc.setTextColor(50);
      doc.text(`CLIENTE: ${seleccionado.nombre.toUpperCase()}`, 14, 50);
      doc.text(`VEHÍCULO: ${seleccionado.vehiculo}`, 14, 56);
      doc.text(`CONTACTO: ${seleccionado.telefono} | ${seleccionado.email}`, 14, 62);
      doc.text(`FECHA EMISIÓN: ${new Date().toLocaleDateString()}`, 14, 68);

      autoTable(doc, {
        startY: 75,
        head: [['Ref. Artículo', 'Descripción Detallada', 'Cantidad', 'Precio Unit.', 'Subtotal']],
        body: lineas.map(l => [
          l.codigo,
          l.descripcion,
          l.cantidad,
          `${Number(l.precio_unitario).toFixed(2)}€`,
          `${(l.cantidad * Number(l.precio_unitario)).toFixed(2)}€`
        ]),
        foot: [['', '', '', 'TOTAL PRESUPUESTADO', `${totalPresupuesto.toFixed(2)}€`]],
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 4 }
      });

      const pdfBase64 = doc.output('datauristring');

      const res = await fetch("/api/enviar-presupuesto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: seleccionado.id,
          email: seleccionado.email,
          nombre: seleccionado.nombre,
          vehiculo: seleccionado.vehiculo,
          total: totalPresupuesto.toFixed(2),
          pdfBase64,
          articulos: lineas
        })
      });

      if (res.ok) {
        alert("Presupuesto enviado correctamente al cliente.");
        await cargarTodo();
        setSeleccionado(null);
        setLineas([]);
      }
    } catch (error) {
      alert("Error al generar o enviar el PDF.");
    } finally {
      setEnviandoEmail(false);
    }
  };

  const procesarFactura = async () => {
    const articulosAFacturar = (view === "mantenimientos" || view === "aceptados") 
      ? seleccionado?.articulos 
      : lineas;

    if (!seleccionado || !articulosAFacturar || articulosAFacturar.length === 0) {
      alert("Error: Faltan artículos para generar la factura.");
      return;
    }

    setFacturando(true);
    try {
      const doc = new jsPDF();
      doc.setFillColor(126, 34, 206);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("AJCAR 25 - FACTURA OFICIAL", 14, 25);

      doc.setFontSize(10);
      doc.setTextColor(50);
      doc.text(`DATOS CLIENTE: ${seleccionado.nombre}`, 14, 50);
      doc.text(`VEHÍCULO: ${seleccionado.vehiculo}`, 14, 55);
      doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 14, 60);

      const totalCalculado = articulosAFacturar.reduce(
        (acc: number, item: any) => acc + (Number(item.precio_unitario) * item.cantidad), 0
      );

      autoTable(doc, {
        startY: 70,
        head: [['Ref', 'Descripción', 'Cant.', 'Precio', 'Subtotal']],
        body: articulosAFacturar.map((l: any) => [
          l.codigo, l.descripcion, l.cantidad, 
          `${Number(l.precio_unitario).toFixed(2)}€`, 
          `${(l.cantidad * Number(l.precio_unitario)).toFixed(2)}€`
        ]),
        foot: [['', '', '', 'TOTAL FACTURA', `${totalCalculado.toFixed(2)}€`]],
        theme: 'grid',
        headStyles: { fillColor: [126, 34, 206] }
      });

      const res = await fetch("/api/facturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presupuesto_id: seleccionado.id,
          cliente_nombre: seleccionado.nombre,
          email: seleccionado.email,
          vehiculo: seleccionado.vehiculo,
          total: totalCalculado,
          articulos: articulosAFacturar,
          pdfBase64: doc.output('datauristring')
        })
      });

      if (res.ok) {
        alert("Factura generada y archivada.");
        await cargarTodo();
        setSeleccionado(null);
      }
    } catch (e) {
      alert("Error crítico al facturar.");
    } finally {
      setFacturando(false);
    }
  };

  const verPDFFactura = (f: any) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`REGISTRO DE FACTURA: ${f.numero_factura}`, 14, 20);
      
      const arts = typeof f.articulos === 'string' ? JSON.parse(f.articulos) : f.articulos;

      autoTable(doc, {
        startY: 35,
        head: [['Referencia', 'Descripción', 'Unidades', 'Importe']],
        body: arts.map((l: any) => [
          l.codigo, l.descripcion, l.cantidad, `${(l.cantidad * l.precio_unitario).toFixed(2)}€`
        ]),
        foot: [['', '', 'TOTAL', `${Number(f.total).toFixed(2)}€`]]
      });

      window.open(URL.createObjectURL(doc.output('blob')), '_blank');
    } catch (e) {
      alert("No se pudo previsualizar el documento.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  // --- RENDERIZADO PRINCIPAL ---
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-gray-400 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <main className="w-full flex flex-col min-h-screen">
        <div className="p-8 lg:p-16 max-w-[1600px] w-full mx-auto">
          
          {/* HEADER SECCION */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-white/5 pb-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center text-white font-black italic shadow-2xl shadow-blue-900/40 text-xl">AJ</div>
                 <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] leading-none mb-1">{nombreUsuario}</p>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest">Sistema de Gestión Taller v2.1</p>
                    </div>
                 </div>
              </div>
              <h1 className="text-white text-6xl lg:text-8xl font-black italic tracking-tighter uppercase leading-[0.8]">
                {view === 'presupuestos' && "Presupuestos"}
                {view === 'aceptados' && "Aceptados"}
                {view === 'mantenimientos' && "En Taller"}
                {view === 'stock' && "Almacén"}
                {view === 'facturas' && "Facturas"}
              </h1>
            </div>

            <nav className="flex items-center gap-3 bg-white/5 p-3 rounded-3xl border border-white/10 backdrop-blur-xl">
                {[
                  { id: 'presupuestos', label: 'Pendientes', icon: ClipboardList },
                  { id: 'aceptados', label: 'Aceptados', icon: CheckCircle },
                  { id: 'mantenimientos', label: 'Taller', icon: Wrench },
                  { id: 'stock', label: 'Stock', icon: Package },
                  { id: 'facturas', label: 'Facturas', icon: FileText }
                ].map((v) => (
                    <button 
                        key={v.id}
                        onClick={() => { setView(v.id as any); setSeleccionado(null); }}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === v.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 scale-105' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                    >
                        <v.icon size={14} />
                        {v.label}
                    </button>
                ))}
                <div className="w-px h-6 bg-white/10 mx-2" />
                <button onClick={handleLogout} className="p-3 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all active:scale-95">
                    <LogOut size={20} />
                </button>
            </nav>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* PANEL IZQUIERDO: LISTADOS */}
            <div className="lg:col-span-7 space-y-8">
              {loading ? (
                <div className="h-[500px] flex flex-col items-center justify-center space-y-8 bg-[#0f0f12] rounded-[50px] border border-white/5 shadow-inner">
                  <div className="relative">
                    <Loader2 className="animate-spin text-blue-600" size={64} />
                    <div className="absolute inset-0 blur-2xl bg-blue-600/20 rounded-full" />
                  </div>
                  <p className="text-[11px] font-black uppercase tracking-[0.5em] text-gray-600 animate-pulse">Cargando base de datos...</p>
                </div>
              ) : view === "stock" ? (
                <section className="bg-[#0f0f12] rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
                  <div className="p-10 border-b border-white/5 flex flex-col md:flex-row gap-6 bg-black/20">
                    <div className="flex-1 bg-white/5 rounded-2xl flex items-center px-6 border border-white/5 focus-within:border-blue-500/50 transition-all">
                      <Search size={18} className="text-gray-600 mr-4" />
                      <input 
                        type="text" 
                        value={filtroStock} 
                        onChange={(e) => setFiltroStock(e.target.value)} 
                        placeholder="Buscar por referencia o nombre..." 
                        className="bg-transparent border-none focus:ring-0 text-xs text-white w-full py-5 h-full uppercase font-bold" 
                      />
                    </div>
                    <button onClick={cargarTodo} className="p-5 bg-white/5 rounded-2xl text-gray-400 hover:text-white hover:bg-white/10 transition-all">
                      <RefreshCw size={20} />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-black/40 text-[10px] font-black uppercase tracking-widest text-gray-500">
                        <tr>
                          <th className="p-8">Referencia</th>
                          <th className="p-8">Descripción Artículo</th>
                          <th className="p-8 text-center">En Stock</th>
                          <th className="p-8 text-right">Precio Unit.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {articulos.filter(a => a.codigo.includes(filtroStock.toUpperCase()) || a.descripcion.toLowerCase().includes(filtroStock.toLowerCase())).map(art => (
                          <tr key={art.id} className="hover:bg-blue-600/[0.03] transition-colors group">
                            <td className="p-8 font-mono text-blue-400 font-bold tracking-tighter text-base">{art.codigo}</td>
                            <td className="p-8 text-gray-300 font-bold uppercase text-xs">{art.descripcion}</td>
                            <td className="p-8 text-center">
                              <span className={`px-4 py-2 rounded-xl font-black text-xs ${art.stock > 5 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {art.stock} uds
                              </span>
                            </td>
                            <td className="p-8 text-right font-black text-white italic">{art.precio_unitario}€</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : view === "facturas" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {facturas.map(f => (
                    <div key={f.id} className="bg-[#0f0f12] border border-white/5 p-10 rounded-[40px] hover:border-blue-500/30 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <FileText size={80} className="text-white" />
                      </div>
                      <div className="flex justify-between items-start mb-8">
                        <div className="p-4 bg-purple-500/10 text-purple-500 rounded-2xl"><CheckCircle size={24} /></div>
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{f.numero_factura}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-black uppercase mb-2 tracking-widest">{f.vehiculo}</p>
                      <h3 className="text-white font-black italic uppercase text-2xl mb-6 leading-none">{f.cliente_nombre}</h3>
                      <div className="flex justify-between items-end pt-8 border-t border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-gray-600 uppercase mb-1">Importe Final</span>
                          <span className="text-3xl font-black text-green-500 italic leading-none">{f.total}€</span>
                        </div>
                        <button onClick={() => verPDFFactura(f)} className="p-4 bg-white/5 hover:bg-white text-white hover:text-black rounded-2xl transition-all shadow-xl">
                          <Printer size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {presupuestos
                    .filter(p => {
                      if (view === "presupuestos") return p.estado === "Pendiente" || p.estado === "Enviado";
                      if (view === "aceptados") return p.estado === "Aceptado por el cliente";
                      if (view === "mantenimientos") return p.estado === "En Taller";
                      return true;
                    })
                    .map(p => (
                      <div
                        key={p.id}
                        onClick={() => { setSeleccionado(p); setLineas(p.articulos || []); }}
                        className={`group relative p-10 rounded-[50px] border transition-all duration-700 cursor-pointer overflow-hidden ${seleccionado?.id === p.id ? 'bg-blue-600 border-blue-400 shadow-[0_30px_60px_-15px_rgba(37,99,235,0.4)] translate-y-[-8px]' : 'bg-[#0f0f12] border-white/5 hover:border-white/20 hover:translate-y-[-4px]'}`}
                      >
                        <div className="relative z-10 flex flex-col h-full justify-between gap-12">
                          <div className="flex justify-between items-start">
                            <div className={`p-5 rounded-[24px] transition-all duration-500 ${seleccionado?.id === p.id ? 'bg-white/20 text-white rotate-12' : 'bg-blue-600/10 text-blue-500'}`}>
                              <Car size={32} />
                            </div>
                            <div className={`text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full backdrop-blur-md ${seleccionado?.id === p.id ? 'bg-black/20 text-white' : 'bg-white/5 text-gray-500'}`}>
                              {p.estado}
                            </div>
                          </div>
                          <div>
                            <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-3 ${seleccionado?.id === p.id ? 'text-blue-100/60' : 'text-gray-500'}`}>{p.vehiculo} • {p.anio}</p>
                            <h3 className={`text-3xl lg:text-4xl font-black italic tracking-tighter uppercase leading-[0.9] ${seleccionado?.id === p.id ? 'text-white' : 'text-gray-200'}`}>{p.nombre}</h3>
                            <div className={`mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-opacity ${seleccionado?.id === p.id ? 'opacity-100' : 'opacity-0'}`}>
                              Gestionar Expediente <ChevronRight size={14} />
                            </div>
                          </div>
                        </div>
                        {/* Decoración de fondo */}
                        <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-[80px] transition-colors ${seleccionado?.id === p.id ? 'bg-white/20' : 'bg-blue-600/5'}`} />
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* PANEL DERECHO: DETALLES Y ACCIONES */}
            <aside className="lg:col-span-5 sticky top-8">
              <div className="bg-[#0f0f12] rounded-[60px] border border-white/5 overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col">
                {seleccionado ? (
                  <div className="flex flex-col p-10 lg:p-14 space-y-10">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="text-[11px] font-black uppercase tracking-[0.5em] text-blue-500">Expediente Activo</span>
                      </div>
                      <button onClick={() => setSeleccionado(null)} className="p-3 hover:bg-white/5 rounded-2xl transition-all text-gray-600 hover:text-white"><Plus className="rotate-45" size={28} /></button>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-4xl lg:text-5xl font-black italic uppercase text-white leading-none tracking-tighter">{seleccionado.nombre}</h3>
                      <div className="flex flex-wrap gap-6 border-b border-white/5 pb-8">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Email de contacto</span>
                          <span className="text-xs text-gray-300 font-bold flex items-center gap-2"><Mail size={14} className="text-blue-500"/>{seleccionado.email}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Teléfono</span>
                          <span className="text-xs text-gray-300 font-bold flex items-center gap-2"><Phone size={14} className="text-blue-500"/>{seleccionado.telefono}</span>
                        </div>
                      </div>
                    </div>

                    {/* MENSAJE TÉCNICO */}
                    <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 p-8 rounded-[40px] relative group">
                      <MessageSquare className="absolute top-6 right-8 text-amber-500/20 group-hover:scale-110 transition-transform" size={32} />
                      <p className="text-[10px] font-black uppercase text-amber-500 mb-3 tracking-[0.2em]">Nota del Cliente / Avería:</p>
                      <p className="text-base text-amber-100/80 italic font-medium leading-relaxed">
                        "{seleccionado.mensaje || "El cliente no ha especificado detalles adicionales sobre la avería."}"
                      </p>
                    </div>

                    {/* GESTIÓN DE CITA */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5 focus-within:border-blue-500/50 transition-all relative">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Fecha Cita</p>
                          <Calendar size={14} className="text-gray-600" />
                        </div>
                        <input 
                          type="date" 
                          value={formatearFechaParaInput(seleccionado.fecha_cita)} 
                          onChange={(e) => actualizarCitaYNotificar(e.target.value, seleccionado.hora_cita)} 
                          className="bg-transparent border-none p-0 text-white text-sm font-black w-full outline-none focus:ring-0" 
                        />
                        {notificandoCita && (
                          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                            <Loader2 className="animate-spin text-blue-500" size={20} />
                          </div>
                        )}
                      </div>
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5 focus-within:border-blue-500/50 transition-all">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Hora</p>
                          <Clock size={14} className="text-gray-600" />
                        </div>
                        <input 
                          type="time" 
                          value={seleccionado.hora_cita} 
                          onChange={(e) => actualizarCitaYNotificar(seleccionado.fecha_cita, e.target.value)} 
                          className="bg-transparent border-none p-0 text-white text-sm font-black w-full outline-none focus:ring-0" 
                        />
                      </div>
                    </div>

                    {/* BLOQUES DINÁMICOS POR VISTA */}
                    {view === "aceptados" && (
                      <div className="space-y-4 pt-4">
                        <div className="bg-green-500/5 border border-green-500/10 p-6 rounded-3xl mb-4">
                          <p className="text-[10px] text-green-500 font-black uppercase mb-1">Estatus</p>
                          <p className="text-xs text-green-200/60 uppercase font-bold">El cliente ha dado el visto bueno. Listo para entrar a taller.</p>
                        </div>
                        <button 
                          onClick={() => cambiarEstado(seleccionado.id, "En Taller")} 
                          disabled={cambiandoEstado}
                          className="w-full bg-blue-600 text-white py-6 rounded-[30px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-blue-500 shadow-2xl shadow-blue-900/40 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {cambiandoEstado ? <Loader2 className="animate-spin" /> : <Wrench size={20}/>} Registrar Entrada Taller
                        </button>
                      </div>
                    )}

                    {view === "mantenimientos" && (
                      <div className="space-y-8 pt-4">
                        <div className="space-y-4 border-t border-white/5 pt-8">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black uppercase text-gray-600 tracking-[0.3em]">Resumen de Trabajo:</p>
                            <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-lg">EN CURSO</span>
                          </div>
                          <div className="space-y-3 max-h-60 overflow-y-auto pr-4 custom-scrollbar">
                            {seleccionado.articulos?.map((a, i) => (
                              <div key={i} className="flex justify-between items-center text-xs py-3 border-b border-white/[0.03]">
                                <div className="flex flex-col">
                                  <span className="text-gray-300 font-black uppercase">{a.descripcion}</span>
                                  <span className="text-[9px] text-gray-600 font-bold">REF: {a.codigo}</span>
                                </div>
                                <div className="text-right">
                                  <p className="text-white font-black">{ (a.cantidad * a.precio_unitario).toFixed(2) }€</p>
                                  <p className="text-[9px] text-gray-500 font-bold">CANT: {a.cantidad}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <button 
                          onClick={procesarFactura} 
                          disabled={facturando} 
                          className="w-full bg-white text-black py-6 rounded-[30px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-gray-200 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
                        >
                          {facturando ? <Loader2 className="animate-spin" /> : <Printer size={20}/>} Finalizar y Generar Factura
                        </button>
                      </div>
                    )}

                    {view === "presupuestos" && (
                      <div className="space-y-8 pt-4">
                        <div className="space-y-4">
                          <p className="text-[10px] font-black uppercase text-gray-600 tracking-[0.3em]">Añadir Repuestos / Mano de Obra:</p>
                          <div className="flex gap-3">
                            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 flex items-center focus-within:border-blue-500/50 transition-all">
                              <Package size={16} className="text-gray-600 mr-3" />
                              <input 
                                value={codigoBusqueda} 
                                onChange={(e) => setCodigoBusqueda(e.target.value)} 
                                onKeyDown={(e) => e.key === 'Enter' && buscarYAñadirArticulo()} 
                                placeholder="Escanear o escribir código..." 
                                className="bg-transparent border-none text-xs text-white uppercase outline-none w-full py-4 font-bold" 
                              />
                            </div>
                            <button onClick={buscarYAñadirArticulo} className="bg-blue-600 p-4 rounded-2xl text-white hover:bg-blue-500 shadow-lg transition-all active:scale-90"><Plus size={24}/></button>
                          </div>
                        </div>

                        <div className="space-y-3 max-h-56 overflow-y-auto custom-scrollbar pr-4">
                          {lineas.length === 0 ? (
                            <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-[30px]">
                              <p className="text-[10px] font-black uppercase text-gray-700 tracking-widest">No hay artículos añadidos</p>
                            </div>
                          ) : (
                            lineas.map((l, i) => (
                              <div key={i} className="flex justify-between items-center bg-white/[0.03] p-5 rounded-3xl border border-white/5 group hover:border-blue-500/20 transition-all">
                                <div className="flex flex-col">
                                  <span className="text-[11px] text-gray-200 font-black uppercase">{l.descripcion}</span>
                                  <span className="text-[9px] text-gray-600 font-bold tracking-tighter">CANTIDAD: {l.cantidad} • {l.precio_unitario}€/ud</span>
                                </div>
                                <button onClick={() => eliminarLinea(i)} className="p-2 text-gray-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="p-8 bg-blue-600 rounded-[40px] flex flex-col gap-6 shadow-[0_20px_40px_-10px_rgba(37,99,235,0.5)]">
                          <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Total Estimado (IVA Inc.)</span>
                              <span className="text-5xl font-black italic text-white leading-none tracking-tighter">{totalPresupuesto.toFixed(2)}€</span>
                            </div>
                            <div className="bg-white/10 p-3 rounded-2xl text-white backdrop-blur-md">
                              <FileText size={24} />
                            </div>
                          </div>
                          <button 
                            onClick={enviarPresupuestoPDF} 
                            disabled={enviandoEmail || lineas.length === 0} 
                            className="w-full bg-white text-blue-600 py-5 rounded-[24px] text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-gray-100 disabled:opacity-50 transition-all shadow-xl active:scale-[0.98]"
                          >
                            {enviandoEmail ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>} Enviar Presupuesto al Cliente
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-60 text-center space-y-8 px-10">
                    <div className="relative">
                      <div className="w-24 h-24 bg-white/5 rounded-[35px] flex items-center justify-center rotate-12 animate-pulse">
                        <Search size={40} className="text-gray-800 -rotate-12" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full blur-md animate-ping" />
                    </div>
                    <div>
                      <h4 className="text-white font-black uppercase text-xs tracking-[0.4em] mb-3">Selector de Expediente</h4>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-700 leading-relaxed max-w-[200px]">
                        Selecciona un vehículo del listado lateral para comenzar la gestión técnica
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Footer del panel derecho */}
                <div className="mt-auto p-10 border-t border-white/5 bg-black/20">
                   <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-gray-600">
                      <span>AJCAR 25 Cloud</span>
                      <span>{new Date().getFullYear()} © Todos los derechos</span>
                   </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* ESTILOS GLOBALES CUSTOM */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(37, 99, 235, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(37, 99, 235, 0.5);
        }
      `}</style>
    </div>
  );
}