"use client"

import { useState } from "react"
import countries from "@/data/countries.json"

type Country = typeof countries[number]

export default function RegisterForm() {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0])

  const [form, setForm] = useState({
    nombre: "",
    apellido1: "",
    apellido2: "",
    dni: "",
    email: "",
    telefono: "",
    password: "",
    repeatPassword: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handlePhoneChange = (value: string) => {
    const onlyNumbers = value.replace(/\D/g, "")
    setForm({
      ...form,
      telefono: onlyNumbers,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (form.password !== form.repeatPassword) {
      alert("Las contraseñas no coinciden")
      return
    }

    const regex = new RegExp(selectedCountry.regex)

    if (!regex.test(form.telefono)) {
      alert("Número no válido para " + selectedCountry.name)
      return
    }

    const finalData = {
      ...form,
      telefono: selectedCountry.dialCode + form.telefono,
    }

    console.log(finalData)

    // Aquí conectarás backend
  }

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

      {/* TELÉFONO CON SELECTOR */}
      <div>
        <label className="block text-sm mb-1">
          Número de Teléfono
        </label>

        <div className="flex">
          <select
            value={selectedCountry.code}
            onChange={(e) =>
              setSelectedCountry(
                countries.find(c => c.code === e.target.value)!
              )
            }
            className="bg-neutral-800 border border-white/10 px-3 rounded-l"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.dialCode})
              </option>
            ))}
          </select>

          <input
            type="tel"
            value={form.telefono}
            onChange={(e) => handlePhoneChange(e.target.value)}
            maxLength={selectedCountry.maxLength}
            required
            placeholder="Número"
            className="flex-1 p-3 rounded-r bg-neutral-800 border border-white/10 focus:border-red-500 outline-none"
          />
        </div>
      </div>

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

      <button
        type="submit"
        className="w-full bg-red-600 hover:bg-red-700 transition p-3 rounded font-semibold"
      >
        Registrarse
      </button>
    </form>
  )
}