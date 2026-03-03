import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

// --- FUNCIÓN PARA LEER (Lo que usa tu tabla de Gestión) ---
export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    const data = await sql`
      SELECT 
        id, 
        nombre, 
        email, 
        telefono, 
        vehiculo, 
        anio, 
        TO_CHAR(fecha_cita, 'DD/MM/YYYY') AS fecha_cita, 
        hora_cita, 
        mensaje, 
        estado, 
        creado_en 
      FROM presupuestos_pedidos 
      ORDER BY creado_en DESC
    `;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error al obtener datos:", error);
    return NextResponse.json({ error: "Error de base de datos" }, { status: 500 });
  }
}

// --- FUNCIÓN PARA GUARDAR (Lo que usa tu Formulario de contacto) ---
export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await request.json();

    await sql`
      INSERT INTO presupuestos_pedidos (
        nombre, 
        email, 
        telefono, 
        vehiculo, 
        anio, 
        fecha_cita, 
        hora_cita, 
        mensaje,
        estado
      ) VALUES (
        ${body.nombre}, 
        ${body.email}, 
        ${body.telefono}, 
        ${body.vehiculo}, 
        ${body.anio}, 
        ${body.fecha_cita}, 
        ${body.hora_cita}, 
        ${body.mensaje},
        'Pendiente'
      )
    `;

    return NextResponse.json(
      { message: "Presupuesto guardado correctamente" }, 
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error en Neon POST:", error);
    return NextResponse.json(
      { message: "Error al procesar el presupuesto." }, 
      { status: 500 }
    );
  }
}