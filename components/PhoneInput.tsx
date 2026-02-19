"use client"

import { useState } from "react"

type Country = "ES" | "FR" | "PT"

const countryData = {
  ES: {
    label: "España",
    prefix: "+34",
    regex: /^[6-9]\d{8}$/, // 9 dígitos, empieza por 6-9
  },
  FR: {
    label: "Francia",
    prefix: "+33",
    regex: /^[1-9]\d{8}$/, // 9 dígitos (sin el 0 inicial)
  },
  PT: {
    label: "Portugal",
    prefix: "+351",
    regex: /^[2-9]\d{8}$/, // 9 dígitos
  },
}

export default function PhoneInput() {
  const [country, setCountry] = useState<Country>("ES")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")

  const handlePhoneChange = (value: string) => {
    // Solo números
    const numericValue = value.replace(/\D/g, "")
    setPhone(numericValue)

    // Validación
    const isValid = countryData[country].regex.test(numericValue)

    if (numericValue.length === 0) {
      setError("")
    } else if (!isValid) {
      setError("Número no válido para " + countryData[country].label)
    } else {
      setError("")
    }
  }

  return (
    <div className="w-full">
      <label className="block mb-2 text-sm font-medium">
        Número de teléfono
      </label>

      <div className="flex">
        {/* Selector país */}
        <select
          value={country}
          onChange={(e) => {
            setCountry(e.target.value as Country)
            setPhone("")
            setError("")
          }}
          className="bg-gray-800 border border-gray-700 px-3 py-2 text-sm rounded-l-md"
        >
          {Object.entries(countryData).map(([code, data]) => (
            <option key={code} value={code}>
              {data.label} ({data.prefix})
            </option>
          ))}
        </select>

        {/* Input teléfono */}
        <input
          type="tel"
          value={phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder="Introduce tu número"
          className="flex-1 bg-gray-900 border border-gray-700 px-4 py-2 text-sm rounded-r-md focus:outline-none focus:border-red-600"
          maxLength={9}
        />
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  )
}