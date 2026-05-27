"use client";

import { useState, useMemo, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import PhoneInput from "@/components/PhoneInput";

/* Componente reutilizable para inputs de contraseña con toggle de visibilidad.
   Se define fuera del componente padre para evitar que React lo desmonte y 
   remonte en cada render, lo que causaría pérdida de foco al escribir. */
const PasswordInput = ({
  name, label, show, onToggle, value, onChange, error,
}: {
  name: "password" | "repeatPassword";
  label: string;
  show: boolean;
  onToggle: () => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}) => (
  <div className="flex-1 min-w-0">
    <label className="block text-sm mb-1 text-gray-300">{label}</label>
    <div className="relative">
      <input
        name={name}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        className={`w-full p-3 rounded-xl bg-neutral-800 border outline-none text-white text-sm transition-colors pr-10 ${
          error ? "border-red-500" : "border-white/10 focus:border-red-500"
        }`}
        autoComplete="new-password"
      />
      {/* Botón que alterna entre mostrar y ocultar la contraseña */}
      <button type="button" onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-red-500 transition-colors p-1">
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  </div>
);

export default function RegisterForm() {
  const router = useRouter();

  /* Estados principales del formulario:
     - tipoRegistro: determina si el usuario es particular o empresa, 
       condicionando los campos visibles y las validaciones aplicadas.
     - loading/serverError: controlan el estado de la petición al servidor. */
  const [tipoRegistro, setTipoRegistro] = useState<"particular" | "empresa">("particular");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  /* Estado centralizado de los campos del formulario.
     Los campos nombreEmpresa y direccion solo aplican a empresas;
     nombre, apellido1 y apellido2 solo a particulares. */
  const [form, setForm] = useState({
    nombre: "", apellido1: "", apellido2: "", nombreEmpresa: "",
    direccion: "", dni: "", email: "", password: "", repeatPassword: "",
  });

  /* Estado del teléfono gestionado por separado porque el componente PhoneInput
     devuelve tres valores: el número local, si es válido, y el número completo
     con prefijo internacional. */
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phone, setPhone] = useState("");
  const [phoneValid, setPhoneValid] = useState(false);
  const [phoneFull, setPhoneFull] = useState("");

  /* Valida DNI, NIE o CIF según el tipo de registro:
     - Empresa: comprueba el formato de CIF español.
     - Particular: valida DNI (8 dígitos + letra) y NIE (X/Y/Z + 7 dígitos + letra)
       verificando también que la letra de control sea correcta mediante módulo 23. */
  const validateDocument = (value: string) => {
    const str = value.toUpperCase().trim();
    if (!str) return true;
    if (tipoRegistro === "empresa") {
      return /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/.test(str);
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

  /* Validación reactiva: se ejecuta en cada cambio de form, phone o tipoRegistro.
     Construye un objeto de errores solo con los campos que fallan, de forma que
     los mensajes de error aparecen y desaparecen en tiempo real mientras el usuario escribe. */
  useEffect(() => {
    const newErrors: Record<string, string> = {};
    if (form.dni && !validateDocument(form.dni))
      newErrors.dni = tipoRegistro === "particular" ? "DNI/NIE no válido" : "CIF no válido";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email))
      newErrors.email = "Email no válido";
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    if (form.password && !passwordRegex.test(form.password))
      newErrors.password = "Debe tener 8+ caracteres, mayúscula, número y símbolo";
    if (form.password && form.repeatPassword && form.password !== form.repeatPassword)
      newErrors.repeatPassword = "Las contraseñas no coinciden";
    if (phone && !phoneValid)
      newErrors.phone = "Teléfono incompleto o inválido";
    setErrors(newErrors);
  }, [form, phone, tipoRegistro]);

  /* Determina si el botón de envío debe estar deshabilitado.
     Comprueba tres condiciones: campos obligatorios vacíos (distintos según tipo
     de registro), existencia de errores de validación, y que el teléfono sea válido.
     useMemo evita recalcular en renders que no afectan a estas dependencias. */
  const isFormInvalid = useMemo(() => {
    const mandatoryFields = tipoRegistro === "particular"
      ? ["nombre", "apellido1", "dni", "email", "password", "repeatPassword"]
      : ["nombreEmpresa", "direccion", "dni", "email", "password", "repeatPassword"];
    const hasEmptyFields = mandatoryFields.some(key => !form[key as keyof typeof form]?.trim());
    const hasErrors = Object.keys(errors).length > 0;
    const isPhoneValid = phone.length > 0 && phoneValid;
    return hasEmptyFields || hasErrors || !isPhoneValid;
  }, [form, errors, phone, phoneValid, tipoRegistro]);

  /* Actualiza el campo correspondiente del estado form usando el atributo name
     del input como clave, evitando un handler específico por cada campo. */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* Envía el formulario a la API de registro.
     En caso de éxito redirige al login; en caso de error muestra el mensaje
     devuelto por el servidor o un mensaje genérico de conexión. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setServerError("");
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tipoRegistro, telefono: phoneFull }),
      });
      const data = await response.json();
      if (!response.ok) {
        setServerError(data.message || "Error al registrar usuario");
      } else {
        router.push("/login");
      }
    } catch (error) {
      setServerError("Error de conexión con el servidor.");
    } finally { setLoading(false); }
  };

  /* Helper que devuelve las clases del input aplicando borde rojo si existe
     un error asociado a esa clave, o el estilo neutro con foco rojo si no. */
  const inputClass = (errorKey?: string) =>
    `w-full p-3 rounded-xl bg-neutral-800 border outline-none text-white text-sm transition-colors ${
      errorKey && errors[errorKey] ? "border-red-500" : "border-white/10 focus:border-red-500"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">

      {/* Selector de tipo de cliente: cambia los campos visibles y las reglas
          de validación del documento de identidad (DNI/NIE vs CIF). */}
      <div>
        <label className="block text-sm mb-1 text-red-500 font-bold uppercase tracking-wider">Tipo de Cliente</label>
        <select value={tipoRegistro} onChange={(e) => setTipoRegistro(e.target.value as "particular" | "empresa")}
          className="w-full p-3 rounded-xl bg-neutral-800 border border-white/10 text-white outline-none focus:border-red-500 cursor-pointer text-sm">
          <option value="particular">Particular (DNI / NIE)</option>
          <option value="empresa">Empresa (CIF)</option>
        </select>
      </div>

      {/* Renderizado condicional según el tipo de registro:
          - Particular: nombre y dos apellidos.
          - Empresa: razón social y dirección fiscal. */}
      {tipoRegistro === "particular" ? (
        <>
          <div>
            <label className="block text-sm mb-1 text-gray-300">Nombre</label>
            <input name="nombre" value={form.nombre} onChange={handleChange}
              placeholder="Tu nombre" className={inputClass()} autoComplete="given-name" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
            <div className="flex-1">
              <label className="block text-sm mb-1 text-gray-300">Primer Apellido</label>
              <input name="apellido1" value={form.apellido1} onChange={handleChange}
                placeholder="Primer apellido" className={inputClass()} autoComplete="family-name" />
            </div>
            <div className="flex-1">
              <label className="block text-sm mb-1 text-gray-300">Segundo Apellido</label>
              <input name="apellido2" value={form.apellido2} onChange={handleChange}
                placeholder="Segundo apellido" className={inputClass()} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm mb-1 text-gray-300">Nombre de Empresa</label>
            <input name="nombreEmpresa" value={form.nombreEmpresa} onChange={handleChange}
              placeholder="Razón social" className={inputClass()} autoComplete="organization" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-300">Dirección Fiscal</label>
            <input name="direccion" value={form.direccion} onChange={handleChange}
              placeholder="Calle, número, ciudad..." className={inputClass()} autoComplete="street-address" />
          </div>
        </>
      )}

      {/* Campo de documento con label dinámico y mensaje de error inline. */}
      <div>
        <label className="block text-sm mb-1 text-gray-300">
          {tipoRegistro === "particular" ? "DNI / NIE" : "CIF"}
        </label>
        <input name="dni" value={form.dni} onChange={handleChange}
          placeholder={tipoRegistro === "particular" ? "12345678A" : "A12345678"}
          className={inputClass("dni")} />
        {errors.dni && <p className="text-red-500 text-[11px] mt-1">{errors.dni}</p>}
      </div>

      {/* Campo de email con validación de formato en tiempo real. */}
      <div>
        <label className="block text-sm mb-1 text-gray-300">Correo Electrónico</label>
        <input name="email" type="email" value={form.email} onChange={handleChange}
          placeholder="ejemplo@correo.com" className={inputClass("email")} autoComplete="email" />
        {errors.email && <p className="text-red-500 text-[11px] mt-1">{errors.email}</p>}
      </div>

      {/* Componente PhoneInput externo que gestiona el prefijo internacional.
          Devuelve el valor local, si es válido, y el número completo con prefijo. */}
      <div>
        <label className="block text-sm mb-1 text-gray-300">Número de Teléfono</label>
        <PhoneInput
          value={phone}
          onChange={(val, valid, full) => { setPhone(val); setPhoneValid(valid); setPhoneFull(full); }}
          error={errors.phone}
        />
      </div>

      {/* Dos campos de contraseña en fila con toggle de visibilidad independiente.
          Los errores se muestran debajo del bloque para no romper el layout. */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
        <PasswordInput
          name="password" label="Contraseña"
          show={showPassword} onToggle={() => setShowPassword(p => !p)}
          value={form.password} onChange={handleChange}
          error={errors.password}
        />
        <PasswordInput
          name="repeatPassword" label="Repetir Contraseña"
          show={showRepeatPassword} onToggle={() => setShowRepeatPassword(p => !p)}
          value={form.repeatPassword} onChange={handleChange}
          error={errors.repeatPassword}
        />
      </div>
      {errors.password && <p className="text-red-500 text-[11px] -mt-2">{errors.password}</p>}
      {errors.repeatPassword && <p className="text-red-500 text-[11px] -mt-2">{errors.repeatPassword}</p>}

      {/* Mensaje de error devuelto por el servidor, visible solo si existe. */}
      {serverError && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-xl text-sm text-center">
          {serverError}
        </div>
      )}

      {/* Botón de envío deshabilitado mientras el formulario sea inválido o esté cargando.
          El estilo cambia visualmente para reflejar el estado de disponibilidad. */}
      <button type="submit" disabled={isFormInvalid || loading}
        className={`w-full p-3 sm:p-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all ${
          isFormInvalid || loading
            ? "bg-gray-600 opacity-50 cursor-not-allowed text-gray-400"
            : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 active:scale-[0.98]"
        }`}>
        {loading ? "Registrando..." : "Registrarse"}
      </button>
    </form>
  );
}