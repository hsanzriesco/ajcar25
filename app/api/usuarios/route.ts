import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { searchParams } = new URL(request.url);

    const dni = searchParams.get("dni")?.trim().toUpperCase();

    if (!dni) {
      return NextResponse.json({ existe: false, motivo: "Falta el DNI" });
    }

    const usuarios = await sql`
      SELECT id, nombre, apellido1, apellido2, email, telefono, documento_identidad, tipo_cliente
      FROM usuarios 
      WHERE TRIM(UPPER(documento_identidad)) = ${dni}
      LIMIT 1
    `;

    const existe = usuarios.length > 0;

    return NextResponse.json({
      existe,
      usuario: existe ? usuarios[0] : null
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error en /api/usuarios GET:", error.message);
    return NextResponse.json({ error: error.message, existe: false }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await request.json();

    const { nombre, apellido1, apellido2, email, telefono, documento_identidad, tipo_cliente } = body;

    if (!nombre || !email || !documento_identidad) {
      return NextResponse.json({ error: "Nombre, email y documento_identidad son obligatorios" }, { status: 400 });
    }

    // Verificar si ya existe un usuario con ese documento o email
    const existente = await sql`
      SELECT id FROM usuarios 
      WHERE TRIM(UPPER(documento_identidad)) = ${documento_identidad.trim().toUpperCase()}
      OR TRIM(LOWER(email)) = ${email.trim().toLowerCase()}
      LIMIT 1
    `;

    if (existente.length > 0) {
      return NextResponse.json({ error: "Ya existe un usuario con ese DNI o email" }, { status: 409 });
    }

    const resultado = await sql`
      INSERT INTO usuarios (nombre, apellido1, apellido2, email, telefono, documento_identidad, tipo_cliente, role, esta_activo)
      VALUES (
        ${nombre.trim().toUpperCase()},
        ${(apellido1 || "").trim().toUpperCase()},
        ${(apellido2 || "").trim().toUpperCase()},
        ${email.trim().toLowerCase()},
        ${(telefono || "").trim()},
        ${documento_identidad.trim().toUpperCase()},
        ${tipo_cliente || "particular"},
        'cliente',
        true
      )
      RETURNING id, nombre, email
    `;

    return NextResponse.json({ success: true, usuario: resultado[0] }, { status: 201 });

  } catch (error: any) {
    console.error("Error en /api/usuarios POST:", error.message);
    return NextResponse.json({ error: error.message, detalle: error.detail }, { status: 500 });
  }
}
