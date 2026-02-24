"use client";

import { useState, useMemo } from "react";
import PhoneInput, {
  isValidPhoneNumber,
  Country,
} from "react-phone-number-input";
import "react-phone-number-input/style.css";

// IMPORTANTE: Asegúrate de que la ruta a tu JSON sea correcta
import countriesData from "@/data/countries-full.json"; 

export default function RegisterForm() {
  const [form, setForm] = useState({
    nombre: "",
    apellido1: "",
    apellido2: "",
    dni: "",
    email: "",
    password: "",
    repeatPassword: "",
  });

  const [phone, setPhone] = useState<string | undefined>();
  const [country, setCountry] = useState<Country>("ES");
  const [phoneError, setPhoneError] = useState("");

  // Buscamos la configuración del país seleccionado en tu JSON
  const countryConfig = useMemo(() => {
    return (
      countriesData.find((c: any) => c.iso2 === country) || {
        maxLength: 15,
        dialCode: "",
      }
    );
  }, [country]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Función controlada para el cambio de teléfono (Bloqueo de escritura)
  const handlePhoneChange = (value: string | undefined) => {
    if (!value) {
      setPhone(undefined);
      return;
    }

    // Eliminamos el prefijo y caracteres no numéricos para contar solo los dígitos reales
    const digitsOnly = value.replace(countryConfig.dialCode, "").replace(/\D/g, "");

    // Solo actualizamos si no supera el límite de tu JSON
    if (digitsOnly.length <= countryConfig.maxLength) {
      setPhone(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.repeatPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    if (!phone || !isValidPhoneNumber(phone)) {
      setPhoneError("Número de teléfono no válido para el país seleccionado");
      return;
    }

    setPhoneError("");

    const finalData = {
      ...form,
      telefono: phone,
    };

    console.log("Datos para el backend:", finalData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md text-white">
      {/* CAMPOS BÁSICOS */}
      {[
        { label: "Nombre", name: "nombre" },
        { label: "Primer Apellido", name: "apellido1" },
        { label: "Segundo Apellido", name: "apellido2" },
        { label: "DNI/NIF", name: "dni" },
        { label: "Correo Electrónico", name: "email", type: "email" },
      ].map((field) => (
        <div key={field.name}>
          <label className="block text-sm mb-1">{field.label}</label>
          <input
            type={field.type || "text"}
            name={field.name}
            required
            onChange={handleChange}
            className="w-full p-3 rounded bg-neutral-800 border border-white/10 focus:border-red-500 outline-none transition-colors"
          />
        </div>
      ))}

      {/* TELÉFONO PROFESIONAL INTERNACIONAL */}
      <div>
        <label className="block text-sm mb-1">Número de Teléfono</label>
        <div className="bg-neutral-800 border border-white/10 rounded p-2 focus-within:border-red-500 transition-colors">
          <PhoneInput
            defaultCountry="ES"
            value={phone}
            onChange={handlePhoneChange}
            onCountryChange={(c) => {
              setCountry(c as Country);
              setPhone(undefined); // Resetear al cambiar país
            }}
            international
            countryCallingCodeEditable={false}
            className="phone-input-custom"
          />
        </div>

        {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
        
        <p className="text-neutral-500 text-[10px] mt-1 italic">
          Máximo permitido para {country}: {countryConfig.maxLength} dígitos (sin contar prefijo ni espacios).
        </p>
      </div>

      {/* CONTRASEÑAS */}
      {[
        { label: "Contraseña", name: "password", type: "password" },
        { label: "Repetir Contraseña", name: "repeatPassword", type: "password" },
      ].map((field) => (
        <div key={field.name}>
          <label className="block text-sm mb-1">{field.label}</label>
          <input
            type={field.type}
            name={field.name}
            required
            onChange={handleChange}
            className="w-full p-3 rounded bg-neutral-800 border border-white/10 focus:border-red-500 outline-none transition-colors"
          />
        </div>
      ))}

      <button
        type="submit"
        className="w-full bg-red-600 hover:bg-red-700 transition p-3 rounded font-semibold mt-4 shadow-md active:scale-[0.98]"
      >
        Registrarse
      </button>

      {/* Estilos para limpiar el componente externo */}
      <style jsx global>{`
        .phone-input-custom input {
          background: transparent;
          border: none;
          color: white;
          outline: none;
          width: 100%;
        }
        .PhoneInputCountrySelect {
          color: black; /* Para que el menú de países sea legible */
        }
      `}</style>
    </form>
  );
}