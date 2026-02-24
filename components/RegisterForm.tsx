"use client";

import { useState } from "react";
import PhoneInput, {
  isValidPhoneNumber,
  getCountryCallingCode,
} from "react-phone-number-input";

// IMPORTANTE: Importamos 'examples' para evitar el error de tipos en Vercel
import examples from "libphonenumber-js/mobile/examples";
import { getExampleNumber, CountryCode } from "libphonenumber-js";

import "react-phone-number-input/style.css";

/**
 * Formulario de Registro optimizado para Next.js + Vercel
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
  const [country, setCountry] = useState<CountryCode>("ES");
  const [phoneError, setPhoneError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Función corregida para obtener la longitud máxima permitida por país
  const getMaxLength = (countryCode: CountryCode) => {
    try {
      const example = getExampleNumber(countryCode, examples);
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
    let callingCode = "";

    try {
      callingCode = getCountryCallingCode(country);
    } catch (e) {
      callingCode = "";
    }

    // Extraer número nacional para validar longitud
    const nationalNumber = value.replace(`+${callingCode}`, "");

    if (nationalNumber.length <= maxLength) {
      setPhone(value);
      if (phoneError) setPhoneError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
    if (form.password !== form.repeatPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    if (!phone || !isValidPhoneNumber(phone)) {
      setPhoneError("Número no válido para el país seleccionado");
      return;
    }

    setPhoneError("");

    const finalData = {
      ...form,
      telefono: phone,
      pais: country
    };

    console.log("Datos listos para enviar:", finalData);
    alert("Formulario enviado correctamente");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-neutral-950 text-white p-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 w-full max-w-md bg-neutral-900 p-8 rounded-2xl shadow-2xl border border-white/5"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-red-500">Crear Cuenta</h2>

        {/* Mapeo de campos de texto estándar */}
        {[
          { label: "Nombre", name: "nombre" },
          { label: "Primer Apellido", name: "apellido1" },
          { label: "Segundo Apellido", name: "apellido2" },
          { label: "DNI / NIF", name: "dni" },
          { label: "Email", name: "email", type: "email" },
        ].map((field) => (
          <div key={field.name}>
            <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1 ml-1">
              {field.label}
            </label>
            <input
              type={field.type || "text"}
              name={field.name}
              required
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-neutral-800 border border-white/10 focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
            />
          </div>
        ))}

        {/* Input de Teléfono */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1 ml-1">
            Teléfono Móvil
          </label>
          <div className="bg-neutral-800 border border-white/10 rounded-lg p-1 focus-within:border-red-500 transition-all">
            <PhoneInput
              defaultCountry="ES"
              value={phone}
              onChange={handlePhoneChange}
              onCountryChange={(v) => setCountry((v as CountryCode) || "ES")}
              international
              countryCallingCodeEditable={false}
              className="phone-input-dark"
            />
          </div>
          {phoneError && (
            <p className="text-red-500 text-xs mt-1 ml-1">{phoneError}</p>
          )}
        </div>

        {/* Contraseñas */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { label: "Contraseña", name: "password" },
            { label: "Repetir", name: "repeatPassword" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-xs uppercase tracking-wider text-neutral-500 mb-1 ml-1">
                {field.label}
              </label>
              <input
                type="password"
                name={field.name}
                required
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-neutral-800 border border-white/10 focus:border-red-500 outline-none transition-all"
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg mt-4 transition-transform active:scale-95 shadow-lg shadow-red-900/20"
        >
          Finalizar Registro
        </button>
      </form>

      {/* Estilos para forzar el modo oscuro en el componente externo */}
      <style jsx global>{`
        .phone-input-dark .PhoneInputInput {
          background: transparent;
          border: none;
          color: white;
          padding: 0.75rem;
          outline: none;
          font-size: 1rem;
        }
        .phone-input-dark .PhoneInputCountrySelect {
          background-color: #171717;
          color: white;
        }
        .PhoneInputCountryIcon {
          margin-left: 10px;
          box-shadow: none;
        }
      `}</style>
    </div>
  );
}