import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await request.json();
    
    // 1. Limpieza de datos
    const nombre = (body.nombre || "NUEVO").toUpperCase().trim();
    const apellidos = (body.apellidos || "CLIENTE").toUpperCase().trim();
    const email = body.email?.toLowerCase().trim();
    const telefono = body.telefono || "";

    // 2. VERIFICACIÓN CRÍTICA: Buscar por Email O por Nombre+Apellidos
    // Esto evita el error de "unique constraint" del email
    const usuarioExistente = await sql`
      SELECT id FROM usuarios 
      WHERE email = ${email} 
      OR (UPPER(nombre) = ${nombre} AND UPPER(apellidos) = ${apellidos})
      LIMIT 1
    `;

    if (usuarioExistente.length > 0) {
      console.log("Usuario ya existe, saltando inserción...");
      return NextResponse.json({ 
        success: true, 
        id: usuarioExistente[0].id,
        mensaje: "Usuario recuperado (ya existía)" 
      }, { status: 200 });
    }

    // 3. INSERTAR solo si no existe nada parecido
    const nuevo = await sql`
      INSERT INTO usuarios (
        nombre, 
        apellidos, 
        email, 
        telefono, 
        role, 
        password_hash, 
        esta_activo, 
        tipo_cliente,
        documento_identidad
      )
      VALUES (
        ${nombre}, 
        ${apellidos}, 
        ${email}, 
        ${telefono}, 
        'cliente', 
        'hash_default_123', 
        true, 
        'particular',
        'PENDIENTE' 
      )
      RETURNING id
    `;

    return NextResponse.json({ 
      success: true, 
      id: nuevo[0].id 
    }, { status: 201 });

  } catch (error: any) {
    console.error("ERROR FINAL USUARIOS:", error.message);
    return NextResponse.json({ 
      error: "Error en la operación", 
      detalle: error.message 
    }, { status: 500 });
  }
}