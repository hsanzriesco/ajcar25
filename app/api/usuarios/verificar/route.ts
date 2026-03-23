import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { searchParams } = new URL(request.url);
    
    // Normalizamos para la búsqueda
    const nombre = searchParams.get("nombre")?.trim().toUpperCase();
    const apellidos = searchParams.get("apellidos")?.trim().toUpperCase();

    console.log(`🔍 Verificando: [${nombre}] [${apellidos}]`);

    if (!nombre || !apellidos) {
      return NextResponse.json({ existe: false, motivo: "Faltan parámetros" });
    }

    // Buscamos ignorando espacios extra en la columna de la BBDD también con TRIM
    const usuarios = await sql`
      SELECT id, nombre, apellidos FROM usuarios 
      WHERE TRIM(UPPER(nombre)) = ${nombre} 
      AND TRIM(UPPER(apellidos)) = ${apellidos}
      LIMIT 1
    `;

    const existe = usuarios.length > 0;
    
    if (existe) {
      console.log(`✅ Usuario ENCONTRADO en BD: ID ${usuarios[0].id}`);
    } else {
      console.log(`❌ Usuario NO encontrado en BD.`);
    }

    return NextResponse.json({ 
      existe, 
      id: existe ? usuarios[0].id : null,
      debug: { nombre, apellidos } 
    }, { status: 200 });
    
  } catch (error: any) {
    console.error("🔴 Error crítico en verificar:", error.message);
    return NextResponse.json({ error: error.message, existe: false }, { status: 500 });
  }
}