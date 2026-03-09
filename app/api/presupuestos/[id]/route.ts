import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { estado, articulos } = await req.json(); // 'articulos' es el array de lineas del presupuesto

  try {
    const sql = neon(process.env.DATABASE_URL!);

    // INICIO DE OPERACIÓN ATÓMICA (Lógica de negocio)
    if (estado === "Aceptado por el cliente" && articulos && articulos.length > 0) {
      
      // Usamos un bucle para actualizar el stock de cada artículo incluido
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

    // Finalmente actualizamos el estado del presupuesto
    const resultado = await sql`
      UPDATE presupuestos 
      SET estado = ${estado} 
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json(resultado[0]);
  } catch (error: any) {
    console.error("Error al actualizar y mover stock:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}