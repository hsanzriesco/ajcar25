import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// Devuelve todos los datos necesarios para el panel de jefe en una sola llamada:
// empleados, clientes, presupuestos, facturas y estadísticas globales
export async function GET(req: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    const empleados = await sql`
      SELECT id, nombre, apellido1, apellido2, email, telefono, matricula, esta_activo, fecha_registro
      FROM usuarios
      WHERE LOWER(role) = 'empleado'
      ORDER BY nombre ASC
    `;

    const clientes = await sql`
      SELECT id, nombre, apellido1, apellido2, email, telefono, tipo_cliente, esta_activo, motivo_baja, fecha_registro
      FROM usuarios
      WHERE LOWER(role) = 'cliente'
      ORDER BY fecha_registro DESC
    `;

    const presupuestos = await sql`
      SELECT * FROM presupuestos_pedidos ORDER BY creado_en DESC
    `;

    // JOIN con usuarios para incluir el nombre del empleado que emitió cada factura
    const facturas = await sql`
      SELECT 
        f.*,
        u.nombre AS empleado_nombre,
        u.apellido1 AS empleado_apellido1
      FROM facturas f
      LEFT JOIN usuarios u ON u.id = f.empleado_id
      ORDER BY f.fecha_emision DESC
    `;

    // KPIs de ingresos: total histórico e ingresos del mes en curso
    const totalIngresosResult = await sql`
      SELECT COALESCE(SUM(total), 0) AS total FROM facturas
    `;

    const ingresosMesResult = await sql`
      SELECT COALESCE(SUM(total), 0) AS total FROM facturas
      WHERE DATE_TRUNC('month', fecha_emision) = DATE_TRUNC('month', NOW())
    `;

    const presupuestosPorEstado = await sql`
      SELECT estado, COUNT(*) AS cantidad FROM presupuestos_pedidos GROUP BY estado
    `;

    return NextResponse.json({
      empleados,
      clientes,
      presupuestos,
      facturas,
      stats: {
        totalIngresos: Number(totalIngresosResult[0].total),
        ingresosMes: Number(ingresosMesResult[0].total),
        totalClientes: clientes.length,
        totalEmpleados: empleados.length,
        totalPresupuestos: presupuestos.length,
        totalFacturas: facturas.length,
        presupuestosPorEstado,
      }
    });

  } catch (error: any) {
    console.error("Error en GET /api/jefe:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Crea un nuevo empleado con matrícula numérica aleatoria única de 6 dígitos
export async function POST(req: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { nombre, apellido1, apellido2, email, telefono, password } = await req.json();

    if (!nombre || !email || !telefono) {
      return NextResponse.json({ error: "Nombre, email y teléfono son obligatorios" }, { status: 400 });
    }

    const existe = await sql`SELECT id FROM usuarios WHERE email = ${email} LIMIT 1`;
    if (existe.length > 0) {
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 400 });
    }

    // Genera una matrícula única comprobando colisiones; máximo 10 intentos
    let matricula = "";
    let intentos = 0;
    do {
      matricula = Math.floor(100000 + Math.random() * 900000).toString();
      const existeMatricula = await sql`SELECT id FROM usuarios WHERE matricula = ${matricula} LIMIT 1`;
      if (existeMatricula.length === 0) break;
      intentos++;
    } while (intentos < 10);

    // Si no se proporciona contraseña se usa la clave por defecto del sistema
    const passwordFinal = password || "Ajcar25&";
    const hash = await bcrypt.hash(passwordFinal, 10);

    const result = await sql`
      INSERT INTO usuarios (nombre, apellido1, apellido2, email, telefono, matricula, password_hash, role, tipo_cliente, esta_activo)
      VALUES (${nombre}, ${apellido1 || null}, ${apellido2 || null}, ${email}, ${telefono}, ${matricula}, ${hash}, 'Empleado', 'particular', true)
      RETURNING id, nombre, apellido1, apellido2, email, telefono, matricula, esta_activo, fecha_registro
    `;

    return NextResponse.json({ success: true, empleado: result[0] });

  } catch (error: any) {
    console.error("Error en POST /api/jefe:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Endpoint multipropósito: edita empleado, cambia estado de presupuesto o
// gestiona el acceso de un cliente según el campo "tipo" del body
export async function PATCH(req: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await req.json();
    const { tipo, empleado_id, nombre, apellido1, apellido2, email, telefono, password, presupuesto_id, estado, cliente_id, esta_activo, motivo_baja } = body;

    // Actualiza solo los campos del empleado que vienen en el body
    if (tipo === "empleado" && empleado_id) {
      if (nombre !== undefined) await sql`UPDATE usuarios SET nombre = ${nombre} WHERE id = ${empleado_id}`;
      if (apellido1 !== undefined) await sql`UPDATE usuarios SET apellido1 = ${apellido1} WHERE id = ${empleado_id}`;
      if (apellido2 !== undefined) await sql`UPDATE usuarios SET apellido2 = ${apellido2} WHERE id = ${empleado_id}`;
      if (email !== undefined) await sql`UPDATE usuarios SET email = ${email} WHERE id = ${empleado_id}`;
      if (telefono !== undefined) await sql`UPDATE usuarios SET telefono = ${telefono} WHERE id = ${empleado_id}`;
      if (password) {
        const hash = await bcrypt.hash(password, 10);
        await sql`UPDATE usuarios SET password_hash = ${hash} WHERE id = ${empleado_id}`;
      }
      return NextResponse.json({ success: true });
    }

    // Activa o bloquea el acceso de un cliente; al bloquear guarda el motivo de baja
    if (tipo === "cliente" && cliente_id) {
      await sql`
        UPDATE usuarios 
        SET esta_activo = ${esta_activo}, 
            motivo_baja = ${esta_activo ? null : motivo_baja}
        WHERE id = ${cliente_id}
      `;
      return NextResponse.json({ success: true });
    }

    // Cambio directo de estado de un presupuesto (sin tipo específico)
    if (presupuesto_id && estado !== undefined) {
      await sql`UPDATE presupuestos_pedidos SET estado = ${estado} WHERE id = ${presupuesto_id}`;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });

  } catch (error: any) {
    console.error("Error en PATCH /api/jefe:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Elimina un empleado de la BD; el filtro por role evita borrar clientes o administradores
export async function DELETE(req: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { empleado_id } = await req.json();

    if (!empleado_id) {
      return NextResponse.json({ error: "Falta empleado_id" }, { status: 400 });
    }

    await sql`DELETE FROM usuarios WHERE id = ${empleado_id} AND LOWER(role) = 'empleado'`;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Error en DELETE /api/jefe:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
