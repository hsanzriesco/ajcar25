import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

/* =========================
   OBTENER PRESUPUESTO
========================= */

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const sql = neon(process.env.DATABASE_URL!);

    const resultado = await sql`
      SELECT * 
      FROM presupuestos_pedidos
      WHERE id = ${id}
    `;

    if (!resultado.length) {
      return NextResponse.json(
        { error: "Presupuesto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(resultado[0]);

  } catch (error: any) {
    console.error("Error al obtener presupuesto:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/* =========================
   ACTUALIZAR PRESUPUESTO (PATCH)
========================= */

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const { estado, articulos, motivo_cancelacion } = await req.json();

    const sql = neon(process.env.DATABASE_URL!);

    // ====================== LÓGICA PARA ACEPTADO POR EL CLIENTE ======================
    if (estado === "Aceptado por el cliente" && articulos && articulos.length > 0) {
      // Actualizamos el stock de cada artículo
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

    // ====================== LÓGICA PARA CANCELACIÓN ======================
    if (estado === "Cancelado") {
      if (!motivo_cancelacion || motivo_cancelacion.trim() === "") {
        return NextResponse.json(
          { error: "El motivo de cancelación es obligatorio" },
          { status: 400 }
        );
      }

      // Actualizamos estado + motivo de cancelación
      const resultado = await sql`
        UPDATE presupuestos_pedidos
        SET 
          estado = ${estado},
          motivo_cancelacion = ${motivo_cancelacion.trim()}
        WHERE id = ${id}
        RETURNING *
      `;

      if (!resultado.length) {
        return NextResponse.json(
          { error: "Presupuesto no encontrado" },
          { status: 404 }
        );
      }

      return NextResponse.json(resultado[0]);
    }

    // ====================== ACTUALIZACIÓN NORMAL (otros estados) ======================
    // Actualizamos solo el estado
    const resultado = await sql`
      UPDATE presupuestos_pedidos
      SET estado = ${estado} 
      WHERE id = ${id}
      RETURNING *
    `;

    if (!resultado.length) {
      return NextResponse.json(
        { error: "Presupuesto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(resultado[0]);

  } catch (error: any) {
    console.error("Error al actualizar presupuesto:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}