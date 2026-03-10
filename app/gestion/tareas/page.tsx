"use client";

import { useEffect, useState, useCallback } from "react";
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
  MessageSquare,
  Car,
  Package,
  Search,
  AlertTriangle,
  CheckCircle,
  Printer,
  Calendar,
  Clock,
  ChevronRight,
  Info
} from "lucide-react";

// --- IMPORTACIONES PARA PDF ---
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- INTERFACES ORIGINALES ---
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
  articulos?: any;
}

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

export default function EmpleadoPage() {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"mantenimientos" | "presupuestos" | "stock" | "facturas">("presupuestos");

  const [presupuestos, setPresupuestos] = useState<PresupuestoPedido[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [seleccionado, setSeleccionado] = useState<any>(null);

  const [codigoBusqueda, setCodigoBusqueda] = useState("");
  const [filtroStock, setFiltroStock] = useState("");
  const [filtroFacturas, setFiltroFacturas] = useState(""); // NUEVO ESTADO
  const [lineas, setLineas] = useState<LineaPresupuesto[]>([]);
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  // ESTADOS DE FACTURACIÓN AÑADIDOS
  const [facturando, setFacturando] = useState(false);
  const [facturas, setFacturas] = useState<any[]>([]);

  const router = useRouter();

  // --- FORMATEO DE FECHA ORIGINAL ---
  const formatearFechaParaInput = (fechaRaw: string | null | undefined) => {
    if (!fechaRaw) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaRaw)) return fechaRaw;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaRaw)) {
      const [dia, mes, año] = fechaRaw.split('/');
      return `${año}-${mes}-${dia}`;
    }
    try {
      const d = new Date(fechaRaw);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split('T')[0];
    } catch (e) { return ""; }
  };

  // --- CARGA DE DATOS COMPLETA ---
  const cargarTodo = useCallback(async () => {
    setLoading(true);
    try {
      const [resPres, resArt, resFac] = await Promise.all([
        fetch("/api/presupuestos"),
        fetch("/api/articulos"),
        fetch("/api/facturas")
      ]);

      const dataPres = await resPres.json();
      setPresupuestos(Array.isArray(dataPres) ? dataPres : []);

      if (resArt.ok) {
        const dataArt = await resArt.json();
        setArticulos(Array.isArray(dataArt) ? dataArt : []);
      }

      if (resFac.ok) {
        const dataFac = await resFac.json();
        setFacturas(Array.isArray(dataFac) ? dataFac : []);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (!role || (role.toLowerCase() !== "empleado" && role.toLowerCase() !== "jefe")) {
      router.push("/login");
    } else {
      setNombreUsuario(localStorage.getItem("user_name") || "Trabajador");
      cargarTodo();
    }
  }, [router, cargarTodo]);

  // --- LÓGICA DE ACTUALIZACIÓN DE CITA ---
  const actualizarCita = async (nuevaFecha: string, nuevaHora: string) => {
    if (!seleccionado || !seleccionado.id || view !== "presupuestos") return;
    try {
      const res = await fetch(`/api/presupuestos/${seleccionado.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha_cita: nuevaFecha, hora_cita: nuevaHora })
      });
      if (!res.ok) throw new Error("Error");
      setPresupuestos(prev => prev.map(p => p.id === seleccionado.id ? { ...p, fecha_cita: nuevaFecha, hora_cita: nuevaHora } : p));
      setSeleccionado((prev: any) => ({ ...prev, fecha_cita: nuevaFecha, hora_cita: nuevaHora }));
    } catch (e) {
      console.error("Error al guardar cita", e);
    }
  };

  // --- GESTIÓN DE ARTÍCULOS E INVENTARIO ---
  const buscarYAñadirArticulo = async () => {
    const codigoLimpio = codigoBusqueda.toUpperCase().trim();
    if (!codigoLimpio) return;
    try {
      const res = await fetch(`/api/articulos/${codigoLimpio}`);
      if (res.ok) {
        const articulo: Articulo = await res.json();
        setLineas(prev => {
          const existe = prev.find(item => item.codigo === articulo.codigo);
          if (existe) return prev.map(item => item.codigo === articulo.codigo ? { ...item, cantidad: item.cantidad + 1 } : item);
          return [...prev, { ...articulo, cantidad: 1 }];
        });
        setCodigoBusqueda("");
      } else { alert("Código no encontrado en el sistema"); }
    } catch (e) { alert("Error al buscar el artículo"); }
  };

  const totalPresupuesto = lineas.reduce((acc, item) => acc + (Number(item.precio_unitario) * item.cantidad), 0);

  // --- GENERACIÓN DE PDF Y ENVÍO POR EMAIL ---
  const enviarPresupuestoPDF = async () => {
    if (!seleccionado || lineas.length === 0) return;
    setEnviandoEmail(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(22); doc.setTextColor(30, 58, 138); doc.text("AJCAR 25 - PRESUPUESTO OFICIAL", 14, 20);

      autoTable(doc, {
        startY: 60,
        head: [['Código', 'Descripción', 'Cantidad', 'P. Unitario', 'Subtotal']],
        body: lineas.map(l => [l.codigo, l.descripcion, l.cantidad, `${Number(l.precio_unitario).toFixed(2)}€`, `${(l.cantidad * Number(l.precio_unitario)).toFixed(2)}€`]),
        foot: [['', '', '', 'TOTAL PRESUPUESTO', `${totalPresupuesto.toFixed(2)}€`]],
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138] }
      });

      const pdfBase64 = doc.output('datauristring');
      const resEmail = await fetch("/api/enviar-presupuesto", {
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

      if (!resEmail.ok) throw new Error("Error en el envío del servidor");
      alert("✅ El presupuesto ha sido enviado correctamente al cliente.");
      cargarTodo();
    } catch (e) { alert("Error al procesar el envío."); } finally { setEnviandoEmail(false); }
  };

  // --- PROCESAR FACTURACIÓN FINAL ---
  const procesarFactura = async () => {
    const articulosAFacturar = view === "mantenimientos" ? seleccionado?.articulos : lineas;

    if (!seleccionado || lineas.length === 0) {
      alert("No hay artículos cargados para facturar.");
      return;
    }

    setFacturando(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(126, 34, 206);
      doc.text("AJCAR 25 - FACTURA OFICIAL", 14, 20);

      const totalCalculado = articulosAFacturar.reduce(
        (acc: number, item: any) => acc + (Number(item.precio_unitario) * item.cantidad),
        0
      );

      autoTable(doc, {
        startY: 50,
        head: [['Ref', 'Descripción', 'Cant.', 'Precio', 'Subtotal']],
        body: articulosAFacturar.map((l: any) => [
          l.codigo,
          l.descripcion,
          l.cantidad,
          `${Number(l.precio_unitario).toFixed(2)}€`,
          `${(l.cantidad * Number(l.precio_unitario)).toFixed(2)}€`
        ]),
        foot: [['', '', '', 'TOTAL FACTURA', `${totalCalculado.toFixed(2)}€`]],
        theme: 'grid',
        headStyles: { fillColor: [126, 34, 206] }
      });

      const pdfBase64 = doc.output('datauristring');

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
          pdfBase64: pdfBase64
        })
      });

      if (res.ok) {
        alert("✅ Mantenimiento finalizado, stock descontado y factura enviada al cliente.");
        cargarTodo();
        setSeleccionado(null);
        setLineas([]);
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || "No se pudo procesar"}`);
      }
    } catch (e) {
      alert("Fallo de comunicación con el servidor.");
    } finally {
      setFacturando(false);
    }
  };

  const handleLogout = () => { localStorage.clear(); router.push("/"); };

  function getEstadoColor(estado: string) {
    const e = estado?.toLowerCase() || "";
    if (e.includes('aceptado')) return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (e.includes('enviado')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (e.includes('facturado')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
  }

  // --- FILTROS ---
  const articulosFiltrados = articulos.filter(art => {
    const termino = filtroStock.toLowerCase().trim();
    return (
      art.codigo.toLowerCase().includes(termino) ||
      art.descripcion.toLowerCase().includes(termino)
    );
  });

  // NUEVA LÓGICA DE FILTRADO DE FACTURAS
  const facturasFiltradas = facturas.filter(f => {
    const termino = filtroFacturas.toLowerCase().trim();
    return (
      f.cliente_nombre.toLowerCase().includes(termino) ||
      f.numero_factura.toLowerCase().includes(termino) ||
      f.vehiculo.toLowerCase().includes(termino)
    );
  });

  if (loading) return (
    <div className="min-h-screen bg-[#0f1218] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-blue-500" size={50} />
      <p className="text-gray-500 animate-pulse font-bold tracking-widest text-xs uppercase">Cargando sistema AJCAR 25...</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0f1218] text-gray-300 font-sans selection:bg-blue-500/30">

      {/* SIDEBAR ORIGINAL EXTENDIDO */}
      <aside className="hidden md:flex w-72 bg-[#161b24] border-r border-white/5 flex-col sticky top-0 h-screen transition-all duration-300">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10 group cursor-default">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center font-black text-white italic shadow-lg shadow-blue-900/20 group-hover:scale-110 transition-transform">AJ</div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter text-white italic leading-none">AJCAR 25</span>
              <span className="text-[10px] text-blue-500 font-bold tracking-[0.2em] uppercase">Taller Pro</span>
            </div>
          </div>

          <nav className="space-y-3">
            {[
              { id: 'presupuestos', label: 'Presupuestos', icon: FileText },
              { id: 'mantenimientos', label: 'Taller / Aceptados', icon: ClipboardList },
              { id: 'stock', label: 'Control Stock', icon: Package },
              { id: 'facturas', label: 'Historial Facturas', icon: CheckCircle }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => { setView(item.id as any); setSeleccionado(null); }}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 group ${view === item.id ? 'bg-white/5 text-white border border-white/10 shadow-inner' : 'hover:bg-white/[0.03] text-gray-400'}`}
              >
                <item.icon size={20} className={view === item.id ? 'text-blue-500' : 'group-hover:text-gray-200'} />
                <span className="font-bold text-sm tracking-wide">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/5 bg-black/10">
          <div className="flex items-center gap-3 mb-6 p-3 bg-white/5 rounded-xl border border-white/5">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs uppercase">{nombreUsuario.charAt(0)}</div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-white truncate">{nombreUsuario}</span>
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Empleado Conectado</span>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-3 text-gray-500 hover:text-red-400 transition-colors w-full font-bold text-xs uppercase tracking-widest"><LogOut size={16} /> Cerrar sesión segura</button>
        </div>
      </aside>

      {/* CUERPO PRINCIPAL */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-[2px] w-8 bg-blue-600"></div>
              <h1 className="text-blue-500 uppercase text-[10px] tracking-[0.4em] font-black">Panel de Administración</h1>
            </div>
            <p className="text-white text-4xl font-black uppercase tracking-tighter">{view}</p>
          </div>

          <div className="flex gap-4">
            <div className="bg-[#161b24] px-5 py-3 rounded-2xl border border-white/10 flex flex-col items-end">
              <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Fecha de Hoy</span>
              <span className="text-xs text-white font-mono">{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* SECCIÓN DE TABLAS (CENTRO) */}
          <div className="lg:col-span-2 space-y-6">

            {view === "stock" ? (
              <div className="space-y-6">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                  <input
                    type="text"
                    placeholder="Escribe código o descripción para buscar en el almacén..."
                    className="w-full bg-[#161b24] border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all"
                    value={filtroStock}
                    onChange={(e) => setFiltroStock(e.target.value)}
                  />
                </div>

                <div className="bg-[#161b24] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-black/40 text-gray-500 uppercase text-[10px] tracking-[0.2em] font-black">
                      <tr>
                        <th className="p-5">Referencia</th>
                        <th className="p-5">Descripción Pieza</th>
                        <th className="p-5 text-center">En Almacén</th>
                        <th className="p-5 text-center">Reservado</th>
                        <th className="p-5 text-center">Disponible</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {articulosFiltrados.map((art) => (
                        <tr key={art.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="p-5 font-mono text-blue-400 font-bold group-hover:text-blue-300 transition-colors">{art.codigo}</td>
                          <td className="p-5 text-white font-medium">{art.descripcion}</td>
                          <td className="p-5 text-center font-mono">{art.stock}</td>
                          <td className="p-5 text-center text-orange-400 font-mono bg-orange-500/5">{art.stock_reservado || 0}</td>
                          <td className="p-5 text-center">
                            <span className={`px-4 py-1.5 rounded-xl font-black text-[11px] uppercase ${art.stock - art.stock_reservado <= 3 ? 'text-red-500 bg-red-500/10' : 'text-green-400 bg-green-400/10'}`}>
                              {art.stock - art.stock_reservado} uds.
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : view === "facturas" ? (
              <div className="space-y-6">
                {/* BUSCADOR DE FACTURAS - MISMA ESTÉTICA QUE STOCK */}
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-500 transition-colors" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar por cliente, Nº factura o vehículo..."
                    className="w-full bg-[#161b24] border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/5 transition-all"
                    value={filtroFacturas}
                    onChange={(e) => setFiltroFacturas(e.target.value)}
                  />
                </div>

                <div className="bg-[#161b24] rounded-3xl border border-white/5 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-black/40 text-gray-500 uppercase text-[10px] tracking-[0.2em] font-black">
                      <tr>
                        <th className="p-5">Nº Factura</th>
                        <th className="p-5">Cliente</th>
                        <th className="p-5">Vehículo</th>
                        <th className="p-5">Fecha Emisión</th>
                        <th className="p-5 text-right">Importe Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {facturasFiltradas.map((f) => (
                        <tr key={f.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="p-5 font-mono text-purple-400 font-bold uppercase">{f.numero_factura}</td>
                          <td className="p-5 text-white font-bold">{f.cliente_nombre}</td>
                          <td className="p-5 text-xs text-gray-400 uppercase font-medium">{f.vehiculo}</td>
                          <td className="p-5 text-gray-500">{new Date(f.fecha_emision).toLocaleDateString()}</td>
                          <td className="p-5 text-right font-black text-green-400 text-base">{f.total}€</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-[#161b24] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/40 text-gray-500 uppercase text-[10px] tracking-[0.2em] font-black">
                    <tr>
                      <th className="p-5">{view === 'presupuestos' ? 'Cliente Solicitante' : 'Entrada Taller / Vehículo'}</th>
                      <th className="p-5 text-center">Cita Programada</th>
                      <th className="p-5 text-right">Estado Gestión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {presupuestos
                      .filter(p => view === "presupuestos" ? p.estado !== "Aceptado por el cliente" : p.estado === "Aceptado por el cliente")
                      .map((p) => (
                        <tr
                          key={p.id}
                          onClick={() => {
                            setSeleccionado(p);
                            setLineas(p.articulos || []);
                          }}
                          className={`hover:bg-white/[0.03] transition-all cursor-pointer group ${seleccionado?.id === p.id ? 'bg-blue-600/10' : ''}`}
                        >
                          <td className="p-5 relative">
                            {seleccionado?.id === p.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>}
                            <div className="text-white font-bold text-base group-hover:translate-x-1 transition-transform">{p.nombre}</div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-1.5 uppercase font-bold tracking-widest mt-1">
                              <Car size={12} className="text-blue-500/50" /> {p.vehiculo}
                            </div>
                          </td>
                          <td className="p-5 text-center font-mono text-gray-400">
                            <div className="flex flex-col">
                              <span className="text-xs text-white">{p.fecha_cita}</span>
                              <span className="text-[10px] font-bold text-gray-600">{p.hora_cita}</span>
                            </div>
                          </td>
                          <td className="p-5 text-right">
                            <span className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-tighter ${getEstadoColor(p.estado)}`}>
                              {p.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ASIDE DE ACCIÓN (DERECHA) */}
          <aside className="space-y-6">
            <div className="bg-gradient-to-b from-[#1c222d] to-[#161b24] p-8 rounded-3xl border border-white/10 shadow-2xl sticky top-10 min-h-[600px] flex flex-col">
              {seleccionado ? (
                <div className="space-y-8 flex-1 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex justify-between items-start border-b border-white/5 pb-6">
                    <div>
                      <h3 className="text-blue-500 font-black text-[10px] uppercase tracking-[0.3em] mb-2">Expediente Seleccionado</h3>
                      <p className="text-white text-2xl font-black leading-tight">{seleccionado.nombre}</p>
                      <p className="flex items-center gap-2 text-xs font-bold text-gray-400 mt-2 uppercase tracking-widest">
                        <Car size={14} className="text-blue-600" /> {seleccionado.vehiculo} <span className="text-gray-600">•</span> {seleccionado.anio}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-gray-500">
                      <MessageSquare size={14} className="text-blue-500" /> Nota del Cliente
                    </div>
                    <div className="bg-black/30 border border-white/5 p-5 rounded-2xl">
                      <p className="text-sm text-gray-300 italic leading-relaxed font-medium">"{seleccionado.mensaje}"</p>
                    </div>
                  </div>

                  {view === "presupuestos" ? (
                    <div className="space-y-6 flex flex-col h-full">
                      <div className="pt-4 border-t border-white/5 space-y-4">
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Ajustar Cita Taller</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <label className="text-[9px] text-gray-600 font-bold uppercase ml-1">Día</label>
                            <input type="date" value={formatearFechaParaInput(seleccionado.fecha_cita)} onChange={(e) => actualizarCita(e.target.value, seleccionado.hora_cita)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-xs text-white focus:border-blue-500 transition-colors outline-none" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] text-gray-600 font-bold uppercase ml-1">Hora</label>
                            <input type="time" value={seleccionado.hora_cita || ""} onChange={(e) => actualizarCita(seleccionado.fecha_cita, e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-xs text-white focus:border-blue-500 transition-colors outline-none" />
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-white/5 space-y-5">
                        <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex justify-between">
                          <span>Piezas y Recambios</span>
                          <span className="text-blue-500">Total: {totalPresupuesto.toFixed(2)}€</span>
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={codigoBusqueda}
                            onChange={(e) => setCodigoBusqueda(e.target.value)}
                            placeholder="Introduce Código de Pieza"
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500 transition-all font-mono"
                          />
                          <button onClick={buscarYAñadirArticulo} className="bg-blue-600 hover:bg-blue-500 p-3 rounded-xl text-white shadow-lg shadow-blue-900/40 transition-all active:scale-95">
                            <Plus size={20} />
                          </button>
                        </div>

                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          {lineas.map((item, idx) => (
                            <div key={idx} className="bg-white/5 border border-white/5 p-3 rounded-xl flex justify-between items-center text-[11px] group">
                              <div className="flex flex-col">
                                <span className="text-white font-bold">{item.descripcion}</span>
                                <span className="text-gray-500 font-mono text-[9px] uppercase tracking-tighter">{item.codigo} (x{item.cantidad})</span>
                              </div>
                              <button onClick={() => setLineas(lineas.filter((_, i) => i !== idx))} className="text-red-500/30 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-lg transition-all">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        </div>

                        {lineas.length > 0 && (
                          <button
                            onClick={enviarPresupuestoPDF}
                            disabled={enviandoEmail}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 text-xs uppercase tracking-widest shadow-xl shadow-green-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                          >
                            {enviandoEmail ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            Enviar Presupuesto Oficial
                          </button>
                        )}
                      </div>
                    </div>
                  ) : view === "mantenimientos" ? (
                    <div className="space-y-8 h-full flex flex-col">
                      <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2 text-blue-400 font-black text-[10px] uppercase tracking-widest mb-2">
                          <Info size={14} /> Resumen de Intervención
                        </div>
                        {seleccionado.articulos?.map((art: any, i: number) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                            <div className="flex flex-col">
                              <span className="text-white text-xs font-bold">{art.descripcion}</span>
                              <span className="text-[9px] text-gray-500 uppercase font-mono">Cant: {art.cantidad} x {art.precio_unitario}€</span>
                            </div>
                            <span className="text-white font-mono text-sm">{(art.cantidad * art.precio_unitario).toFixed(2)}€</span>
                          </div>
                        ))}
                        <div className="pt-4 flex justify-between items-end">
                          <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Base Imponible</span>
                          <span className="text-xl text-white font-black">{seleccionado.articulos?.reduce((a: any, b: any) => a + (b.precio_unitario * b.cantidad), 0).toFixed(2)}€</span>
                        </div>
                      </div>

                      <div className="mt-auto space-y-4">
                        <button
                          onClick={procesarFactura}
                          disabled={facturando}
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {facturando ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
                          Finalizar y Generar Factura
                        </button>
                        <p className="text-[10px] text-center text-gray-600 font-bold uppercase tracking-widest">La factura se enviará al email del cliente automáticamente</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-500 border border-white/5">
                        <CheckCircle size={30} />
                      </div>
                      <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.3em]">Consulta terminada</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-gray-700 space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
                    <Search size={60} className="relative text-gray-800" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-600">Gestor AJCAR 25</p>
                    <p className="text-[10px] text-gray-700 font-medium max-w-[200px] leading-relaxed">Seleccione un presupuesto o mantenimiento para operar en el sistema</p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}