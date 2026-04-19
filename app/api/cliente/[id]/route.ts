import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const sql = neon(process.env.DATABASE_URL!);

    // 1. Obtener datos del cliente
    const clienteData = await sql`
      SELECT 
        id, 
        nombre, 
        apellido1 as apellido, 
        email, 
        telefono 
      FROM usuarios 
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!clienteData.length) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const cliente = clienteData[0];

    // 2. Presupuestos ACTIVOS (Pendiente, En Taller, Cancelado, etc.)
    const presupuestosActivos = await sql`
      SELECT 
        id,
        vehiculo,
        estado,
        mensaje,
        creado_en,
        fecha_cita,
        hora_cita,
        motivo_cancelacion
      FROM presupuestos_pedidos 
      WHERE (email = ${cliente.email} OR usuario_id = ${id})
        AND estado NOT IN ('Facturado', 'facturado', 'Facturada')
      ORDER BY creado_en DESC
    `;

    // 3. Presupuestos FACTURADOS (para "Mis Facturas")
    const presupuestosFacturados = await sql`
      SELECT 
        id,
        vehiculo,
        estado,
        mensaje,
        creado_en,
        fecha_cita,
        hora_cita,
        motivo_cancelacion
      FROM presupuestos_pedidos 
      WHERE (email = ${cliente.email} OR usuario_id = ${id})
        AND estado IN ('Facturado', 'facturado', 'Facturada')
      ORDER BY creado_en DESC
    `;

    // 4. Calcular totales de forma segura
    const allIds = [
      ...presupuestosActivos.map((p: any) => p.id),
      ...presupuestosFacturados.map((p: any) => p.id)
    ];

    let totalesData: any[] = [];
    if (allIds.length > 0) {
      // Usamos ANY para el IN clause de forma segura
      totalesData = await sql`
        SELECT 
          presupuesto_id,
          SUM(subtotal) as total
        FROM lineas_presupuestos 
        WHERE presupuesto_id = ANY(${allIds})
        GROUP BY presupuesto_id
      `;
    }

    const agregarTotal = (p: any) => {
      const totalInfo = totalesData.find((t: any) => t.presupuesto_id === p.id);
      return {
        ...p,
        total: totalInfo ? Number(totalInfo.total) : 0
      };
    };

    const presupuestos = presupuestosActivos.map(agregarTotal);
    const facturas = presupuestosFacturados.map(agregarTotal);

    console.log(`✅ Cliente: ${cliente.nombre} | Activos: ${presupuestos.length} | Facturados: ${facturas.length}`);

    return NextResponse.json({
      cliente,
      presupuestos,
      facturas
    });

  } catch (error: any) {
    console.error("Error en /api/cliente/[id]:", error);
    return NextResponse.json({ 
      error: "Error interno del servidor",
      detalle: error.message 
    }, { status: 500 });
  }
}