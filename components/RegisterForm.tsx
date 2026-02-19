"use client"

import { useState } from "react"

type Country = "ES" | "FR" | "PT"

const countryData = {
  ES: {
    label: "España",
    prefix: "+34",
    regex: /^[6-9]\d{8}$/,
  },
  FR: {
    label: "Francia",
    prefix: "+33",
    regex: /^[1-9]\d{8}$/,
  },
  PT: {
    label: "Portugal",
    prefix: "+351",
    regex: /^[2-9]\d{8}$/,
  },
}

export default function RegisterForm() {
  const [country, setCountry] = useState<Country>("ES")

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

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    })
  }

  const handlePhoneChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "")
    setForm({ ...form, telefono: numericValue })
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    // Contraseñas
    if (form.password !== form.repeatPassword) {
      newErrors.repeatPassword = "Las contraseñas no coinciden"
    }

    if (form.password.length < 6) {
      newErrors.password = "La contraseña debe tener mínimo 6 caracteres"
    }

    // Teléfono
    if (!countryData[country].regex.test(form.telefono)) {
      newErrors.telefono =
        "Número no válido para " + countryData[country].label
    }

    // DNI básico (8 números + letra)
    const dniRegex = /^\d{8}[A-Za-z]$/
    if (!dniRegex.test(form.dni)) {
      newErrors.dni = "DNI/NIF no válido (Formato: 12345678A)"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const fullPhone = `${countryData[country].prefix}${form.telefono}`

    const finalData = {
      ...form,
      telefono: fullPhone,
    }

    console.log(finalData)

    alert("Registro válido ✅")
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 w-full max-w-md"
    >
      {/* CAMPOS BÁSICOS */}
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

          {errors[field.name] && (
            <p className="text-red-500 text-xs mt-1">
              {errors[field.name]}
            </p>
          )}
        </div>
      ))}

      {/* TELÉFONO CON SELECTOR */}
      <div>
        <label className="block text-sm mb-1">
          Número de Teléfono
        </label>

        <div className="flex">
          <select
            value={country}
            onChange={(e) => {
              setCountry(e.target.value as Country)
              setForm({ ...form, telefono: "" })
            }}
            className="bg-neutral-800 border border-white/10 px-3 py-2 rounded-l"
          >
            {Object.entries(countryData).map(([code, data]) => (
              <option key={code} value={code}>
                {data.label} ({data.prefix})
              </option>
            ))}
          </select>

          <input
            type="tel"
            value={form.telefono}
            onChange={(e) =>
              handlePhoneChange(e.target.value)
            }
            placeholder="Introduce tu número"
            maxLength={9}
            required
            className="flex-1 p-3 rounded-r bg-neutral-800 border border-white/10 focus:border-red-500 outline-none"
          />
        </div>

        {errors.telefono && (
          <p className="text-red-500 text-xs mt-1">
            {errors.telefono}
          </p>
        )}
      </div>

      {/* CONTRASEÑAS */}
      {[
        { label: "Contraseña", name: "password" },
        { label: "Repetir Contraseña", name: "repeatPassword" },
      ].map((field) => (
        <div key={field.name}>
          <label className="block text-sm mb-1">
            {field.label}
          </label>

          <input
            type="password"
            name={field.name}
            required
            onChange={handleChange}
            className="w-full p-3 rounded bg-neutral-800 border border-white/10 focus:border-red-500 outline-none"
          />

          {errors[field.name] && (
            <p className="text-red-500 text-xs mt-1">
              {errors[field.name]}
            </p>
          )}
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