"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

/* Tipado del objeto país. Cada entrada incluye el código ISO2, nombre legible,
   emoji de bandera, prefijo internacional y longitud máxima del número local. */
export interface Country {
  code: string;
  name: string;
  flag: string;
  prefix: string;
  maxLength: number;
}

/* Lista completa de países con sus datos de telefonía. Se exporta para poder
   reutilizarse en otros componentes que necesiten el catálogo de prefijos. */
export const COUNTRIES: Country[] = [
  { code: "AF", name: "Afganistán", flag: "🇦🇫", prefix: "+93", maxLength: 9 },
  { code: "AL", name: "Albania", flag: "🇦🇱", prefix: "+355", maxLength: 9 },
  { code: "DZ", name: "Argelia", flag: "🇩🇿", prefix: "+213", maxLength: 9 },
  { code: "AD", name: "Andorra", flag: "🇦🇩", prefix: "+376", maxLength: 6 },
  { code: "AO", name: "Angola", flag: "🇦🇴", prefix: "+244", maxLength: 9 },
  { code: "AG", name: "Antigua y Barbuda", flag: "🇦🇬", prefix: "+1268", maxLength: 7 },
  { code: "AR", name: "Argentina", flag: "🇦🇷", prefix: "+54", maxLength: 10 },
  { code: "AM", name: "Armenia", flag: "🇦🇲", prefix: "+374", maxLength: 8 },
  { code: "AU", name: "Australia", flag: "🇦🇺", prefix: "+61", maxLength: 9 },
  { code: "AT", name: "Austria", flag: "🇦🇹", prefix: "+43", maxLength: 11 },
  { code: "AZ", name: "Azerbaiyán", flag: "🇦🇿", prefix: "+994", maxLength: 9 },
  { code: "BS", name: "Bahamas", flag: "🇧🇸", prefix: "+1242", maxLength: 7 },
  { code: "BH", name: "Baréin", flag: "🇧🇭", prefix: "+973", maxLength: 8 },
  { code: "BD", name: "Bangladés", flag: "🇧🇩", prefix: "+880", maxLength: 10 },
  { code: "BB", name: "Barbados", flag: "🇧🇧", prefix: "+1246", maxLength: 7 },
  { code: "BY", name: "Bielorrusia", flag: "🇧🇾", prefix: "+375", maxLength: 10 },
  { code: "BE", name: "Bélgica", flag: "🇧🇪", prefix: "+32", maxLength: 9 },
  { code: "BZ", name: "Belice", flag: "🇧🇿", prefix: "+501", maxLength: 7 },
  { code: "BJ", name: "Benín", flag: "🇧🇯", prefix: "+229", maxLength: 8 },
  { code: "BT", name: "Bután", flag: "🇧🇹", prefix: "+975", maxLength: 8 },
  { code: "BO", name: "Bolivia", flag: "🇧🇴", prefix: "+591", maxLength: 8 },
  { code: "BA", name: "Bosnia y Herzegovina", flag: "🇧🇦", prefix: "+387", maxLength: 8 },
  { code: "BW", name: "Botsuana", flag: "🇧🇼", prefix: "+267", maxLength: 7 },
  { code: "BR", name: "Brasil", flag: "🇧🇷", prefix: "+55", maxLength: 11 },
  { code: "BN", name: "Brunéi", flag: "🇧🇳", prefix: "+673", maxLength: 7 },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬", prefix: "+359", maxLength: 9 },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", prefix: "+226", maxLength: 8 },
  { code: "BI", name: "Burundi", flag: "🇧🇮", prefix: "+257", maxLength: 8 },
  { code: "CV", name: "Cabo Verde", flag: "🇨🇻", prefix: "+238", maxLength: 7 },
  { code: "KH", name: "Camboya", flag: "🇰🇭", prefix: "+855", maxLength: 9 },
  { code: "CM", name: "Camerún", flag: "🇨🇲", prefix: "+237", maxLength: 9 },
  { code: "CA", name: "Canadá", flag: "🇨🇦", prefix: "+1", maxLength: 10 },
  { code: "CF", name: "República Centroafricana", flag: "🇨🇫", prefix: "+236", maxLength: 8 },
  { code: "TD", name: "Chad", flag: "🇹🇩", prefix: "+235", maxLength: 8 },
  { code: "CL", name: "Chile", flag: "🇨🇱", prefix: "+56", maxLength: 9 },
  { code: "CN", name: "China", flag: "🇨🇳", prefix: "+86", maxLength: 11 },
  { code: "CO", name: "Colombia", flag: "🇨🇴", prefix: "+57", maxLength: 10 },
  { code: "KM", name: "Comoras", flag: "🇰🇲", prefix: "+269", maxLength: 7 },
  { code: "CG", name: "Congo", flag: "🇨🇬", prefix: "+242", maxLength: 9 },
  { code: "CD", name: "Congo (RDC)", flag: "🇨🇩", prefix: "+243", maxLength: 9 },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", prefix: "+506", maxLength: 8 },
  { code: "HR", name: "Croacia", flag: "🇭🇷", prefix: "+385", maxLength: 9 },
  { code: "CU", name: "Cuba", flag: "🇨🇺", prefix: "+53", maxLength: 8 },
  { code: "CY", name: "Chipre", flag: "🇨🇾", prefix: "+357", maxLength: 8 },
  { code: "CZ", name: "Chequia", flag: "🇨🇿", prefix: "+420", maxLength: 9 },
  { code: "DK", name: "Dinamarca", flag: "🇩🇰", prefix: "+45", maxLength: 8 },
  { code: "DJ", name: "Yibuti", flag: "🇩🇯", prefix: "+253", maxLength: 8 },
  { code: "DM", name: "Dominica", flag: "🇩🇲", prefix: "+1767", maxLength: 7 },
  { code: "DO", name: "República Dominicana", flag: "🇩🇴", prefix: "+1809", maxLength: 10 },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", prefix: "+593", maxLength: 9 },
  { code: "EG", name: "Egipto", flag: "🇪🇬", prefix: "+20", maxLength: 10 },
  { code: "SV", name: "El Salvador", flag: "🇸🇻", prefix: "+503", maxLength: 8 },
  { code: "GQ", name: "Guinea Ecuatorial", flag: "🇬🇶", prefix: "+240", maxLength: 9 },
  { code: "ER", name: "Eritrea", flag: "🇪🇷", prefix: "+291", maxLength: 7 },
  { code: "EE", name: "Estonia", flag: "🇪🇪", prefix: "+372", maxLength: 8 },
  { code: "SZ", name: "Esuatini", flag: "🇸🇿", prefix: "+268", maxLength: 8 },
  { code: "ET", name: "Etiopía", flag: "🇪🇹", prefix: "+251", maxLength: 9 },
  { code: "FJ", name: "Fiyi", flag: "🇫🇯", prefix: "+679", maxLength: 7 },
  { code: "FI", name: "Finlandia", flag: "🇫🇮", prefix: "+358", maxLength: 10 },
  { code: "FR", name: "Francia", flag: "🇫🇷", prefix: "+33", maxLength: 9 },
  { code: "GA", name: "Gabón", flag: "🇬🇦", prefix: "+241", maxLength: 8 },
  { code: "GM", name: "Gambia", flag: "🇬🇲", prefix: "+220", maxLength: 7 },
  { code: "GE", name: "Georgia", flag: "🇬🇪", prefix: "+995", maxLength: 9 },
  { code: "DE", name: "Alemania", flag: "🇩🇪", prefix: "+49", maxLength: 11 },
  { code: "GH", name: "Ghana", flag: "🇬🇭", prefix: "+233", maxLength: 9 },
  { code: "GR", name: "Grecia", flag: "🇬🇷", prefix: "+30", maxLength: 10 },
  { code: "GD", name: "Granada", flag: "🇬🇩", prefix: "+1473", maxLength: 7 },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", prefix: "+502", maxLength: 8 },
  { code: "GN", name: "Guinea", flag: "🇬🇳", prefix: "+224", maxLength: 9 },
  { code: "GW", name: "Guinea-Bisáu", flag: "🇬🇼", prefix: "+245", maxLength: 7 },
  { code: "GY", name: "Guyana", flag: "🇬🇾", prefix: "+592", maxLength: 7 },
  { code: "HT", name: "Haití", flag: "🇭🇹", prefix: "+509", maxLength: 8 },
  { code: "HN", name: "Honduras", flag: "🇭🇳", prefix: "+504", maxLength: 8 },
  { code: "HU", name: "Hungría", flag: "🇭🇺", prefix: "+36", maxLength: 9 },
  { code: "IS", name: "Islandia", flag: "🇮🇸", prefix: "+354", maxLength: 7 },
  { code: "IN", name: "India", flag: "🇮🇳", prefix: "+91", maxLength: 10 },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", prefix: "+62", maxLength: 12 },
  { code: "IR", name: "Irán", flag: "🇮🇷", prefix: "+98", maxLength: 10 },
  { code: "IQ", name: "Irak", flag: "🇮🇶", prefix: "+964", maxLength: 10 },
  { code: "IE", name: "Irlanda", flag: "🇮🇪", prefix: "+353", maxLength: 9 },
  { code: "IL", name: "Israel", flag: "🇮🇱", prefix: "+972", maxLength: 9 },
  { code: "IT", name: "Italia", flag: "🇮🇹", prefix: "+39", maxLength: 10 },
  { code: "JM", name: "Jamaica", flag: "🇯🇲", prefix: "+1876", maxLength: 7 },
  { code: "JP", name: "Japón", flag: "🇯🇵", prefix: "+81", maxLength: 11 },
  { code: "JO", name: "Jordania", flag: "🇯🇴", prefix: "+962", maxLength: 9 },
  { code: "KZ", name: "Kazajistán", flag: "🇰🇿", prefix: "+7", maxLength: 10 },
  { code: "KE", name: "Kenia", flag: "🇰🇪", prefix: "+254", maxLength: 9 },
  { code: "KI", name: "Kiribati", flag: "🇰🇮", prefix: "+686", maxLength: 8 },
  { code: "KP", name: "Corea del Norte", flag: "🇰🇵", prefix: "+850", maxLength: 10 },
  { code: "KR", name: "Corea del Sur", flag: "🇰🇷", prefix: "+82", maxLength: 10 },
  { code: "KW", name: "Kuwait", flag: "🇰🇼", prefix: "+965", maxLength: 8 },
  { code: "KG", name: "Kirguistán", flag: "🇰🇬", prefix: "+996", maxLength: 9 },
  { code: "LA", name: "Laos", flag: "🇱🇦", prefix: "+856", maxLength: 10 },
  { code: "LV", name: "Letonia", flag: "🇱🇻", prefix: "+371", maxLength: 8 },
  { code: "LB", name: "Líbano", flag: "🇱🇧", prefix: "+961", maxLength: 8 },
  { code: "LS", name: "Lesoto", flag: "🇱🇸", prefix: "+266", maxLength: 8 },
  { code: "LR", name: "Liberia", flag: "🇱🇷", prefix: "+231", maxLength: 8 },
  { code: "LY", name: "Libia", flag: "🇱🇾", prefix: "+218", maxLength: 9 },
  { code: "LI", name: "Liechtenstein", flag: "🇱🇮", prefix: "+423", maxLength: 7 },
  { code: "LT", name: "Lituania", flag: "🇱🇹", prefix: "+370", maxLength: 8 },
  { code: "LU", name: "Luxemburgo", flag: "🇱🇺", prefix: "+352", maxLength: 9 },
  { code: "MG", name: "Madagascar", flag: "🇲🇬", prefix: "+261", maxLength: 9 },
  { code: "MW", name: "Malaui", flag: "🇲🇼", prefix: "+265", maxLength: 9 },
  { code: "MY", name: "Malasia", flag: "🇲🇾", prefix: "+60", maxLength: 10 },
  { code: "MV", name: "Maldivas", flag: "🇲🇻", prefix: "+960", maxLength: 7 },
  { code: "ML", name: "Malí", flag: "🇲🇱", prefix: "+223", maxLength: 8 },
  { code: "MT", name: "Malta", flag: "🇲🇹", prefix: "+356", maxLength: 8 },
  { code: "MH", name: "Islas Marshall", flag: "🇲🇭", prefix: "+692", maxLength: 7 },
  { code: "MR", name: "Mauritania", flag: "🇲🇷", prefix: "+222", maxLength: 8 },
  { code: "MU", name: "Mauricio", flag: "🇲🇺", prefix: "+230", maxLength: 8 },
  { code: "MX", name: "México", flag: "🇲🇽", prefix: "+52", maxLength: 10 },
  { code: "FM", name: "Micronesia", flag: "🇫🇲", prefix: "+691", maxLength: 7 },
  { code: "MD", name: "Moldavia", flag: "🇲🇩", prefix: "+373", maxLength: 8 },
  { code: "MC", name: "Mónaco", flag: "🇲🇨", prefix: "+377", maxLength: 8 },
  { code: "MN", name: "Mongolia", flag: "🇲🇳", prefix: "+976", maxLength: 8 },
  { code: "ME", name: "Montenegro", flag: "🇲🇪", prefix: "+382", maxLength: 8 },
  { code: "MA", name: "Marruecos", flag: "🇲🇦", prefix: "+212", maxLength: 9 },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿", prefix: "+258", maxLength: 9 },
  { code: "MM", name: "Myanmar", flag: "🇲🇲", prefix: "+95", maxLength: 10 },
  { code: "NA", name: "Namibia", flag: "🇳🇦", prefix: "+264", maxLength: 9 },
  { code: "NR", name: "Nauru", flag: "🇳🇷", prefix: "+674", maxLength: 7 },
  { code: "NP", name: "Nepal", flag: "🇳🇵", prefix: "+977", maxLength: 10 },
  { code: "NL", name: "Países Bajos", flag: "🇳🇱", prefix: "+31", maxLength: 9 },
  { code: "NZ", name: "Nueva Zelanda", flag: "🇳🇿", prefix: "+64", maxLength: 9 },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮", prefix: "+505", maxLength: 8 },
  { code: "NE", name: "Níger", flag: "🇳🇪", prefix: "+227", maxLength: 8 },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", prefix: "+234", maxLength: 10 },
  { code: "MK", name: "Macedonia del Norte", flag: "🇲🇰", prefix: "+389", maxLength: 8 },
  { code: "NO", name: "Noruega", flag: "🇳🇴", prefix: "+47", maxLength: 8 },
  { code: "OM", name: "Omán", flag: "🇴🇲", prefix: "+968", maxLength: 8 },
  { code: "PK", name: "Pakistán", flag: "🇵🇰", prefix: "+92", maxLength: 10 },
  { code: "PW", name: "Palaos", flag: "🇵🇼", prefix: "+680", maxLength: 7 },
  { code: "PA", name: "Panamá", flag: "🇵🇦", prefix: "+507", maxLength: 8 },
  { code: "PG", name: "Papúa Nueva Guinea", flag: "🇵🇬", prefix: "+675", maxLength: 8 },
  { code: "PY", name: "Paraguay", flag: "🇵🇾", prefix: "+595", maxLength: 9 },
  { code: "PE", name: "Perú", flag: "🇵🇪", prefix: "+51", maxLength: 9 },
  { code: "PH", name: "Filipinas", flag: "🇵🇭", prefix: "+63", maxLength: 10 },
  { code: "PL", name: "Polonia", flag: "🇵🇱", prefix: "+48", maxLength: 9 },
  { code: "PT", name: "Portugal", flag: "🇵🇹", prefix: "+351", maxLength: 9 },
  { code: "QA", name: "Catar", flag: "🇶🇦", prefix: "+974", maxLength: 8 },
  { code: "RO", name: "Rumanía", flag: "🇷🇴", prefix: "+40", maxLength: 9 },
  { code: "RU", name: "Rusia", flag: "🇷🇺", prefix: "+7", maxLength: 10 },
  { code: "RW", name: "Ruanda", flag: "🇷🇼", prefix: "+250", maxLength: 9 },
  { code: "KN", name: "San Cristóbal y Nieves", flag: "🇰🇳", prefix: "+1869", maxLength: 7 },
  { code: "LC", name: "Santa Lucía", flag: "🇱🇨", prefix: "+1758", maxLength: 7 },
  { code: "VC", name: "San Vicente y las Granadinas", flag: "🇻🇨", prefix: "+1784", maxLength: 7 },
  { code: "WS", name: "Samoa", flag: "🇼🇸", prefix: "+685", maxLength: 7 },
  { code: "SM", name: "San Marino", flag: "🇸🇲", prefix: "+378", maxLength: 10 },
  { code: "ST", name: "Santo Tomé y Príncipe", flag: "🇸🇹", prefix: "+239", maxLength: 7 },
  { code: "SA", name: "Arabia Saudí", flag: "🇸🇦", prefix: "+966", maxLength: 9 },
  { code: "SN", name: "Senegal", flag: "🇸🇳", prefix: "+221", maxLength: 9 },
  { code: "RS", name: "Serbia", flag: "🇷🇸", prefix: "+381", maxLength: 9 },
  { code: "SC", name: "Seychelles", flag: "🇸🇨", prefix: "+248", maxLength: 7 },
  { code: "SL", name: "Sierra Leona", flag: "🇸🇱", prefix: "+232", maxLength: 8 },
  { code: "SG", name: "Singapur", flag: "🇸🇬", prefix: "+65", maxLength: 8 },
  { code: "SK", name: "Eslovaquia", flag: "🇸🇰", prefix: "+421", maxLength: 9 },
  { code: "SI", name: "Eslovenia", flag: "🇸🇮", prefix: "+386", maxLength: 8 },
  { code: "SB", name: "Islas Salomón", flag: "🇸🇧", prefix: "+677", maxLength: 7 },
  { code: "SO", name: "Somalia", flag: "🇸🇴", prefix: "+252", maxLength: 9 },
  { code: "ZA", name: "Sudáfrica", flag: "🇿🇦", prefix: "+27", maxLength: 9 },
  { code: "SS", name: "Sudán del Sur", flag: "🇸🇸", prefix: "+211", maxLength: 9 },
  { code: "ES", name: "España", flag: "🇪🇸", prefix: "+34", maxLength: 9 },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰", prefix: "+94", maxLength: 9 },
  { code: "SD", name: "Sudán", flag: "🇸🇩", prefix: "+249", maxLength: 9 },
  { code: "SR", name: "Surinam", flag: "🇸🇷", prefix: "+597", maxLength: 7 },
  { code: "SE", name: "Suecia", flag: "🇸🇪", prefix: "+46", maxLength: 9 },
  { code: "CH", name: "Suiza", flag: "🇨🇭", prefix: "+41", maxLength: 9 },
  { code: "SY", name: "Siria", flag: "🇸🇾", prefix: "+963", maxLength: 9 },
  { code: "TW", name: "Taiwán", flag: "🇹🇼", prefix: "+886", maxLength: 9 },
  { code: "TJ", name: "Tayikistán", flag: "🇹🇯", prefix: "+992", maxLength: 9 },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿", prefix: "+255", maxLength: 9 },
  { code: "TH", name: "Tailandia", flag: "🇹🇭", prefix: "+66", maxLength: 9 },
  { code: "TL", name: "Timor Oriental", flag: "🇹🇱", prefix: "+670", maxLength: 8 },
  { code: "TG", name: "Togo", flag: "🇹🇬", prefix: "+228", maxLength: 8 },
  { code: "TO", name: "Tonga", flag: "🇹🇴", prefix: "+676", maxLength: 7 },
  { code: "TT", name: "Trinidad y Tobago", flag: "🇹🇹", prefix: "+1868", maxLength: 7 },
  { code: "TN", name: "Túnez", flag: "🇹🇳", prefix: "+216", maxLength: 8 },
  { code: "TR", name: "Turquía", flag: "🇹🇷", prefix: "+90", maxLength: 10 },
  { code: "TM", name: "Turkmenistán", flag: "🇹🇲", prefix: "+993", maxLength: 8 },
  { code: "TV", name: "Tuvalu", flag: "🇹🇻", prefix: "+688", maxLength: 6 },
  { code: "UG", name: "Uganda", flag: "🇺🇬", prefix: "+256", maxLength: 9 },
  { code: "UA", name: "Ucrania", flag: "🇺🇦", prefix: "+380", maxLength: 9 },
  { code: "AE", name: "Emiratos Árabes Unidos", flag: "🇦🇪", prefix: "+971", maxLength: 9 },
  { code: "GB", name: "Reino Unido", flag: "🇬🇧", prefix: "+44", maxLength: 10 },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸", prefix: "+1", maxLength: 10 },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", prefix: "+598", maxLength: 8 },
  { code: "UZ", name: "Uzbekistán", flag: "🇺🇿", prefix: "+998", maxLength: 9 },
  { code: "VU", name: "Vanuatu", flag: "🇻🇺", prefix: "+678", maxLength: 7 },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", prefix: "+58", maxLength: 10 },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", prefix: "+84", maxLength: 10 },
  { code: "YE", name: "Yemen", flag: "🇾🇪", prefix: "+967", maxLength: 9 },
  { code: "ZM", name: "Zambia", flag: "🇿🇲", prefix: "+260", maxLength: 9 },
  { code: "ZW", name: "Zimbabue", flag: "🇿🇼", prefix: "+263", maxLength: 9 },
];

