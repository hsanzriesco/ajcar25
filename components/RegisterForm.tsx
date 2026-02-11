"use client";

import { useState } from "react";

export default function RegisterForm() {
  const [form, setForm] = useState({
    nombre: "",
    apellido1: "",
    apellido2: "",
    dni: "",
    email: "",
    telefono: "",
    password: "",
    repeatPassword: "",
  });

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

    console.log(form);

    // Aquí conectarás backend
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 w-full max-w-md"
    >
      {[
        { label: "Nombre", name: "nombre" },
        { label: "Primer Apellido", name: "apellido1" },
        { label: "Segundo Apellido", name: "apellido2" },
        { label: "DNI/NIF", name: "dni" },
        { label: "Correo Electrónico", name: "email", type: "email" },
        { label: "Número de Teléfono", name: "telefono" },
        { label: "Contraseña", name: "password", type: "password" },
        { label: "Repetir Contraseña", name: "repeatPassword", type: "password" },
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

      <button
        type="submit"
        className="w-full bg-red-600 hover:bg-red-700 transition p-3 rounded font-semibold"
      >
        Registrarse
      </button>
    </form>
  );
}