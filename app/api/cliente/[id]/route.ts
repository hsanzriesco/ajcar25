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
      SELECT 
        id, 
        nombre, 
        apellido1, 
        apellido2, 
        email, 
        telefono, 
        documento_identidad, 
        tipo_cliente
      FROM usuarios 
      WHERE id = ${id}
      LIMIT 1
    `;

    if (clienteData.length === 0) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const cliente = clienteData[0];

    // Facturas reales (usando cliente_nombre como criterio principal)
    const facturas = await sql`
      SELECT 
        id,
        numero_factura,
        total,
        fecha_emision,
        vehiculo,
        articulos
      FROM facturas 
      WHERE cliente_nombre ILIKE '%' || ${cliente.nombre} || '%'
      ORDER BY fecha_emision DESC
    `;

    console.log(`✅ Facturas encontradas: ${facturas.length} para ${cliente.nombre}`);

    return NextResponse.json({
      cliente,
      presupuestos: [],        // Temporalmente vacío (puedes activarlo después)
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