import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ codigo: string }> } // Lo definimos como Promise
) {
  try {
    const { codigo } = await params; // Esperamos a los parámetros
    const sql = neon(process.env.DATABASE_URL!);

    const articulos = await sql`
      SELECT id, codigo, descripcion, precio_unitario, stock 
      FROM articulos 
      WHERE UPPER(TRIM(codigo)) = UPPER(TRIM(${codigo}))
    `;

    if (articulos.length === 0) {
      return NextResponse.json({ message: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json(articulos[0]);
  } catch (error: any) {
    console.error("ERROR EN TERMINAL:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}