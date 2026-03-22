import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await request.json();
    
    // Extraemos y normalizamos
    const nombre = (body.nombre || "").toUpperCase().trim();
    const apellidos = (body.apellidos || "").toUpperCase().trim();
    const email = body.email || `temp_${Date.now()}@ajcar25.com`;
    const telefono = body.telefono || "";

    // Insertamos usando los nombres EXACTOS de tu imagen
    const resultado = await sql`
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
        'provisional_hash', 
        true,
        'particular'
      )
      RETURNING id
    `;

    return NextResponse.json({ success: true, id: resultado[0].id }, { status: 201 });

  } catch (error: any) {
    console.error("ERROR BD USUARIOS:", error.message);
    return NextResponse.json({ 
      error: "Error en inserción", 
      detalle: error.message 
    }, { status: 500 });
  }
}