/* Lista ordenada alfabéticamente en español con España fija en primera posición,
   ya que es el país por defecto en el contexto de la aplicación. */
export const COUNTRIES_SORTED: Country[] = [
  COUNTRIES.find(c => c.code === "ES")!,
  ...COUNTRIES.filter(c => c.code !== "ES").sort((a, b) => a.name.localeCompare(b.name, "es")),
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string, isValid: boolean, full: string) => void;
  error?: string;
  className?: string;
  placeholder?: string;
  defaultCountry?: string;
}

export default function PhoneInput({
  value, onChange, error, className = "", placeholder, defaultCountry = "ES"
}: PhoneInputProps) {
  const defaultC = COUNTRIES_SORTED.find(c => c.code === defaultCountry) || COUNTRIES_SORTED[0];
  const [country, setCountry] = useState<Country>(defaultC);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  /* Cierra el dropdown si el usuario hace clic en cualquier elemento
     fuera del componente, limpiando también el texto de búsqueda. */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false); setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* Enfoca automáticamente el input de búsqueda cuando se abre el dropdown,
     con un pequeño delay para esperar a que el elemento esté en el DOM. */
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  /* Filtra la lista de países según el texto de búsqueda, comparando contra
     nombre, prefijo y código ISO. Si el campo está vacío devuelve la lista completa. */
  const filtered = useMemo(() =>
    search.trim() === ""
      ? COUNTRIES_SORTED
      : COUNTRIES_SORTED.filter(c =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.prefix.includes(search) ||
          c.code.toLowerCase().includes(search.toLowerCase())
        ),
    [search]
  );

  /* Limpia el input dejando solo dígitos y recorta al máximo permitido por el país.
     Calcula la validez (mínimo 6 dígitos) y propaga los tres valores al padre. */
  const handleNumberChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, country.maxLength);
    const isValid = digits.length >= 6 && digits.length <= country.maxLength;
    onChange(digits, isValid, `${country.prefix}${digits}`);
  };

  /* Al seleccionar un país actualiza el estado, cierra el dropdown y
     recalcula la validez del número ya introducido con las reglas del nuevo país. */
  const handleCountrySelect = (c: Country) => {
    setCountry(c);
    setOpen(false);
    setSearch("");
    const isValid = value.length >= 6 && value.length <= c.maxLength;
    onChange(value, isValid, `${c.prefix}${value}`);
  };

  /* El borde se pone rojo si hay un error externo o si el número tiene
     menos de 6 dígitos pero el usuario ya ha empezado a escribir. */
  const hasError = !!error || (value.length > 0 && value.length < 6);

  return (
    <div className={`w-full ${className}`} ref={dropdownRef}>
      <div className={`flex bg-neutral-800 border rounded transition-colors focus-within:border-red-500 ${hasError ? "border-red-500" : "border-white/10"}`}>

        {/* Botón selector de país: muestra bandera, prefijo y flecha giratoria. */}
        <button type="button" onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-3 py-3 border-r border-white/10 hover:bg-white/5 transition-colors rounded-l flex-shrink-0 min-w-[80px]">
          <span className="text-xl leading-none">{country.flag}</span>
          <span className="text-gray-300 text-xs font-bold">{country.prefix}</span>
          <ChevronDown size={12} className={`text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {/* Input numérico que acepta solo el número local sin prefijo. */}
        <input
          type="tel"
          value={value}
          onChange={(e) => handleNumberChange(e.target.value)}
          placeholder={placeholder || `Ej: ${country.prefix === "+34" ? "612 345 678" : "número"}`}
          className="flex-1 bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-gray-600 min-w-0"
        />
      </div>

      {/* Dropdown con buscador y lista scrollable de países.
          Se posiciona en absolute para no desplazar el layout del formulario. */}
      {open && (
        <div className="absolute z-[200] mt-1 w-72 bg-[#1a1a1f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
            <Search size={14} className="text-gray-500 flex-shrink-0" />
            <input ref={searchRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar país o prefijo..."
              className="bg-transparent text-white text-sm outline-none w-full placeholder:text-gray-600" />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-4">Sin resultados</p>
            ) : filtered.map(c => (
              <button key={c.code} type="button" onClick={() => handleCountrySelect(c)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left ${country.code === c.code ? "bg-white/5" : ""}`}>
                <span className="text-lg leading-none flex-shrink-0">{c.flag}</span>
                <span className="text-white text-xs font-medium flex-1 truncate">{c.name}</span>
                <span className="text-gray-500 text-xs flex-shrink-0">{c.prefix}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mensajes de error: el externo tiene prioridad; si no existe se muestra
          el de número demasiado corto cuando el usuario ya ha empezado a escribir. */}
      {error && <p className="text-red-500 text-[11px] mt-1">{error}</p>}
      {!error && value.length > 0 && value.length < 6 && (
        <p className="text-red-500 text-[11px] mt-1">Número demasiado corto</p>
      )}
    </div>
  );
}