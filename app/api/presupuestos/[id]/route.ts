console.log("id");

import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const { estado, articulos } = await req.json();

    const sql = neon(process.env.DATABASE_URL!);

    // INICIO DE OPERACIÓN ATÓMICA (Lógica de negocio)
    if (estado === "Aceptado por el cliente" && articulos && articulos.length > 0) {

      // Actualizamos el stock de cada artículo incluido
      for (const item of articulos) {

        await sql`
          UPDATE articulos 
          SET 
            stock = stock - ${item.cantidad},
            stock_reservado = stock_reservado + ${item.cantidad}
          WHERE codigo = ${item.codigo}
        `;

      }

    }

    // Actualizamos el estado del presupuesto
    const resultado = await sql`
      UPDATE presupuestos 
      SET estado = ${estado} 
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(resultado[0]);

  } catch (error: any) {

    console.error("Error al actualizar y mover stock:", error);

    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );

  }
}