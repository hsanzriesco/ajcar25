console.log("route");


import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Intentamos traer todo de forma segura
    const data = await sql`
      SELECT 
        p.*, 
        TO_CHAR(p.fecha_cita, 'DD/MM/YYYY') AS fecha_formateada
      FROM presupuestos_pedidos p
      ORDER BY p.creado_en DESC
    `;

    // Ahora buscamos las líneas por separado para evitar el error 500 del JOIN
    const presupuestosConArticulos = await Promise.all(data.map(async (presu) => {
      try {
        const lineas = await sql`
          SELECT 
            articulo_codigo AS codigo, 
            articulo_codigo AS descripcion, 
            cantidad, 
            precio_unitario 
          FROM lineas_presupuestos 
          WHERE presupuesto_id = ${presu.id}
        `;
        return { ...presu, fecha_cita: presu.fecha_formateada, articulos: lineas || [] };
      } catch (e) {
        // Si fallan las líneas, devolvemos el presupuesto sin artículos en lugar de un Error 500
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
    const { nombre, email, telefono, vehiculo, anio, fecha_cita, hora_cita, mensaje, articulos } = body;

    // 1. Insertamos la cabecera del presupuesto
    const resultadoPresupuesto = await sql`
      INSERT INTO presupuestos_pedidos (nombre, email, telefono, vehiculo, anio, fecha_cita, hora_cita, mensaje, estado) 
      VALUES (${nombre}, ${email}, ${telefono}, ${vehiculo}, ${anio}, ${fecha_cita}, ${hora_cita}, ${mensaje}, 'Pendiente')
      RETURNING id
    `;

    const nuevoId = resultadoPresupuesto[0].id;

    // 2. Si hay artículos, los insertamos uno por uno en la tabla de líneas
    if (articulos && Array.isArray(articulos) && articulos.length > 0) {
      for (const item of articulos) {
        await sql`
          INSERT INTO lineas_presupuestos (presupuesto_id, articulo_codigo, descripcion, cantidad, precio_unitario)
          VALUES (${nuevoId}, ${item.codigo}, ${item.descripcion}, ${item.cantidad}, ${item.precio_unitario})
        `;
      }
    }

    return NextResponse.json({ message: "Presupuesto y líneas guardados", id: nuevoId }, { status: 200 });
  } catch (error: any) {
    console.error("Error al guardar:", error);
    return NextResponse.json({ message: "Error al procesar el guardado" }, { status: 500 });
  }
}