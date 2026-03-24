"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Mail,
  Phone,
  Plus,
  Trash2,
  Send,
  Loader2,
  Car,
  Search,
  CheckCircle,
  Printer,
  MessageSquare,
  Wrench,
  X,
  FilePlus2,
  UserPlus
} from "lucide-react";

import jsPDF from "jspdf"; 
import autoTable from "jspdf-autotable";

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
}

export default function EmpleadoPage() {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"mantenimientos" | "presupuestos" | "aceptados" | "stock" | "facturas">("presupuestos");

  const [presupuestos, setPresupuestos] = useState<PresupuestoPedido[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [seleccionado, setSeleccionado] = useState<PresupuestoPedido | null>(null);

  const [codigoBusqueda, setCodigoBusqueda] = useState("");
  const [filtroStock, setFiltroStock] = useState("");
  const [lineas, setLineas] = useState<LineaPresupuesto[]>([]);
  const [enviandoEmail, setEnviandoEmail] = useState(false);

  const [facturando, setFacturando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [facturas, setFacturas] = useState<any[]>([]);

  const [showNuevoPresupuesto, setShowNuevoPresupuesto] = useState(false);
  const [showModalNuevoUsuario, setShowModalNuevoUsuario] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [usuarioExiste, setUsuarioExiste] = useState(false);
  
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    apellidos: "", 
    email: "",
    telefono: "",
    documento_identidad: "",
    vehiculo: "",
    anio: new Date().getFullYear(),
    mensaje: ""
  });

  const router = useRouter();

  // Función para limpiar y separar apellidos
  const separarApellidos = (texto: string) => {
    const partes = texto.trim().split(/\s+/);
    return {
      ape1: partes[0]?.toUpperCase() || "",
      ape2: partes.slice(1).join(" ").toUpperCase() || ""
    };
  };

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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("user_role");
    if (!role) {
      router.push("/login");
    } else {
      setNombreUsuario(localStorage.getItem("user_name") || "Trabajador");
      cargarTodo();
    }
  }, [router, cargarTodo]);

  const verificarUsuario = async () => {
    const nom = nuevoCliente.nombre.trim().toUpperCase();
    const { ape1, ape2 } = separarApellidos(nuevoCliente.apellidos);

    if (!nom || !ape1) return;

    setVerificando(true);
    try {
      const res = await fetch(`/api/usuarios?nombre=${encodeURIComponent(nom)}&apellidos1=${encodeURIComponent(ape1)}&apellidos2=${encodeURIComponent(ape2)}`);
      const data = await res.json();

      if (res.ok && data.existe) {
        setUsuarioExiste(true);
        setNuevoCliente(prev => ({
          ...prev,
          nombre: data.usuario.nombre || prev.nombre,
          // Mapeamos apellido1 y apellido2 (singular) que vienen de la DB a la vista
          apellidos: `${data.usuario.apellido1} ${data.usuario.apellido2 || ""}`.trim(),
          email: data.usuario.email || prev.email,
          telefono: data.usuario.telefono || prev.telefono,
          documento_identidad: data.usuario.documento_identidad || prev.documento_identidad
        }));
      } else {
        setUsuarioExiste(false);
        setShowModalNuevoUsuario(true);
      }
    } catch (error) {
      console.error("Error verificando usuario:", error);
    } finally {
      setVerificando(false);
    }
  };

  const crearUsuarioYContinuar = async () => {
    const nomLimpio = nuevoCliente.nombre.trim().toUpperCase();
    const { ape1, ape2 } = separarApellidos(nuevoCliente.apellidos);
    const dniLimpio = nuevoCliente.documento_identidad.trim().toUpperCase();
    const telLimpio = nuevoCliente.telefono.trim();
    const emailLimpio = nuevoCliente.email.trim().toLowerCase();

    if (!dniLimpio || !telLimpio || !emailLimpio || !ape1) {
      alert("⚠️ Todos los campos son obligatorios para enviar el correo de activación.");
      return;
    }

    setVerificando(true);
    try {
      const resUsuario = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nomLimpio,
          apellidos1: ape1,
          apellidos2: ape2,
          email: emailLimpio,
          telefono: telLimpio,
          documento_identidad: dniLimpio
        })
      });

      if (resUsuario.ok) {
        setUsuarioExiste(true);
        setShowModalNuevoUsuario(false);
        alert("✅ Cliente registrado. Se ha enviado el correo de configuración de contraseña.");
      } else {
        const data = await resUsuario.json();
        alert("❌ Error: " + (data.error || "No se pudo registrar"));
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setVerificando(false);
    }
  };

  const manejarCreacionPresupuesto = async () => {
    if (!usuarioExiste) {
      alert("Debes verificar o registrar al cliente primero.");
      return;
    }
    const { ape1, ape2 } = separarApellidos(nuevoCliente.apellidos);

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
          estado: "Pendiente"
        })
      });

      if (resPres.ok) {
        setShowNuevoPresupuesto(false);
        setNuevoCliente({
          nombre: "", apellidos: "", email: "", telefono: "",
          documento_identidad: "", vehiculo: "", anio: new Date().getFullYear(), mensaje: ""
        });
        setUsuarioExiste(false);
        await cargarTodo();
      }
    } catch (error: any) {
      alert(`ERROR: ${error.message}`);
    } finally {
      setVerificando(false);
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
      }
    } catch (e) {
      alert("Error al actualizar el estado");
    } finally {
      setCambiandoEstado(false);
    }
  };

  const buscarYAñadirArticulo = async () => {
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
      } else {
        alert("Artículo no encontrado");
      }
    } catch (e) { console.error(e); }
  };

  const totalPresupuesto = lineas.reduce((acc, item) => acc + (Number(item.precio_unitario) * item.cantidad), 0);

  const enviarPresupuestoPDF = async () => {
    if (!seleccionado || lineas.length === 0) return;
    setEnviandoEmail(true);
    try {
      const doc = new jsPDF();
      
      // Diseño del PDF
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("AJCAR 25 - PRESUPUESTO", 14, 25);
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 160, 50);
      
      doc.setFont("helvetica", "bold");
      doc.text("DATOS DEL CLIENTE:", 14, 55);
      doc.setFont("helvetica", "normal");
      doc.text(`Nombre: ${seleccionado.nombre} ${seleccionado.apellidos1} ${seleccionado.apellidos2}`, 14, 62);
      doc.text(`Vehículo: ${seleccionado.vehiculo} (${seleccionado.anio})`, 14, 68);
      doc.text(`Email: ${seleccionado.email}`, 14, 74);

      autoTable(doc, {
        startY: 85,
        head: [['REFERENCIA', 'DESCRIPCIÓN', 'CANT.', 'PRECIO UN.', 'TOTAL']],
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
        body: lineas.map(l => [
          l.codigo, 
          l.descripcion, 
          l.cantidad, 
          `${Number(l.precio_unitario).toFixed(2)}€`, 
          `${(l.cantidad * Number(l.precio_unitario)).toFixed(2)}€`
        ]),
        foot: [[ { content: 'TOTAL PRESUPUESTO', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } }, `${totalPresupuesto.toFixed(2)}€` ]],
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] }
      });

      const pdfBase64 = doc.output('datauristring');
      
      const res = await fetch("/api/enviar-presupuesto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: seleccionado.id, 
          email: seleccionado.email, 
          nombre: `${seleccionado.nombre} ${seleccionado.apellidos1}`, 
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
      }
    } catch (e) { 
      alert("Error al generar o enviar el PDF"); 
    } finally { 
      setEnviandoEmail(false); 
    }
  };

  const procesarFactura = async () => {
    const articulosAFacturar = (view === "mantenimientos" || view === "aceptados") ? seleccionado?.articulos : lineas;
    if (!seleccionado || !articulosAFacturar || articulosAFacturar.length === 0) {
      alert("No hay artículos para facturar");
      return;
    }
    
    setFacturando(true);
    try {
      const res = await fetch("/api/facturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          presupuesto_id: seleccionado.id, 
          cliente_nombre: `${seleccionado.nombre} ${seleccionado.apellidos1} ${seleccionado.apellidos2}`, 
          email: seleccionado.email, 
          vehiculo: seleccionado.vehiculo, 
          total: totalPresupuesto || seleccionado.articulos?.reduce((a, b) => a + (b.precio_unitario * b.cantidad), 0), 
          articulos: articulosAFacturar 
        })
      });
      if (res.ok) { 
        alert("Factura generada y stock actualizado."); 
        await cargarTodo(); 
        setSeleccionado(null); 
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setFacturando(false); 
    }
  };

  const handleLogout = () => { localStorage.clear(); router.push("/"); };

  // --- RENDERIZADO PRINCIPAL ---
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
              <h1 className="text-white text-5xl lg:text-7xl font-black italic tracking-tighter uppercase leading-none">
                {view === 'presupuestos' && "Presupuestos"}
                {view === 'aceptados' && "Aceptados"}
                {view === 'mantenimientos' && "Taller"}
                {view === 'stock' && "Almacén"}
                {view === 'facturas' && "Facturas"}
              </h1>
            </div>

            <nav className="flex items-center gap-1 bg-white/[0.03] p-1.5 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-md">
                {[
                  { id: 'presupuestos', label: 'Nuevos' },
                  { id: 'aceptados', label: 'Aceptados' },
                  { id: 'mantenimientos', label: 'Taller' },
                  { id: 'stock', label: 'Stock' },
                  { id: 'facturas', label: 'Facturas' }
                ].map((v) => (
                    <button 
                        key={v.id}
                        onClick={() => { setView(v.id as any); setSeleccionado(null); }}
                        className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${view === v.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        {v.label}
                    </button>
                ))}
                
                <button 
                  onClick={() => setShowNuevoPresupuesto(true)}
                  className="px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-600/10 transition-all flex items-center gap-2 border border-blue-500/20 ml-1"
                >
                  <FilePlus2 size={14} />
                  Crear
                </button>

                <div className="w-px h-4 bg-white/10 mx-2" />
                
                <button onClick={handleLogout} className="p-2.5 text-red-500/80 hover:text-red-400 hover:bg-red-500/5 rounded-2xl transition-all">
                    <LogOut size={18} />
                </button>
            </nav>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7 space-y-6">
              {loading ? (
                <div className="h-[400px] flex flex-col items-center justify-center bg-[#0f0f12] rounded-[40px] border border-white/5">
                  <Loader2 className="animate-spin text-blue-600" size={48} />
                </div>
              ) : view === "stock" ? (
                <div className="bg-[#0f0f12] rounded-[40px] border border-white/5 overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex gap-4">
                        <div className="flex-1 bg-white/5 rounded-2xl flex items-center px-6 border border-white/5">
                            <Search size={16} className="text-gray-600 mr-4" />
                            <input 
                              type="text" 
                              value={filtroStock} 
                              onChange={(e) => setFiltroStock(e.target.value)} 
                              placeholder="Buscar en almacén..." 
                              className="bg-transparent border-none focus:ring-0 text-xs text-white w-full py-4 uppercase" 
                            />
                        </div>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-black/20 text-[10px] font-black uppercase tracking-widest text-gray-500">
                            <tr><th className="p-8">Referencia</th><th className="p-8">Descripción</th><th className="p-8 text-center">Stock Real</th></tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {articulos.filter(a => a.codigo.toUpperCase().includes(filtroStock.toUpperCase()) || a.descripcion.toUpperCase().includes(filtroStock.toUpperCase())).map(art => (
                                <tr key={art.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-8 font-mono text-blue-400">{art.codigo}</td>
                                    <td className="p-8 text-gray-300 uppercase text-xs">{art.descripcion}</td>
                                    <td className={`p-8 text-center font-black ${art.stock < 5 ? 'text-red-500' : 'text-white'}`}>{art.stock}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              ) : view === "facturas" ? (
                <div className="space-y-4">
                   {facturas.map(f => (
                     <div key={f.id} className="bg-[#0f0f12] p-8 rounded-[32px] border border-white/5 flex justify-between items-center">
                        <div>
                          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Factura #{f.id.slice(0,8)}</p>
                          <h4 className="text-white font-bold uppercase">{f.cliente_nombre}</h4>
                          <p className="text-xs text-gray-500">{f.vehiculo} • {new Date(f.fecha_emision).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-white italic">{f.total.toFixed(2)}€</p>
                          <span className="text-[9px] bg-green-500/10 text-green-500 px-3 py-1 rounded-full font-bold uppercase tracking-tighter">Pagada</span>
                        </div>
                     </div>
                   ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        className={`group p-8 rounded-[40px] border transition-all duration-500 cursor-pointer ${seleccionado?.id === p.id ? 'bg-blue-600 border-blue-500 shadow-2xl shadow-blue-900/40 translate-y-[-4px]' : 'bg-[#0f0f12] border-white/5 hover:border-white/10'}`}
                      >
                         <div className="flex flex-col h-full justify-between gap-10">
                          <div className="flex justify-between items-start">
                            <div className={`p-4 rounded-[20px] ${seleccionado?.id === p.id ? 'bg-white/10 text-white' : 'bg-blue-500/10 text-blue-500'}`}><Car size={24} /></div>
                            <div className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full ${seleccionado?.id === p.id ? 'bg-black/20 text-white' : 'bg-white/5 text-gray-500'}`}>{p.estado}</div>
                          </div>
                          <div>
                            <p className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${seleccionado?.id === p.id ? 'text-blue-100/60' : 'text-gray-500'}`}>{p.vehiculo} • {p.anio}</p>
                            <h3 className={`text-2xl font-black italic tracking-tighter uppercase leading-none ${seleccionado?.id === p.id ? 'text-white' : 'text-gray-200'}`}>{p.nombre} {p.apellidos1}</h3>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <aside className="lg:col-span-5 sticky top-8">
              <div className="bg-[#0f0f12] rounded-[48px] border border-white/5 overflow-hidden shadow-2xl min-h-[500px]">
                {seleccionado ? (
                  <div className="flex flex-col p-10 space-y-8 animate-in fade-in slide-in-from-right-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Detalles de la Cita</span>
                      <button onClick={() => setSeleccionado(null)} className="text-gray-600 hover:text-white transition-colors"><X size={20} /></button>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-3xl font-black italic uppercase text-white leading-none">{seleccionado.nombre} {seleccionado.apellidos1} {seleccionado.apellidos2}</h3>
                      <div className="flex flex-wrap gap-4">
                        <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1"><Mail size={12}/>{seleccionado.email}</span>
                        <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1"><Phone size={12}/>{seleccionado.telefono}</span>
                      </div>
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-[32px] relative">
                      <MessageSquare className="absolute top-4 right-4 text-amber-500/20" size={24} />
                      <p className="text-[9px] font-black uppercase text-amber-500/60 mb-2 tracking-widest">Observaciones:</p>
                      <p className="text-sm text-amber-200/90 italic font-medium leading-relaxed">"{seleccionado.mensaje || "Sin observaciones"}"</p>
                    </div>

                    {view === "presupuestos" && (
                      <div className="space-y-6">
                        <div className="flex gap-2">
                          <input 
                            value={codigoBusqueda} 
                            onChange={(e) => setCodigoBusqueda(e.target.value)} 
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscarYAñadirArticulo(); } }} 
                            placeholder="Añadir pieza por código..." 
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-xs text-white uppercase outline-none focus:border-blue-500 transition-all" 
                          />
                          <button onClick={buscarYAñadirArticulo} className="bg-blue-600 p-3 rounded-xl text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20"><Plus size={20}/></button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                          {lineas.map((l, i) => (
                            <div key={`${l.id}-${i}`} className="flex justify-between items-center bg-white/[0.02] p-4 rounded-2xl border border-white/5 group">
                              <div>
                                <p className="text-[10px] text-gray-300 font-bold uppercase">{l.descripcion}</p>
                                <p className="text-[9px] text-gray-600 font-mono">{l.codigo} x{l.cantidad}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-xs font-black text-white">{(l.cantidad * l.precio_unitario).toFixed(2)}€</span>
                                <button onClick={() => setLineas(lineas.filter((_, idx) => idx !== i))} className="text-gray-700 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-8 bg-blue-600 rounded-[40px] flex justify-between items-center shadow-2xl shadow-blue-900/40">
                          <div className="flex flex-col"><span className="text-[9px] font-black text-blue-200 uppercase tracking-widest">Presupuesto</span><span className="text-4xl font-black italic text-white leading-none tracking-tighter">{totalPresupuesto.toFixed(2)}€</span></div>
                          <button onClick={enviarPresupuestoPDF} disabled={enviandoEmail || lineas.length === 0} className="bg-white text-blue-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50">
                            {enviandoEmail ? <Loader2 className="animate-spin" size={14}/> : <Send size={14}/>} Enviar
                          </button>
                        </div>
                      </div>
                    )}

                    {view === "aceptados" && (
                      <div className="space-y-4">
                        <div className="bg-white/5 p-6 rounded-[32px] border border-white/5">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-4">Piezas Reservadas:</p>
                            {seleccionado.articulos?.map((art, idx) => (
                                <div key={idx} className="flex justify-between text-xs py-1 border-b border-white/5 last:border-0 text-gray-300 uppercase">
                                    <span>{art.descripcion} x{art.cantidad}</span>
                                    <span className="font-mono">{art.precio_unitario * art.cantidad}€</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => cambiarEstado(seleccionado.id, "En Taller")} disabled={cambiandoEstado} className="w-full bg-green-600 text-white py-6 rounded-[32px] font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-green-500 transition-all shadow-xl shadow-green-900/20">
                          {cambiandoEstado ? <Loader2 className="animate-spin" size={16}/> : <Wrench size={16}/>} Iniciar Trabajo
                        </button>
                      </div>
                    )}

                    {view === "mantenimientos" && (
                      <div className="space-y-4">
                         <div className="bg-blue-600/10 p-6 rounded-[32px] border border-blue-600/20">
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Estado del Vehículo:</p>
                            <p className="text-white font-bold text-sm uppercase">En proceso de reparación</p>
                         </div>
                         <button onClick={procesarFactura} disabled={facturando} className="w-full bg-white text-black py-6 rounded-[32px] font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-3 hover:bg-gray-200 transition-all shadow-xl">
                          {facturando ? <Loader2 className="animate-spin" size={16}/> : <Printer size={16}/>} Finalizar y Facturar
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-40 text-center opacity-10">
                    <Car size={80} className="mb-6" />
                    <p className="text-sm font-black uppercase tracking-[0.5em]">Gestión AJCAR 25</p>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* --- MODAL DE NUEVO PRESUPUESTO --- */}
      {showNuevoPresupuesto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6">
          <div className="bg-[#0f0f12] border border-white/10 w-full max-w-xl rounded-[60px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-blue-600/20 to-transparent">
              <div>
                <h2 className="text-white text-3xl font-black italic uppercase tracking-tighter leading-none">Nueva Ficha</h2>
                <p className="text-[9px] text-blue-500 font-bold uppercase tracking-widest mt-2">Paso 1: Identificación del Cliente</p>
              </div>
              <button onClick={() => { setShowNuevoPresupuesto(false); setUsuarioExiste(false); }} className="bg-white/5 p-5 rounded-full text-gray-500 hover:text-white transition-all hover:rotate-90"><X size={20} /></button>
            </div>
            
            <div className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                   <p className="text-[9px] font-black text-gray-600 uppercase ml-4 tracking-widest">Nombre</p>
                   <input placeholder="NOMBRE" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xs text-white uppercase outline-none focus:border-blue-500 transition-all" value={nuevoCliente.nombre} onChange={(e) => setNuevoCliente({...nuevoCliente, nombre: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <p className="text-[9px] font-black text-gray-600 uppercase ml-4 tracking-widest">Apellidos</p>
                   <input 
                    placeholder="APELLIDOS" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xs text-white uppercase outline-none focus:border-blue-500 transition-all" 
                    value={nuevoCliente.apellidos} 
                    onChange={(e) => {
                      setNuevoCliente({...nuevoCliente, apellidos: e.target.value});
                      setUsuarioExiste(false);
                    }}
                    onBlur={verificarUsuario} 
                  />
                </div>
              </div>

              {usuarioExiste && (
                <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl text-[10px] text-blue-400 font-black uppercase tracking-widest animate-pulse">
                  <CheckCircle size={16} /> Cliente localizado en la base de datos
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-gray-600 uppercase ml-4 tracking-widest">Vehículo</p>
                  <input placeholder="MODELO Y MOTOR" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xs text-white uppercase outline-none focus:border-blue-500" value={nuevoCliente.vehiculo} onChange={(e) => setNuevoCliente({...nuevoCliente, vehiculo: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-gray-600 uppercase ml-4 tracking-widest">Año</p>
                  <input type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xs text-white outline-none focus:border-blue-500" value={nuevoCliente.anio} onChange={(e) => setNuevoCliente({...nuevoCliente, anio: parseInt(e.target.value) || 2024})} />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[9px] font-black text-gray-600 uppercase ml-4 tracking-widest">Motivo de la Cita</p>
                <textarea placeholder="DESCRIBE EL PROBLEMA..." className="w-full bg-white/5 border border-white/10 rounded-[32px] p-6 text-xs text-white outline-none focus:border-blue-500 h-32 resize-none uppercase" value={nuevoCliente.mensaje} onChange={(e) => setNuevoCliente({...nuevoCliente, mensaje: e.target.value})} />
              </div>
              
              <button 
                onClick={manejarCreacionPresupuesto} 
                disabled={verificando || !usuarioExiste}
                className={`w-full font-black py-6 rounded-[32px] uppercase text-[10px] tracking-[0.4em] transition-all shadow-2xl flex items-center justify-center gap-3 ${!usuarioExiste ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/30'}`}
              >
                {verificando ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                Generar Presupuesto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL REGISTRO: CLIENTE NO EXISTE --- */}
      {showModalNuevoUsuario && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-md p-6">
          <div className="bg-[#1a1a1e] border border-blue-600/30 w-full max-w-md rounded-[50px] p-12 text-center shadow-3xl">
            <div className="bg-blue-600/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 border border-blue-600/20">
              <UserPlus size={32} className="text-blue-500" />
            </div>
            <h3 className="text-white text-2xl font-black italic uppercase mb-3">Nuevo Cliente</h3>
            <p className="text-gray-500 text-xs mb-10 leading-relaxed uppercase tracking-widest">
              Es necesario registrar a <span className="text-blue-400 font-bold">{nuevoCliente.nombre}</span> para poder continuar con el presupuesto.
            </p>

            <div className="space-y-5 mb-10 text-left">
              <div className="space-y-1.5">
                <p className="text-[9px] font-black text-blue-500/60 uppercase ml-4 tracking-widest">DNI / NIE / CIF</p>
                <input 
                  placeholder="IDENTIFICACIÓN" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xs text-white uppercase outline-none focus:border-blue-500 transition-all" 
                  value={nuevoCliente.documento_identidad} 
                  onChange={(e) => setNuevoCliente({...nuevoCliente, documento_identidad: e.target.value})} 
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-[9px] font-black text-blue-500/60 uppercase ml-4 tracking-widest">Teléfono Móvil</p>
                <input 
                  placeholder="TELÉFONO" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xs text-white outline-none focus:border-blue-500 transition-all" 
                  value={nuevoCliente.telefono} 
                  onChange={(e) => setNuevoCliente({...nuevoCliente, telefono: e.target.value})} 
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-[9px] font-black text-blue-500/60 uppercase ml-4 tracking-widest">Correo Electrónico</p>
                <input 
                  placeholder="EMAIL" 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xs text-white outline-none focus:border-blue-500 transition-all" 
                  value={nuevoCliente.email} 
                  onChange={(e) => setNuevoCliente({...nuevoCliente, email: e.target.value})} 
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={crearUsuarioYContinuar}
                disabled={verificando}
                className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl uppercase text-[10px] tracking-[0.3em] hover:bg-blue-500 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-900/40"
              >
                {verificando ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                Dar de Alta y Activar
              </button>
              <button 
                onClick={() => { setShowModalNuevoUsuario(false); setNuevoCliente({...nuevoCliente, apellidos: ""}); setUsuarioExiste(false); }}
                className="w-full text-gray-600 font-black py-3 rounded-2xl uppercase text-[9px] tracking-widest hover:text-white transition-colors"
              >
                Volver atrás
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}