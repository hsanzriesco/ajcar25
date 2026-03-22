import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    const data = await sql`
      SELECT 
        p.*, 
        TO_CHAR(p.fecha_cita, 'DD/MM/YYYY') AS fecha_formateada
      FROM presupuestos_pedidos p
      ORDER BY p.creado_en DESC
    `;

    const presupuestosConArticulos = await Promise.all(data.map(async (presu) => {
      try {
        const lineas = await sql`
          SELECT 
            articulo_codigo AS codigo, 
            descripcion, 
            cantidad, 
            precio_unitario 
          FROM lineas_presupuestos 
          WHERE presupuesto_id = ${presu.id}
        `;
        return { ...presu, fecha_cita: presu.fecha_formateada, articulos: lineas || [] };
      } catch (e) {
        return { ...presu, fecha_cita: presu.fecha_formateada, articulos: [] };
      }
    }));

    return NextResponse.json(presupuestosConArticulos);
  } catch (error: any) {
    console.error("ERROR REAL EN TERMINAL:", error.message);
    return NextResponse.json({ error: "Error de servidor" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await request.json();
    // AÑADIDO: apellidos
    const { nombre, apellidos, email, telefono, vehiculo, anio, mensaje, articulos } = body;

    // Valores por defecto para evitar nulos en SQL si no vienen del front
    const fecha = new Date().toISOString().split('T')[0];
    const hora = "10:00";

    // 1. Insertamos la cabecera (Incluyendo apellidos)
    const resultadoPresupuesto = await sql`
      INSERT INTO presupuestos_pedidos (nombre, apellidos, email, telefono, vehiculo, anio, fecha_cita, hora_cita, mensaje, estado) 
      VALUES (${nombre}, ${apellidos}, ${email}, ${telefono}, ${vehiculo}, ${anio}, ${fecha}, ${hora}, ${mensaje}, 'Pendiente')
      RETURNING id
    `;

    const nuevoId = resultadoPresupuesto[0].id;

    // 2. Insertar líneas si existen
    if (articulos && Array.isArray(articulos) && articulos.length > 0) {
      for (const item of articulos) {
        await sql`
          INSERT INTO lineas_presupuestos (presupuesto_id, articulo_codigo, descripcion, cantidad, precio_unitario)
          VALUES (${nuevoId}, ${item.codigo}, ${item.descripcion}, ${item.cantidad}, ${item.precio_unitario})
        `;
      }
    }

    // Retornamos el objeto completo para que el Front lo añada a la lista sin recargar
    return NextResponse.json({ 
        id: nuevoId, 
        nombre, 
        apellidos, 
        email, 
        telefono, 
        vehiculo, 
        anio, 
        estado: 'Pendiente', 
        articulos: articulos || [] 
    }, { status: 200 });
    
  } catch (error: any) {
    console.error("Error al guardar presupuesto:", error);
    return NextResponse.json({ message: "Error al procesar el guardado" }, { status: 500 });
  }
}