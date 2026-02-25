"use client";

import { useState, useMemo } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { CountryCode } from "libphonenumber-js";
import countries from "@/data/countries-full.json"; 
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";

export default function RegisterForm() {
const [form, setForm] = useState({
   nombre: "",
   apellido1: "",
   apellido2: "",
   dni: "",
   email: "",
   password: "",
   repeatPassword: "",
 });

const [phone, setPhone] = useState<string | undefined>();
const [phoneError, setPhoneError] = useState("");

//Estado para controlar el pais por defecto y el que seleccione el usuario, inicializado con España (ES)
const [selectedCountry, setSelectedCountry] = useState<CountryCode>("ES");
//control del prefijo del pais seleccionado
let prefix = countries.find(c => c.iso2 === selectedCountry)?.dialCode;

//funcion para rescate del maxLenght del pais seleccionado
const dynamicMaxLength = useMemo(() => {
   const countryMatch = countries.find((c) => c.iso2 === selectedCountry);
   return countryMatch ? countryMatch.maxLength : 15;
 }, [selectedCountry]);
let totalLength = dynamicMaxLength + (prefix?.length || 0)
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
   setForm({ ...form, [e.target.name]: e.target.value });
 };

//estado para el control del maxLength del input, inicializado con el valor del pais por defecto (España) + la longitud de su prefijo
const [maxInputLength, setMaxInputLength] = useState(
   dynamicMaxLength + (prefix?.length || 0)
 );

const handleSubmit = (e: React.FormEvent) => {
   e.preventDefault();

   if (form.password !== form.repeatPassword) {
     alert("Las contraseñas no coinciden");
     return;
   }

   if (!phone || !isValidPhoneNumber(phone)) {
     setPhoneError("Número de teléfono no válido");
     return;
   }

   setPhoneError("");
   console.log({ ...form, telefono: phone });
 };

return (
   <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
     {[
       { label: "Nombre", name: "nombre" },
       { label: "Primer Apellido", name: "apellido1" },
       { label: "Segundo Apellido", name: "apellido2" },
       { label: "DNI/NIF", name: "dni" },
       { label: "Correo Electrónico", name: "email", type: "email" },
     ].map((field) => (
       <div key={field.name}>
         <label className="block text-sm mb-1">{field.label}</label>
         <input
           type={field.type || "text"}
           name={field.name}
           required
           onChange={handleChange}
           className="w-full p-3 rounded bg-neutral-800 border border-white/10 focus:border-red-500 outline-none"
         />
       </div>
     ))}

     {/* TELÉFONO CON LÓGICA DE MAXLENGTH */}
     <div>
       
       
       <label className="block text-sm mb-1">Número de Teléfono</label>
       <div className="bg-neutral-800 border border-white/10 rounded p-2 focus-within:border-red-500">
         <PhoneInput
           defaultCountry="ES"
           value={phone}
           onChange={setPhone}

           /*
             controlamos cada vez que se aprieta una tecla para ectualizar en tiempo real el maxLength
             del input del componente PhoneInput, 
             sin contar los espacios o guines que se añadan por el formato del numero 
           */
           onKeyUp={(e:any) => {
             const value = e.currentTarget.value;

             const spaces = (value.match(/ /g) || []).length;
             const dashes = (value.match(/-/g) || []).length;
             const formattingCount = spaces + dashes;

             const newLength =
               dynamicMaxLength +
               (prefix?.length || 0) +
               formattingCount;

             setMaxInputLength(newLength);
           }}

           /* 
             controlamos los cambios de pais que pueda realizar el usuario
             y modificamos los datos tanto del pais como de su prefijo
           */
           onCountryChange={(country) => {
             let prefix = countries.find(c => c.iso2 === country)?.dialCode;
             if (country) setSelectedCountry(country as CountryCode);
             
           }}
           international
           countryCallingCodeEditable={false}
           className="text-white"
           // Pasamos el maxLength al input interno
           numberInputProps={{
             maxLength: maxInputLength,
             className: "bg-transparent outline-none w-full ml-2"
           }}
         />
       </div>
       <p className="text-[10px] text-neutral-500 mt-1 uppercase">
         Límite para {selectedCountry}: {dynamicMaxLength} dígitos
       </p>

       {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
     </div>

     {[
       { label: "Contraseña", name: "password", type: "password" },
       { label: "Repetir Contraseña", name: "repeatPassword", type: "password" },
     ].map((field) => (
       <div key={field.name}>
         <label className="block text-sm mb-1">{field.label}</label>
         <input
           type={field.type}
           name={field.name}
           required
           onChange={handleChange}
           className="w-full p-3 rounded bg-neutral-800 border border-white/10 focus:border-red-500 outline-none"
         />
       </div>
     ))}

     <button
       type="submit"
       className="w-full bg-red-600 hover:bg-red-700 transition p-3 rounded font-semibold"
     >
       Registrarse
     </button>
   </form>
 );
}