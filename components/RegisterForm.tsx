"use client";

import { useState } from "react";
import PhoneInput, {
  isValidPhoneNumber,
  getCountryCallingCode,
} from "react-phone-number-input";
import metadata from "libphonenumber-js/metadata.min.json";
import { getExampleNumber } from "libphonenumber-js";
import "react-phone-number-input/style.css";

/**
 * Formulario de Registro con validación de teléfono internacional
 * Requiere: npm install react-phone-number-input libphonenumber-js
 */
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
  const [country, setCountry] = useState<string>("ES");
  const [phoneError, setPhoneError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Obtener longitud máxima real del país seleccionado
  const getMaxLength = (countryCode: string) => {
    try {
      const example = getExampleNumber(countryCode as any, metadata);
      return example ? example.nationalNumber.length : 15;
    } catch (error) {
      return 15;
    }
  };

  const handlePhoneChange = (value: string | undefined) => {
    if (!value) {
      setPhone(undefined);
      return;
    }

    const maxLength = getMaxLength(country);
    const callingCode = getCountryCallingCode(country as any);
    
    // Extraemos solo el número nacional eliminando el prefijo del país
    const nationalNumber = value.replace(`+${callingCode}`, "");

    if (nationalNumber.length <= maxLength) {
      setPhone(value);
      setPhoneError(""); // Limpiamos error mientras escribe
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validar contraseñas
    if (form.password !== form.repeatPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    // 2. Validar teléfono
    if (!phone || !isValidPhoneNumber(phone)) {
      setPhoneError("Número no válido para el país seleccionado");
      return;
    }

    setPhoneError("");

    const finalData = {
      ...form,
      telefono: phone,
    };

    console.log("Datos enviados:", finalData);
    alert("Registro completado con éxito");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-neutral-950 text-white p-4">
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md bg-neutral-900 p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Crear Cuenta</h2>

        {/* Campos Generales */}
        {[
          { label: "Nombre", name: "nombre" },
          { label: "Primer Apellido", name: "apellido1" },
          { label: "Segundo Apellido", name: "apellido2" },
          { label: "DNI/NIF", name: "dni" },
          { label: "Correo Electrónico", name: "email", type: "email" },
        ].map((field) => (
          <div key={field.name}>
            <label className="block text-sm mb-1 text-neutral-400">{field.label}</label>
            <input
              type={field.type || "text"}
              name={field.name}
              required
              onChange={handleChange}
              className="w-full p-3 rounded bg-neutral-800 border border-white/10 focus:border-red-500 outline-none transition-colors"
            />
          </div>
        ))}

        {/* Teléfono internacional */}
        <div>
          <label className="block text-sm mb-1 text-neutral-400">
            Número de Teléfono
          </label>
          <div className="bg-neutral-800 border border-white/10 rounded p-1 focus-within:border-red-500 transition-colors">
            <PhoneInput
              defaultCountry="ES"
              value={phone}
              onChange={handlePhoneChange}
              onCountryChange={(value) => setCountry(value || "ES")}
              international
              countryCallingCodeEditable={false}
              className="phone-input-custom"
            />
          </div>
          {phoneError && (
            <p className="text-red-500 text-xs mt-1 animate-pulse">
              {phoneError}
            </p>
          )}
        </div>

        {/* Contraseñas */}
        {[
          { label: "Contraseña", name: "password", type: "password" },
          { label: "Repetir Contraseña", name: "repeatPassword", type: "password" },
        ].map((field) => (
          <div key={field.name}>
            <label className="block text-sm mb-1 text-neutral-400">{field.label}</label>
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
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 mt-6"
        >
          Registrarse
        </button>
      </form>

      {/* Estilos CSS adicionales para manejar el color del texto en el select de países */}
      <style jsx global>{`
        .phone-input-custom .PhoneInputInput {
          background: transparent;
          border: none;
          color: white;
          padding: 0.75rem;
          outline: none;
        }
        .PhoneInputCountrySelect {
          background-color: #262626 !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
}