import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await request.json();
    
    // Normalizamos datos
    const nombre = (body.nombre || "NUEVO").toUpperCase().trim();
    const apellidos = (body.apellidos || "CLIENTE").toUpperCase().trim();
    const email = body.email?.toLowerCase().trim() || `temp_${Date.now()}@ajcar25.com`;
    const telefono = body.telefono || "";

    // 1. PRIMERO: Verificamos si ya existe por nombre/apellidos para evitar el 500
    const existe = await sql`
      SELECT id FROM usuarios 
      WHERE UPPER(nombre) = ${nombre} AND UPPER(apellidos) = ${apellidos}
      LIMIT 1
    `;

    if (existe.length > 0) {
      return NextResponse.json({ 
        success: true, 
        id: existe[0].id, 
        mensaje: "El usuario ya existía, usamos el ID actual" 
      }, { status: 200 });
    }

    // 2. SEGUNDO: Si no existe, lo insertamos con los campos de tu imagen
    const nuevo = await sql`
      INSERT INTO usuarios (
        nombre, 
        apellidos, 
        email, 
        telefono, 
        role, 
        password_hash, 
        esta_activo,
        tipo_cliente
      )
      VALUES (
        ${nombre}, 
        ${apellidos}, 
        ${email}, 
        ${telefono}, 
        'cliente', 
        'hash_provisional', 
        true,
        'particular'
      )
      RETURNING id
    `;

    return NextResponse.json({ 
      success: true, 
      id: nuevo[0].id 
    }, { status: 201 });

  } catch (error: any) {
    console.error("ERROR SQL EN USUARIOS:", error.message);
    return NextResponse.json({ 
      error: "Error en base de datos", 
      detalle: error.message 
    }, { status: 500 });
  }
}