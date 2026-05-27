import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

// Comprueba si existe un usuario por nombre y apellidos, normalizando mayúsculas y espacios en ambos lados
export async function GET(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { searchParams } = new URL(request.url);

    const nombre = searchParams.get("nombre")?.trim().toUpperCase();
    const apellidos = searchParams.get("apellidos")?.trim().toUpperCase();

    if (!nombre || !apellidos) {
      return NextResponse.json({ existe: false, motivo: "Faltan parámetros" });
    }

    // Aplica TRIM y UPPER también en la columna de la BD para evitar falsos negativos por espacios o capitalización
    const usuarios = await sql`
      SELECT id, nombre, apellidos FROM usuarios 
      WHERE TRIM(UPPER(nombre)) = ${nombre} 
      AND TRIM(UPPER(apellidos)) = ${apellidos}
      LIMIT 1
    `;

    const existe = usuarios.length > 0;

    return NextResponse.json({
      existe,
      id: existe ? usuarios[0].id : null,
      debug: { nombre, apellidos }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error crítico en verificar:", error.message);
    return NextResponse.json({ error: error.message, existe: false }, { status: 500 });
  }
}
