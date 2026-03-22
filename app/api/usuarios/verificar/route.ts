import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { searchParams } = new URL(request.url);
    
    const nombre = searchParams.get("nombre")?.toUpperCase().trim();
    const apellidos = searchParams.get("apellidos")?.toUpperCase().trim();

    if (!nombre || !apellidos) {
      return NextResponse.json({ existe: false });
    }

    // Buscamos si ya hay alguien con ese nombre y apellidos
    const usuarios = await sql`
      SELECT id FROM usuarios 
      WHERE UPPER(nombre) = ${nombre} 
      AND UPPER(apellidos) = ${apellidos}
      LIMIT 1
    `;

    // Si encontró algo, existe es TRUE
    const existe = usuarios.length > 0;

    return NextResponse.json({ existe }, { status: 200 });
    
  } catch (error: any) {
    console.error("Error verificando usuario:", error.message);
    return NextResponse.json({ error: "Error interno", existe: false }, { status: 500 });
  }
}