"use client";

import { useState, useMemo, useEffect } from "react";
import { Send, Car, User, MessageSquare, Calendar, Clock, Mail } from "lucide-react";
import PhoneInput from "@/components/PhoneInput";

import { AlertTriangle, Check } from "lucide-react";

// ✅ Modal de alerta inline (reemplaza AlertModal externo)
const ModalAlerta = ({ titulo, mensaje, tipo, onConfirmar, onCancelar, mostrarCancelar, textoConfirmar, textoCancelar }: {
  titulo: string; mensaje: string; tipo: "success" | "error" | "warning" | "info";
  onConfirmar?: () => void; onCancelar?: () => void;
  mostrarCancelar?: boolean; textoConfirmar?: string; textoCancelar?: string;
}) => {
  const colores = {
    success: "text-green-400 bg-green-500/10",
    error:   "text-red-400 bg-red-500/10",
    warning: "text-yellow-400 bg-yellow-500/10",
    info:    "text-blue-400 bg-blue-500/10",
  };
  const btnConfirmar = {
    success: "bg-green-600 hover:bg-green-700",
    error:   "bg-red-600 hover:bg-red-700",
    warning: "bg-yellow-600 hover:bg-yellow-700 text-black",
    info:    "bg-blue-600 hover:bg-blue-700",
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-[#0f0f12] border border-white/10 rounded-t-[30px] sm:rounded-[40px] p-6 sm:p-10 w-full max-w-md">
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${colores[tipo]}`}>
            <AlertTriangle size={18} />
          </div>
          <h3 className="text-xl font-black text-white">{titulo}</h3>
        </div>
        <p className="text-gray-300 text-sm mb-6 whitespace-pre-line leading-relaxed">{mensaje}</p>
        <div className="flex gap-3">
          {mostrarCancelar && onCancelar && (
            <button onClick={onCancelar} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 py-3 rounded-xl font-bold transition-all text-sm">
              {textoCancelar || "No"}
            </button>
          )}
          <button onClick={onConfirmar} className={`flex-1 ${btnConfirmar[tipo]} text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm`}>
            <Check size={15} /> {textoConfirmar || "Aceptar"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function QuoteForm() {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const [customAlert, setCustomAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false, title: "", message: "", type: "warning",
  });

  const showCustomAlert = (
    title: string, message: string,
    type: "success" | "error" | "warning" | "info" = "warning",
    onConfirm?: () => void, onCancel?: () => void
  ) => { setCustomAlert({ isOpen: true, title, message, type, onConfirm, onCancel }); };

  const closeCustomAlert = () => setCustomAlert(prev => ({ ...prev, isOpen: false }));

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [form, setForm] = useState({
    nombre: "", email: "", vehiculo: "", anio: "",
    fechaCita: "", horaCita: "", mensaje: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phone, setPhone] = useState("");
  const [phoneValid, setPhoneValid] = useState(false);
  const [phoneFull, setPhoneFull] = useState("");

  const verificarEmailExistente = async (email: string) => {
    if (!email || email.length < 6) return;
    try {
      const res = await fetch(`/api/usuarios/existe-email?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.existe) {
        if (data.esEmpleado) {
          showCustomAlert("Acción no permitida",
            "No se puede enviar un presupuesto a un correo de empleado.\n\nPor favor utiliza un correo personal o de cliente.",
            "error", undefined,
            () => setForm(prev => ({ ...prev, email: "" })));
        } else {
          showCustomAlert("Correo ya registrado",
            "Has utilizado un correo electrónico que ya está registrado.\n\n¿Quieres asignar este vehículo a este correo también?",
            "warning",
            () => setForm(prev => ({ ...prev, nombre: data.usuario.nombre || prev.nombre })),
            () => setForm(prev => ({ ...prev, email: "" })));
        }
      }
    } catch (error) { console.error("Error verificando email:", error); }
  };

  useEffect(() => {
    const newErrors: Record<string, string> = {};
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = "Email no válido";
    if (phone && !phoneValid) newErrors.phone = "Teléfono incompleto o inválido";
    if (form.anio && (parseInt(form.anio) < 1900 || parseInt(form.anio) > 2026)) newErrors.anio = "Año no válido";
    if (form.fechaCita && form.fechaCita < todayStr) newErrors.fechaCita = "La fecha no puede ser anterior a hoy";
    setErrors(newErrors);
  }, [form, phone, todayStr]);

  const isFormInvalid = useMemo(() => {
    const mandatoryFields = ["nombre", "email", "vehiculo", "anio", "fechaCita", "horaCita", "mensaje"];
    const hasEmptyFields = mandatoryFields.some(key => !form[key as keyof typeof form]?.trim());
    const hasErrors = Object.keys(errors).length > 0;
    const isPhoneValid = phone.length > 0 && phoneValid;
    return hasEmptyFields || hasErrors || !isPhoneValid;
  }, [form, errors, phone, phoneValid]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === "email") verificarEmailExistente(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormInvalid) return;
    setLoading(true); setServerError("");
    try {
      const response = await fetch("/api/presupuestos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre, email: form.email, telefono: phoneFull,
          vehiculo: form.vehiculo, anio: parseInt(form.anio),
          fecha_cita: form.fechaCita, hora_cita: form.horaCita, mensaje: form.mensaje,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setServerError(data.message || "Error al enviar el presupuesto");
        showCustomAlert("Error", data.message || "No se pudo enviar el presupuesto", "error");
      } else {
        showCustomAlert("¡Éxito!", "Presupuesto solicitado correctamente. Te contactaremos pronto.", "success");
        setForm({ nombre: "", email: "", vehiculo: "", anio: "", fechaCita: "", horaCita: "", mensaje: "" });
        setPhone(""); setPhoneValid(false); setPhoneFull("");
      }
    } catch (error) {
      setServerError("Error de conexión con el servidor.");
      showCustomAlert("Error", "Error de conexión con el servidor.", "error");
    } finally { setLoading(false); }
  };

  const inputBase = "w-full bg-transparent p-3 text-sm outline-none text-white placeholder:text-gray-600";
  const wrapBase = "flex items-center bg-neutral-800 border rounded px-3 transition-colors focus-within:border-red-500";

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 w-full">

        {/* Nombre + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 text-gray-300 font-medium">Nombre Completo</label>
            <div className={`${wrapBase} border-white/10`}>
              <User size={16} className="text-gray-500 flex-shrink-0" />
              <input name="nombre" value={form.nombre} onChange={handleChange}
                placeholder="Tu nombre" className={inputBase} />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-300 font-medium">Correo Electrónico</label>
            <div className={`${wrapBase} ${errors.email ? "border-red-500" : "border-white/10"}`}>
              <Mail size={16} className="text-gray-500 flex-shrink-0" />
              <input name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="ejemplo@correo.com" className={inputBase} />
            </div>
            {errors.email && <p className="text-red-500 text-[11px] mt-1">{errors.email}</p>}
          </div>
        </div>

        {/* Teléfono */}
        <div className="relative">
          <label className="block text-sm mb-1 text-gray-300 font-medium">Número de Teléfono</label>
          <PhoneInput
            value={phone}
            onChange={(val, valid, full) => { setPhone(val); setPhoneValid(valid); setPhoneFull(full); }}
            error={errors.phone}
          />
        </div>

        {/* Vehículo + Año */}
        <div className="flex gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <label className="block text-sm mb-1 text-gray-300 font-medium">Vehículo</label>
            <div className={`${wrapBase} border-white/10`}>
              <Car size={16} className="text-gray-500 flex-shrink-0" />
              <input name="vehiculo" value={form.vehiculo} onChange={handleChange}
                placeholder="Ej: BMW M4" className={inputBase} />
            </div>
          </div>
          <div className="w-24 sm:w-1/3 flex-shrink-0">
            <label className="block text-sm mb-1 text-gray-300 font-medium">Año</label>
            <div className={`${wrapBase} ${errors.anio ? "border-red-500" : "border-white/10"}`}>
              <Calendar size={16} className="text-gray-500 flex-shrink-0 hidden sm:block" />
              <input name="anio" type="number" value={form.anio} onChange={handleChange}
                placeholder="2024"
                className={`${inputBase} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`} />
            </div>
            {errors.anio && <p className="text-red-500 text-[11px] mt-1">{errors.anio}</p>}
          </div>
        </div>

        {/* Fecha + Hora */}
        <div className="flex gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <label className="block text-sm mb-1 text-gray-300 font-medium">Fecha preferida</label>
            <div className={`${wrapBase} ${errors.fechaCita ? "border-red-500" : "border-white/10"}`}>
              <Calendar size={16} className="text-gray-500 flex-shrink-0" />
              <input name="fechaCita" type="date" min={todayStr} value={form.fechaCita}
                onChange={handleChange}
                className={`${inputBase} color-scheme-dark`} />
            </div>
            {errors.fechaCita && <p className="text-red-500 text-[11px] mt-1">{errors.fechaCita}</p>}
          </div>
          <div className="w-28 sm:w-2/5 flex-shrink-0">
            <label className="block text-sm mb-1 text-gray-300 font-medium">Hora</label>
            <div className={`${wrapBase} border-white/10`}>
              <Clock size={16} className="text-gray-500 flex-shrink-0 hidden sm:block" />
              <input name="horaCita" type="time" value={form.horaCita} onChange={handleChange}
                className={`${inputBase} color-scheme-dark`} />
            </div>
          </div>
        </div>

        {/* Mensaje */}
        <div>
          <label className="block text-sm mb-1 text-gray-300 font-medium">¿Qué necesitas?</label>
          <div className="flex items-start bg-neutral-800 border border-white/10 rounded px-3 pt-3 focus-within:border-red-500 transition-colors">
            <MessageSquare size={16} className="text-gray-500 mt-1 flex-shrink-0" />
            <textarea name="mensaje" value={form.mensaje} onChange={handleChange}
              rows={4} placeholder="Describe el daño o servicio..."
              className="w-full bg-transparent px-3 pb-3 text-sm outline-none text-white resize-none" />
          </div>
        </div>

        {serverError && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded text-sm text-center animate-pulse">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isFormInvalid || loading}
          className={`w-full p-3.5 sm:p-4 rounded-lg font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
            isFormInvalid || loading
              ? "bg-neutral-700 opacity-50 cursor-not-allowed text-gray-400"
              : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 active:scale-[0.98]"
          }`}
        >
          {loading ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Solicitar Presupuesto <Send size={16} /></>
          )}
        </button>
      </form>

      {customAlert.isOpen && (
        <ModalAlerta
          titulo={customAlert.title}
          mensaje={customAlert.message}
          tipo={customAlert.type}
          onConfirmar={() => { if (customAlert.onConfirm) customAlert.onConfirm(); closeCustomAlert(); }}
          onCancelar={() => { if (customAlert.onCancel) customAlert.onCancel(); closeCustomAlert(); }}
          mostrarCancelar={customAlert.type === "warning"}
          textoConfirmar={customAlert.type === "warning" ? "Sí, asignar vehículo" : "Aceptar"}
          textoCancelar="No, cambiar correo"
        />
      )}
    </>
  );
}
