"use client";

import { useState, useMemo } from "react";
import PhoneInput, { isValidPhoneNumber, Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";

// Importa tu JSON o defínelo aquí
const countriesData = [
  { name: "Afghanistan", iso2: "AF", dialCode: "+93", maxLength: 9 },
  { name: "Spain", iso2: "ES", dialCode: "+34", maxLength: 9 },
  { name: "Mexico", iso2: "MX", dialCode: "+52", maxLength: 10 },
  { name: "United States", iso2: "US", dialCode: "+1", maxLength: 10 },
  // ... añade el resto aquí
];

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

  // Buscamos el límite de caracteres según el país seleccionado
  const currentMaxLength = useMemo(() => {
    const found = countriesData.find((c) => c.iso2 === country);
    return found ? found.maxLength : 15; // 15 es el estándar máximo de la ITU
  }, [country]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
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
    console.log({ ...form, telefono: phone });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md text-white">
      {/* Campos básicos */}
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
            className="w-full p-3 rounded bg-neutral-800 border border-white/10 focus:border-red-500 outline-none"
          />
        </div>
      ))}

      {/* Teléfono internacional */}
      <div>
        <label className="block text-sm mb-1">Número de Teléfono</label>
        <div className="bg-neutral-800 border border-white/10 rounded p-2 focus-within:border-red-500">
          <PhoneInput
            defaultCountry="ES"
            value={phone}
            onChange={setPhone}
            onCountryChange={(c) => setCountry(c as Country)}
            international
            countryCallingCodeEditable={false}
            maxLength={currentMaxLength + (phone?.startsWith('+') ? 4 : 0)} 
            // Sumamos un margen pequeño por el código de país (+)
            className="phone-input-custom"
          />
        </div>
        {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
        <p className="text-neutral-500 text-[10px] mt-1">
          Máximo permitido para {country}: {currentMaxLength} dígitos.
        </p>
      </div>

      {/* Contraseña */}
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
            className="w-full p-3 rounded bg-neutral-800 border border-white/10 focus:border-red-500 outline-none"
          />
        </div>
      ))}

      <button
        type="submit"
        className="w-full bg-red-600 hover:bg-red-700 transition p-3 rounded font-semibold"
      >
        Registrarse
      </button>

      <style jsx global>{`
        .phone-input-custom input {
          background: transparent;
          border: none;
          color: white;
          outline: none;
          width: 100%;
        }
        .PhoneInputCountrySelect {
          color: black;
        }
      `}</style>
    </form>
  );
}