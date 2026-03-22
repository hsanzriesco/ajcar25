import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await request.json();
    
    // 1. Extraer y limpiar datos
    const nombre = (body.nombre || "NUEVO").toUpperCase().trim();
    const apellidos = (body.apellidos || "CLIENTE").toUpperCase().trim();
    const email = body.email?.toLowerCase().trim() || `user_${Date.now()}@ajcar25.com`;
    const telefono = body.telefono || "";

    // 2. Verificar si ya existe para no duplicar
    const existe = await sql`
      SELECT id FROM usuarios 
      WHERE UPPER(nombre) = ${nombre} AND UPPER(apellidos) = ${apellidos}
      LIMIT 1
    `;

    if (existe.length > 0) {
      return NextResponse.json({ 
        success: true, 
        id: existe[0].id,
        mensaje: "Usuario recuperado" 
      }, { status: 200 });
    }

    // 3. Insertar el nuevo usuario
    // Usamos 'cliente' (en minúsculas) que es lo más habitual
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
        'hash_default_123', 
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
    console.error("ERROR FINAL USUARIOS:", error.message);
    return NextResponse.json({ 
      error: "Error en la operación", 
      detalle: error.message 
    }, { status: 500 });
  }
}