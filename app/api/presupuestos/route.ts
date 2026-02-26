import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    // Conexión a Neon usando tu variable de entorno
    const sql = neon(process.env.DATABASE_URL!);
    
    // Obtenemos los datos del cuerpo de la petición
    const body = await request.json();

    // Insertamos en la tabla con los nombres de columna exactos de tu SQL
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
        'pendiente'
      )
    `;

    return NextResponse.json(
      { message: "Presupuesto guardado correctamente" }, 
      { status: 200 }
    );

  } catch (error: any) {
    console.error("Error en Neon:", error);
    
    // Si el error es por falta de la extensión UUID en Neon
    if (error.message?.includes("gen_random_uuid")) {
      return NextResponse.json(
        { message: "Error de configuración de base de datos (UUID)." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Error al procesar el presupuesto." }, 
      { status: 500 }
    );
  }
}