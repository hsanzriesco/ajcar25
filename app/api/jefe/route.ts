import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

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

    const facturas = await sql`
      SELECT 
        f.*,
        u.nombre AS empleado_nombre,
        u.apellido1 AS empleado_apellido1
      FROM facturas f
      LEFT JOIN usuarios u ON u.id = f.empleado_id
      ORDER BY f.fecha_emision DESC
    `;

    const articulos = await sql`
      SELECT id, codigo, descripcion, precio_unitario, stock, stock_reservado
      FROM articulos
      ORDER BY descripcion ASC
    `;

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

    // Estadísticas por empleado + objetivo del mes actual
    const statsEmpleados = await sql`
      SELECT 
        u.id,
        u.nombre,
        u.apellido1,
        u.matricula,
        COUNT(f.id) AS total_facturas,
        COALESCE(SUM(f.total), 0) AS total_facturado,
        COALESCE(SUM(CASE 
          WHEN DATE_TRUNC('month', f.fecha_emision) = DATE_TRUNC('month', NOW()) 
          THEN f.total ELSE 0 
        END), 0) AS facturado_mes,
        COALESCE(
          (SELECT o.objetivo FROM objetivos_empleados o 
           WHERE o.empleado_id = u.id 
           AND o.mes = EXTRACT(MONTH FROM NOW())
           AND o.anio = EXTRACT(YEAR FROM NOW())
           LIMIT 1), 0
        ) AS objetivo_mes
      FROM usuarios u
      LEFT JOIN facturas f ON f.empleado_id = u.id
      WHERE LOWER(u.role) = 'empleado'
      GROUP BY u.id, u.nombre, u.apellido1, u.matricula
      ORDER BY total_facturado DESC
    `;

    return NextResponse.json({
      empleados,
      clientes,
      presupuestos,
      facturas,
      articulos,
      statsEmpleados,
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

// POST — crear empleado con matrícula aleatoria de 6 dígitos
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

    let matricula = "";
    let intentos = 0;
    do {
      matricula = Math.floor(100000 + Math.random() * 900000).toString();
      const existeMatricula = await sql`SELECT id FROM usuarios WHERE matricula = ${matricula} LIMIT 1`;
      if (existeMatricula.length === 0) break;
      intentos++;
    } while (intentos < 10);

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

// PATCH — editar empleado, cambiar estado presupuesto, denegar/restaurar cliente, actualizar stock, actualizar objetivo
export async function PATCH(req: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await req.json();
    const { tipo, empleado_id, nombre, apellido1, apellido2, email, telefono, password, presupuesto_id, estado, cliente_id, esta_activo, motivo_baja, articulo_id, stock_nuevo, objetivo } = body;

    // Editar empleado
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

    // Denegar o restaurar acceso de cliente
    if (tipo === "cliente" && cliente_id) {
      await sql`
        UPDATE usuarios 
        SET esta_activo = ${esta_activo}, 
            motivo_baja = ${esta_activo ? null : motivo_baja}
        WHERE id = ${cliente_id}
      `;
      return NextResponse.json({ success: true });
    }

    // Actualizar stock de artículo
    if (tipo === "stock" && articulo_id !== undefined && stock_nuevo !== undefined) {
      if (Number(stock_nuevo) < 0) {
        return NextResponse.json({ error: "El stock no puede ser negativo" }, { status: 400 });
      }
      const result = await sql`
        UPDATE articulos 
        SET stock = ${Number(stock_nuevo)}
        WHERE id = ${articulo_id}
        RETURNING id, codigo, descripcion, stock
      `;
      return NextResponse.json({ success: true, articulo: result[0] });
    }

    // Actualizar objetivo mensual de un empleado
    if (tipo === "objetivo" && empleado_id && objetivo !== undefined) {
      const mes = new Date().getMonth() + 1;
      const anio = new Date().getFullYear();
      await sql`
        INSERT INTO objetivos_empleados (empleado_id, mes, anio, objetivo)
        VALUES (${empleado_id}, ${mes}, ${anio}, ${Number(objetivo)})
        ON CONFLICT (empleado_id, mes, anio)
        DO UPDATE SET objetivo = ${Number(objetivo)}
      `;
      return NextResponse.json({ success: true });
    }

    // Cambiar estado de presupuesto
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

// DELETE — eliminar empleado
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
