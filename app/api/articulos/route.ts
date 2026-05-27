import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

// Devuelve todos los artículos del almacén ordenados alfabéticamente por descripción
export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    const articulos = await sql`
      SELECT id, codigo, descripcion, precio_unitario, stock, stock_reservado 
      FROM articulos
      ORDER BY descripcion ASC
    `;

    return NextResponse.json(articulos);
  } catch (error: any) {
    console.error("Error en Neon DB:", error);
    return NextResponse.json(
      { error: "Error al obtener artículos", details: error.message },
      { status: 500 }
    );
  }
}
