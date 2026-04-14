import { NextRequest, NextResponse } from 'next/server';
import { neon } from "@neondatabase/serverless";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "ID de usuario requerido" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // Datos del cliente
    const clienteData = await sql`
      SELECT id, nombre, apellido1, apellido2, email, telefono, tipo_cliente
      FROM usuarios 
      WHERE id = ${id}
      LIMIT 1
    `;

    if (clienteData.length === 0) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const cliente = clienteData[0];

    // 1. Obtenemos la información principal de presupuestos_pedidos (estado, vehículo, etc.)
    const pedidos = await sql`
      SELECT 
        id,
        vehiculo,
        estado,
        mensaje,
        creado_en,
        fecha_cita,
        hora_cita
      FROM presupuestos_pedidos 
      WHERE usuario_id = ${id}
      ORDER BY creado_en DESC
    `;

    // 2. Obtenemos el total (subtotal) desde lineas_presupuestos
    const totales = await sql`
      SELECT 
        presupuesto_id,
        SUM(subtotal) as total
      FROM lineas_presupuestos 
      WHERE presupuesto_id IN (SELECT id FROM presupuestos_pedidos WHERE usuario_id = ${id})
      GROUP BY presupuesto_id
    `;

    // Combinamos ambos resultados
    const presupuestos = pedidos.map((pedido: any) => {
      const totalData = totales.find((t: any) => t.presupuesto_id === pedido.id);
      return {
        ...pedido,
        total: totalData ? Number(totalData.total) : 0
      };
    });

    // Facturas
    const facturas = await sql`
      SELECT 
        id,
        numero_factura,
        total,
        fecha_emision,
        estado,
        vehiculo
      FROM facturas 
      WHERE cliente_nombre ILIKE '%' || ${cliente.nombre} || '%'
      ORDER BY fecha_emision DESC
    `;

    console.log(`✅ API cliente cargada | Presupuestos: ${presupuestos.length} | Facturas: ${facturas.length}`);

    return NextResponse.json({
      cliente,
      presupuestos,
      facturas
    });

  } catch (error: any) {
    console.error("❌ Error en /api/cliente/[id]:", error);
    return NextResponse.json({ 
      error: "Error interno del servidor",
      detalle: error.message 
    }, { status: 500 });
  }
}