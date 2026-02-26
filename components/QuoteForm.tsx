"use client";

import { useState, useMemo, useEffect } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { CountryCode } from "libphonenumber-js";
import countries from "@/data/countries-full.json";
import { Send, Car, User, MessageSquare, Calendar, Clock, Mail } from "lucide-react";

export default function QuoteForm() {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // Fecha mínima para el input (Hoy)
  const todayStr = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    vehiculo: "",
    anio: "",
    fechaCita: "",
    horaCita: "",
    mensaje: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phone, setPhone] = useState<string | undefined>();
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("ES");

  const countryData = useMemo(() => {
    const match = countries.find((c) => c.iso2 === selectedCountry);
    return {
      maxLength: match ? match.maxLength : 15,
      dialCode: match ? match.dialCode : "+34"
    };
  }, [selectedCountry]);

  const [maxInputLength, setMaxInputLength] = useState(countryData.maxLength + 5);

  useEffect(() => {
    const newErrors: Record<string, string> = {};

    // Validación de Email
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Email no válido";
    }

    // Validación de Teléfono
    if (phone && !isValidPhoneNumber(phone)) {
      newErrors.phone = "Teléfono incompleto o inválido";
    }

    // Validación de Año (límite lógico 2026)
    if (form.anio && (parseInt(form.anio) < 1900 || parseInt(form.anio) > 2026)) {
      newErrors.anio = "Año no válido";
    }

    // Validación de Fecha (No pasada)
    if (form.fechaCita && form.fechaCita < todayStr) {
      newErrors.fechaCita = "La fecha no puede ser anterior a hoy";
    }

    setErrors(newErrors);
  }, [form, phone, todayStr]);

  const isFormInvalid = useMemo(() => {
    const mandatoryFields = ["nombre", "email", "vehiculo", "anio", "fechaCita", "horaCita", "mensaje"];
    const hasEmptyFields = mandatoryFields.some(key => !form[key as keyof typeof form]?.trim());
    const hasErrors = Object.keys(errors).length > 0;
    const isPhoneValid = phone && isValidPhoneNumber(phone);

    return hasEmptyFields || hasErrors || !isPhoneValid;
  }, [form, errors, phone]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormInvalid) return;

    setLoading(true);
    setServerError("");

    try {
      const response = await fetch("/api/presupuestos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          telefono: phone,
          vehiculo: form.vehiculo,
          anio: parseInt(form.anio),
          fecha_cita: form.fechaCita, // Sincronizado con Neon
          hora_cita: form.horaCita,   // Sincronizado con Neon
          mensaje: form.mensaje,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.message || "Error al enviar el presupuesto");
      } else {
        alert("¡Presupuesto solicitado con éxito!");
        
        // Reset completo del formulario
        setForm({
          nombre: "",
          email: "",
          vehiculo: "",
          anio: "",
          fechaCita: "",
          horaCita: "",
          mensaje: "",
        });
        setPhone(undefined);
      }
    } catch (error) {
      setServerError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      
      {/* NOMBRE Y EMAIL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1 text-gray-300 font-medium">Nombre Completo</label>
          <div className="flex items-center bg-neutral-800 border border-white/10 rounded px-3 focus-within:border-red-500 transition-colors">
            <User size={18} className="text-gray-500" />
            <input 
              name="nombre" 
              value={form.nombre} 
              onChange={handleChange} 
              placeholder="Tu nombre"
              className="w-full bg-transparent p-3 text-sm outline-none text-white" 
            />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1 text-gray-300 font-medium">Correo Electrónico</label>
          <div className={`flex items-center bg-neutral-800 border rounded px-3 transition-colors ${errors.email ? "border-red-500" : "border-white/10 focus-within:border-red-500"}`}>
            <Mail size={18} className="text-gray-500" />
            <input 
              name="email" 
              type="email"
              value={form.email} 
              onChange={handleChange} 
              placeholder="ejemplo@correo.com"
              className="w-full bg-transparent p-3 text-sm outline-none text-white" 
            />
          </div>
          {errors.email && <p className="text-red-500 text-[11px] mt-1">{errors.email}</p>}
        </div>
      </div>

      {/* TELÉFONO */}
      <div>
        <label className="block text-sm mb-1 text-gray-300 font-medium">Número de Teléfono</label>
        <div className={`bg-neutral-800 border rounded p-2 focus-within:border-red-500 transition-all ${errors.phone ? "border-red-500" : "border-white/10"}`}>
          <PhoneInput
            defaultCountry="ES"
            value={phone}
            onChange={setPhone}
            onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
              const value = (e.target as HTMLInputElement).value;
              const formatCount = (value.match(/[ -]/g) || []).length;
              setMaxInputLength(countryData.maxLength + countryData.dialCode.length + formatCount);
            }}
            onCountryChange={(c) => c && setSelectedCountry(c as CountryCode)}
            international
            className="text-white quote-phone-input"
            numberInputProps={{ 
              maxLength: maxInputLength, 
              className: "bg-transparent outline-none w-full ml-2 text-white text-sm" 
            }}
          />
        </div>
        {errors.phone && <p className="text-red-500 text-[11px] mt-1">{errors.phone}</p>}
      </div>

      {/* VEHÍCULO Y AÑO */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm mb-1 text-gray-300 font-medium">Vehículo</label>
          <div className="flex items-center bg-neutral-800 border border-white/10 rounded px-3 focus-within:border-red-500 transition-colors">
            <Car size={18} className="text-gray-500" />
            <input 
              name="vehiculo" 
              value={form.vehiculo} 
              onChange={handleChange} 
              placeholder="Ej: BMW M4"
              className="w-full bg-transparent p-3 text-sm outline-none text-white" 
            />
          </div>
        </div>
        <div className="w-1/3">
          <label className="block text-sm mb-1 text-gray-300 font-medium">Año</label>
          <div className={`flex items-center bg-neutral-800 border rounded px-3 focus-within:border-red-500 transition-colors ${errors.anio ? "border-red-500" : "border-white/10"}`}>
            <Calendar size={18} className="text-gray-500" />
            <input 
              name="anio" 
              type="number"
              value={form.anio} 
              onChange={handleChange} 
              placeholder="2024"
              className="w-full bg-transparent p-3 text-sm outline-none text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
            />
          </div>
        </div>
      </div>

      {/* FECHA Y HORA */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm mb-1 text-gray-300 font-medium">Fecha preferida</label>
          <div className={`flex items-center bg-neutral-800 border rounded px-3 focus-within:border-red-500 transition-colors ${errors.fechaCita ? "border-red-500" : "border-white/10"}`}>
            <Calendar size={18} className="text-gray-500" />
            <input 
              name="fechaCita" 
              type="date"
              min={todayStr}
              value={form.fechaCita} 
              onChange={handleChange} 
              className="w-full bg-transparent p-3 text-sm outline-none text-white color-scheme-dark" 
            />
          </div>
          {errors.fechaCita && <p className="text-red-500 text-[11px] mt-1">{errors.fechaCita}</p>}
        </div>
        <div className="w-1/2">
          <label className="block text-sm mb-1 text-gray-300 font-medium">Hora</label>
          <div className="flex items-center bg-neutral-800 border border-white/10 rounded px-3 focus-within:border-red-500 transition-colors">
            <Clock size={18} className="text-gray-500" />
            <input 
              name="horaCita" 
              type="time"
              value={form.horaCita} 
              onChange={handleChange} 
              className="w-full bg-transparent p-3 text-sm outline-none text-white color-scheme-dark" 
            />
          </div>
        </div>
      </div>

      {/* MENSAJE */}
      <div>
        <label className="block text-sm mb-1 text-gray-300 font-medium">¿Qué necesitas?</label>
        <div className="flex items-start bg-neutral-800 border border-white/10 rounded px-3 pt-3 focus-within:border-red-500 transition-colors">
          <MessageSquare size={18} className="text-gray-500 mt-1" />
          <textarea 
            name="mensaje" 
            value={form.mensaje} 
            onChange={handleChange} 
            rows={4}
            placeholder="Describe el daño o servicio..."
            className="w-full bg-transparent px-3 pb-3 text-sm outline-none text-white resize-none" 
          />
        </div>
      </div>

      {/* ALERTA DE ERROR */}
      {serverError && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded text-sm text-center animate-pulse">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={isFormInvalid || loading}
        className={`w-full p-4 rounded-lg font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
          isFormInvalid || loading
            ? "bg-neutral-700 opacity-50 cursor-not-allowed text-gray-400"
            : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 active:scale-[0.98]"
        }`}
      >
        {loading ? (
          <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Solicitar Presupuesto
            <Send size={18} />
          </>
        )}
      </button>
    </form>
  );
}