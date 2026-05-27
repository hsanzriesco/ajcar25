import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

// Devuelve los datos del cliente junto con sus presupuestos activos y facturas
// Los presupuestos se separan en dos grupos: activos (cualquier estado no facturado) y facturados (con JOIN a la tabla facturas)
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const sql = neon(process.env.DATABASE_URL!);

    // Datos básicos del cliente
    const clienteData = await sql`
      SELECT 
        id, 
        nombre, 
        apellido1, 
        apellido2,
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

    // Presupuestos no facturados: se buscan por email o por usuario_id para cubrir ambos casos
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

    // Presupuestos facturados con JOIN a la tabla facturas para obtener el total y número de factura reales
    const presupuestosFacturados = await sql`
      SELECT 
        pp.id,
        pp.vehiculo,
        pp.estado,
        pp.mensaje,
        pp.creado_en,
        pp.fecha_cita,
        pp.hora_cita,
        pp.email         AS cliente_email,
        f.id             AS factura_id,
        f.numero_factura,
        f.cliente_nombre,
        f.articulos,
        f.total          AS total_factura
      FROM presupuestos_pedidos pp
      LEFT JOIN facturas f ON f.presupuesto_id = pp.id::text
      WHERE (pp.email = ${cliente.email} OR pp.usuario_id = ${id})
        AND pp.estado IN ('Facturado', 'facturado', 'Facturada')
      ORDER BY pp.creado_en DESC
    `;

    // Obtiene los totales desde líneas_presupuestos para los presupuestos que no tienen factura
    const allIds = [
      ...presupuestosActivos.map((p: any) => p.id),
      ...presupuestosFacturados.map((p: any) => p.id)
    ];

    let totalesData: any[] = [];
    if (allIds.length > 0) {
      totalesData = await sql`
        SELECT 
          presupuesto_id,
          SUM(subtotal) as total
        FROM lineas_presupuestos 
        WHERE presupuesto_id = ANY(${allIds})
        GROUP BY presupuesto_id
      `;
    }

    // Si hay total de factura lo usa directamente; si no, lo calcula desde las líneas
    const agregarTotal = (p: any) => {
      if (p.total_factura) return { ...p, total: Number(p.total_factura) };
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

// Actualiza los datos del perfil del cliente: nombre, apellidos, teléfono o contraseña
// Cada campo se actualiza de forma independiente solo si viene en el body
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const sql = neon(process.env.DATABASE_URL!);
    const body = await req.json();

    const { nombre, apellido1, apellido2, telefono, password_actual, password_nueva } = body;

    // Cambio de contraseña: verifica la clave actual antes de aplicar el hash de la nueva
    if (password_nueva) {
      if (!password_actual) {
        return NextResponse.json({ error: "Debes introducir tu contraseña actual" }, { status: 400 });
      }

      const userResult = await sql`
        SELECT password_hash FROM usuarios WHERE id = ${id} LIMIT 1
      `;

      if (!userResult.length) {
        return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
      }

      const passwordValida = await bcrypt.compare(password_actual, userResult[0].password_hash);
      if (!passwordValida) {
        return NextResponse.json({ error: "La contraseña actual no es correcta" }, { status: 401 });
      }

      if (password_nueva.length < 6) {
        return NextResponse.json({ error: "La nueva contraseña debe tener al menos 6 caracteres" }, { status: 400 });
      }

      const nuevoHash = await bcrypt.hash(password_nueva, 10);
      await sql`UPDATE usuarios SET password_hash = ${nuevoHash} WHERE id = ${id}`;
    }

    // Actualización de campos de perfil: cada uno se aplica solo si está presente en el body
    if (nombre !== undefined) {
      await sql`UPDATE usuarios SET nombre = ${nombre} WHERE id = ${id}`;
    }

    if (apellido1 !== undefined) {
      await sql`UPDATE usuarios SET apellido1 = ${apellido1} WHERE id = ${id}`;
    }

    if (apellido2 !== undefined) {
      await sql`UPDATE usuarios SET apellido2 = ${apellido2} WHERE id = ${id}`;
    }

    if (telefono !== undefined) {
      await sql`UPDATE usuarios SET telefono = ${telefono} WHERE id = ${id}`;
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Error en PATCH /api/cliente/[id]:", error);
    return NextResponse.json({
      error: "Error interno del servidor",
      detalle: error.message
    }, { status: 500 });
  }
}
