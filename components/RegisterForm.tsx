"use client";

import { useState, useMemo, useEffect } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { CountryCode } from "libphonenumber-js";
import countries from "@/data/countries-full.json";
// Importamos los iconos necesarios
import { Eye, EyeOff } from "lucide-react";

export default function RegisterForm() {
  const [tipoRegistro, setTipoRegistro] = useState<"particular" | "empresa">("particular");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // Estados para controlar la visibilidad de las contraseñas
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    apellido1: "",
    apellido2: "",
    nombreEmpresa: "",
    direccion: "",
    dni: "",
    email: "",
    password: "",
    repeatPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phone, setPhone] = useState<string | undefined>();
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>("ES");

  const countryData = useMemo(() => {
    const match = countries.find((c) => c.iso2 === selectedCountry);
    return {
      maxLength: match ? match.maxLength : 15,
      dialCode: match ? match.dialCode : "+34"
    };
  }, [selectedCountry]);

  const [maxInputLength, setMaxInputLength] = useState(countryData.maxLength + 5);

  const validateDocument = (value: string) => {
    const str = value.toUpperCase().trim();
    if (!str) return true;

    if (tipoRegistro === "empresa") {
      const cifRegex = /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/;
      return cifRegex.test(str);
    }

    const validChars = "TRWAGMYFPDXBNJZSQVHLCKE";
    const dniRegex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;
    const nieRegex = /^[XYZ][0-9]{7}[TRWAGMYFPDXBNJZSQVHLCKE]$/i;

    if (!dniRegex.test(str) && !nieRegex.test(str)) return false;

    let tempStr = str.replace('X', '0').replace('Y', '1').replace('Z', '2');
    const letter = str.charAt(8);
    const number = parseInt(tempStr.substring(0, 8));
    return letter === validChars.charAt(number % 23);
  };

  useEffect(() => {
    const newErrors: Record<string, string> = {};

    if (form.dni && !validateDocument(form.dni)) {
      newErrors.dni = tipoRegistro === "particular" ? "DNI/NIE no válido" : "CIF no válido";
    }

    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Email no válido";
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;

    if (form.password && !passwordRegex.test(form.password)) {
      newErrors.password = "Debe tener 8+ caracteres, mayúscula, número y símbolo";
    }

    if (form.password && form.repeatPassword && form.password !== form.repeatPassword) {
      newErrors.repeatPassword = "Las contraseñas no coinciden";
    }

    if (phone && !isValidPhoneNumber(phone)) {
      newErrors.phone = "Teléfono incompleto o inválido";
    }

    setErrors(newErrors);
  }, [form, phone, tipoRegistro]);

  const isFormInvalid = useMemo(() => {
    const mandatoryFields = tipoRegistro === "particular"
      ? ["nombre", "apellido1", "dni", "email", "password", "repeatPassword"]
      : ["nombreEmpresa", "direccion", "dni", "email", "password", "repeatPassword"];

    const hasEmptyFields = mandatoryFields.some(key => !form[key as keyof typeof form]?.trim());
    const hasErrors = Object.keys(errors).length > 0;
    const isPhoneValid = phone && isValidPhoneNumber(phone);

    return hasEmptyFields || hasErrors || !isPhoneValid;
  }, [form, errors, phone, tipoRegistro]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setServerError("");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tipoRegistro,
          telefono: phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setServerError(data.message || "Error al registrar usuario");
      } else {
        alert("¡Registro exitoso!");
      }
    } catch (error) {
      setServerError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      {/* SELECTOR DE TIPO */}
      <div>
        <label className="block text-sm mb-1 text-red-500 font-bold uppercase tracking-wider">Tipo de Cliente</label>
        <select
          value={tipoRegistro}
          onChange={(e) => setTipoRegistro(e.target.value as "particular" | "empresa")}
          className="w-full p-3 rounded bg-neutral-800 border border-white/10 text-white outline-none focus:border-red-500 cursor-pointer"
        >
          <option value="particular">Particular (DNI / NIE)</option>
          <option value="empresa">Empresa (CIF)</option>
        </select>
      </div>

      {/* CAMPOS DINÁMICOS */}
      {tipoRegistro === "particular" ? (
        <>
          <div>
            <label className="block text-sm mb-1">Nombre</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} className="w-full p-3 rounded bg-neutral-800 border border-white/10 outline-none focus:border-red-500 text-white" />
          </div>
          <div className="flex gap-2">
            <div className="w-1/2">
              <label className="block text-sm mb-1">Primer Apellido</label>
              <input name="apellido1" value={form.apellido1} onChange={handleChange} className="w-full p-3 rounded bg-neutral-800 border border-white/10 outline-none focus:border-red-500 text-white" />
            </div>
            <div className="w-1/2">
              <label className="block text-sm mb-1">Segundo Apellido</label>
              <input name="apellido2" value={form.apellido2} onChange={handleChange} className="w-full p-3 rounded bg-neutral-800 border border-white/10 outline-none focus:border-red-500 text-white" />
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm mb-1">Nombre de Empresa</label>
            <input name="nombreEmpresa" value={form.nombreEmpresa} onChange={handleChange} className="w-full p-3 rounded bg-neutral-800 border border-white/10 outline-none focus:border-red-500 text-white" />
          </div>
          <div>
            <label className="block text-sm mb-1">Dirección Fiscal</label>
            <input name="direccion" value={form.direccion} onChange={handleChange} className="w-full p-3 rounded bg-neutral-800 border border-white/10 outline-none focus:border-red-500 text-white" />
          </div>
        </>
      )}

      {/* DOCUMENTO IDENTIDAD */}
      <div>
        <label className="block text-sm mb-1">{tipoRegistro === "particular" ? "DNI / NIE" : "CIF"}</label>
        <input
          name="dni"
          value={form.dni}
          onChange={handleChange}
          placeholder={tipoRegistro === "particular" ? "12345678A" : "A12345678"}
          className={`w-full p-3 rounded bg-neutral-800 border outline-none text-white ${errors.dni ? "border-red-500" : "border-white/10 focus:border-red-500"}`}
        />
        {errors.dni && <p className="text-red-500 text-[11px] mt-1">{errors.dni}</p>}
      </div>

      {/* EMAIL */}
      <div>
        <label className="block text-sm mb-1">Correo Electrónico</label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          className={`w-full p-3 rounded bg-neutral-800 border outline-none text-white ${errors.email ? "border-red-500" : "border-white/10 focus:border-red-500"}`}
        />
        {errors.email && <p className="text-red-500 text-[11px] mt-1">{errors.email}</p>}
      </div>

      {/* TELÉFONO */}
      <div>
        <label className="block text-sm mb-1">Número de Teléfono</label>
        <div className={`bg-neutral-800 border rounded p-2 focus-within:border-red-500 ${errors.phone ? "border-red-500" : "border-white/10"}`}>
          <PhoneInput
            defaultCountry="ES"
            value={phone}
            onChange={setPhone}
            onKeyUp={(e: any) => {
              const value = e.currentTarget.value;
              const formatCount = (value.match(/[ -]/g) || []).length;
              setMaxInputLength(countryData.maxLength + countryData.dialCode.length + formatCount);
            }}
            onCountryChange={(c) => c && setSelectedCountry(c as CountryCode)}
            international
            className="text-white"
            numberInputProps={{ maxLength: maxInputLength, className: "bg-transparent outline-none w-full ml-2 text-white" }}
          />
        </div>
        {errors.phone && <p className="text-red-500 text-[11px] mt-1">{errors.phone}</p>}
      </div>

      {/* SECCIÓN DE CONTRASEÑAS MODIFICADA */}
      <div className="flex gap-2">
        {/* Input Password */}
        <div className="w-1/2">
          <label className="block text-sm mb-1">Contraseña</label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              className={`w-full p-3 pr-10 rounded bg-neutral-800 border outline-none text-white transition-all ${errors.password ? "border-red-500" : "border-white/10 focus:border-red-500"}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-red-500 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Input Repeat Password */}
        <div className="w-1/2">
          <label className="block text-sm mb-1">Repetir Contraseña</label>
          <div className="relative">
            <input
              name="repeatPassword"
              type={showRepeatPassword ? "text" : "password"}
              value={form.repeatPassword}
              onChange={handleChange}
              className={`w-full p-3 pr-10 rounded bg-neutral-800 border outline-none text-white transition-all ${errors.repeatPassword ? "border-red-500" : "border-white/10 focus:border-red-500"}`}
            />
            <button
              type="button"
              onClick={() => setShowRepeatPassword(!showRepeatPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-red-500 transition-colors"
            >
              {showRepeatPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>

      {errors.password && <p className="text-red-500 text-[11px] mt-1">{errors.password}</p>}
      {errors.repeatPassword && <p className="text-red-500 text-[11px] mt-1">{errors.repeatPassword}</p>}

      {/* ERROR DEL SERVIDOR */}
      {serverError && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded text-sm text-center">
          {serverError}
        </div>
      )}

      <button
        type="submit"
        disabled={isFormInvalid || loading}
        className={`w-full p-3 rounded font-semibold transition-all ${isFormInvalid || loading
            ? "bg-gray-600 opacity-50 cursor-not-allowed"
            : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20"
          }`}
      >
        {loading ? "Registrando..." : "Registrarse"}
      </button>
    </form>
  );
}