"use client";

import { useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

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
  const [phoneError, setPhoneError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar contraseñas
    if (form.password !== form.repeatPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    // Validar teléfono internacional
    if (!phone || !isValidPhoneNumber(phone)) {
      setPhoneError("Número de teléfono no válido");
      return;
    }

    setPhoneError("");

    const finalData = {
      ...form,
      telefono: phone,
    };

    console.log(finalData);

    // Aquí conectarás backend
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">

      {/* Campos básicos */}
      {[
        { label: "Nombre", name: "nombre" },
        { label: "Primer Apellido", name: "apellido1" },
        { label: "Segundo Apellido", name: "apellido2" },
        { label: "DNI/NIF", name: "dni" },
        { label: "Correo Electrónico", name: "email", type: "email" },
      ].map((field) => (
        <div key={field.name}>
          <label className="block text-sm mb-1">
            {field.label}
          </label>

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
        <label className="block text-sm mb-1">
          Número de Teléfono
        </label>

        <div className="bg-neutral-800 border border-white/10 rounded p-2 focus-within:border-red-500">
          <PhoneInput
            defaultCountry="ES"
            value={phone}
            onChange={setPhone}
            international
            countryCallingCodeEditable={false}
            className="text-black"
          />
        </div>

        {phoneError && (
          <p className="text-red-500 text-sm mt-1">
            {phoneError}
          </p>
        )}
      </div>

      {/* Contraseña */}
      {[
        { label: "Contraseña", name: "password", type: "password" },
        { label: "Repetir Contraseña", name: "repeatPassword", type: "password" },
      ].map((field) => (
        <div key={field.name}>
          <label className="block text-sm mb-1">
            {field.label}
          </label>

          <input
            type={field.type}
            name={field.name}
            required
            onChange={handleChange}
            className="w-full p-3 rounded bg-neutral-800 border border-white/10 focus:border-red-500 outline-none"
          />
        </div>
      ))}

      {/* Botón */}
      <button
        type="submit"
        className="w-full bg-red-600 hover:bg-red-700 transition p-3 rounded font-semibold"
      >
        Registrarse
      </button>

    </form>
  );
}