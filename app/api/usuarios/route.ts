import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await request.json();
    
    // 1. Limpiamos datos
    const nombre = (body.nombre || "NUEVO").toUpperCase().trim();
    const apellidos = (body.apellidos || "CLIENTE").toUpperCase().trim();
    const email = body.email || `temp_${Date.now()}@ajcar25.com`;
    const telefono = body.telefono || "";

    // 2. Intento de inserción con los campos de tu imagen
    const resultado = await sql`
      INSERT INTO usuarios (
        nombre, 
        apellidos, 
        email, 
        telefono, 
        role, 
        password_hash, 
        esta_activo
      )
      VALUES (
        ${nombre}, 
        ${apellidos}, 
        ${email}, 
        ${telefono}, 
        'cliente', 
        'provisional_hash', 
        true
      )
      RETURNING id
    `;

    return NextResponse.json({ success: true, id: resultado[0].id }, { status: 201 });

  } catch (error: any) {
    // ENVIAMOS EL ERROR REAL AL FRONTEND
    console.error("ERROR SQL:", error.message);
    return NextResponse.json({ 
      error: "Error de Base de Datos", 
      mensaje_sql: error.message, // <--- Esto te dirá qué columna falla
      ayuda: "Revisa si la columna apellidos existe o si el email está duplicado"
    }, { status: 500 });
  }
}