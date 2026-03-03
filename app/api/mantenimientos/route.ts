import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json({ error: "DATABASE_URL no configurada" }, { status: 500 });
    }

    const sql = neon(databaseUrl);

    // Consulta que une mantenimientos con vehículos para mostrar información completa
    const data = await sql`
      SELECT 
        m.id,
        m.tipo_mantenimiento,
        m.descripcion,
        m.estado,
        m.fecha_entrada,
        v.matricula,
        v.modelo
      FROM mantenimientos m
      JOIN vehiculos v ON m.id_vehiculo = v.id
      ORDER BY m.fecha_entrada DESC
    `;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error al obtener mantenimientos:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}