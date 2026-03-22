import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await request.json();
    
    // Extraemos los datos del cuerpo de la petición
    const nombre = (body.nombre || "NUEVO").toUpperCase().trim();
    const apellidos = (body.apellidos || "CLIENTE").toUpperCase().trim();
    const email = body.email || `temporal_${Date.now()}@ajcar25.com`;
    const telefono = body.telefono || "";

    // INSERT usando exactamente las columnas que se ven en tu captura de Neon
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
        'provisional_hash_123', 
        true,
        'particular'
      )
      RETURNING id
    `;

    return NextResponse.json({ 
      success: true, 
      id: resultado[0].id 
    }, { status: 201 });

  } catch (error: any) {
    // Si falla, esto imprimirá el error exacto de SQL en los logs de Vercel
    console.error("ERROR DETECTADO EN POST USUARIOS:", error.message);
    
    return NextResponse.json({ 
      error: "Error en la base de datos", 
      detalles: error.message 
    }, { status: 500 });
  }
}