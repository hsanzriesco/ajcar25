"use client";

import { useState, useMemo } from "react";
import PhoneInput, { isValidPhoneNumber, Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";

// Definición de datos por país
const countriesData = [
  { name: "Afghanistan", iso2: "AF", dialCode: "+93", maxLength: 9 },
  { name: "Spain", iso2: "ES", dialCode: "+34", maxLength: 9 },
  { name: "Mexico", iso2: "MX", dialCode: "+52", maxLength: 10 },
  { name: "United States", iso2: "US", dialCode: "+1", maxLength: 10 },
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

  // Límite real de dígitos (para el mensaje informativo)
  const currentMaxLength = useMemo(() => {
    const found = countriesData.find((c) => c.iso2 === country);
    return found ? found.maxLength : 15; 
  }, [country]);

  // Límite técnico para el Input (evita el bloqueo por espacios/prefijo)
  // España: 9 dígitos + '+34 ' (4) + espacios (3 aprox) = 16. Usamos 20 para seguridad.
  const technicalMaxLength = currentMaxLength + 10;

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

    // Validación real usando la librería
    if (!phone || !isValidPhoneNumber(phone)) {
      setPhoneError("Número de teléfono no válido para el país seleccionado");
      return;
    }

    setPhoneError("");
    console.log("Datos enviados:", { ...form, telefono: phone });
    alert("Registro completado con éxito");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md text-white p-4">
      <h2 className="text-xl font-bold mb-4 text-center">Registro de Usuario</h2>
      
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
            className="w-full p-3 rounded bg-neutral-800 border border-white/10 focus:border-red-500 outline-none transition-all"
          />
        </div>
      ))}

      {/* Teléfono internacional */}
      <div>
        <label className="block text-sm mb-1">Número de Teléfono</label>
        <div className="bg-neutral-800 border border-white/10 rounded p-2 focus-within:border-red-500 transition-all">
          <PhoneInput
            defaultCountry="ES"
            value={phone}
            onChange={setPhone}
            onCountryChange={(c) => setCountry(c as Country)}
            international
            countryCallingCodeEditable={false}
            // MODIFICACIÓN CLAVE: Damos margen para que los espacios no bloqueen el teclado
            maxLength={technicalMaxLength}
            className="phone-input-custom"
          />
        </div>
        {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
        <p className="text-neutral-500 text-[10px] mt-1 italic">
          Máximo permitido para {country}: {currentMaxLength} dígitos (sin contar prefijo ni espacios).
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
            className="w-full p-3 rounded bg-neutral-800 border border-white/10 focus:border-red-500 outline-none transition-all"
          />
        </div>
      ))}

      <button
        type="submit"
        className="w-full bg-red-600 hover:bg-red-700 transition-colors p-3 rounded font-semibold mt-4 shadow-lg active:scale-[0.98]"
      >
        Registrarse
      </button>

      {/* Estilos para el componente PhoneInput */}
      <style jsx global>{`
        .phone-input-custom {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .phone-input-custom input {
          background: transparent;
          border: none;
          color: white;
          outline: none;
          width: 100%;
          font-size: 1rem;
        }
        /* Ajuste para que el selector de país se vea bien */
        .PhoneInputCountrySelect {
          cursor: pointer;
        }
        .PhoneInputCountryIcon {
          width: 24px;
          height: auto;
          box-shadow: 0 0 2px rgba(255,255,255,0.2);
        }
      `}</style>
    </form>
  );
}