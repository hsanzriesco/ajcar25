import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await request.json();
    
    // Extraemos con valores por defecto por si el front no los envía
    const nombre = (body.nombre || "NUEVO").toUpperCase().trim();
    const apellidos = (body.apellidos || "CLIENTE").toUpperCase().trim();
    const email = body.email || `user_${Date.now()}@ajcar.com`;
    const telefono = body.telefono || "";
    
    // IMPORTANTE: Verifica si tu tabla usa 'role' o 'rol'
    // Aquí usamos 'role' que es el estándar de NextAuth/Prisma
    const resultado = await sql`
      INSERT INTO usuarios (nombre, apellidos, email, telefono, role, password)
      VALUES (${nombre}, ${apellidos}, ${email}, ${telefono}, 'cliente', '123456')
      RETURNING id
    `;

    return NextResponse.json({ success: true, id: resultado[0].id }, { status: 201 });

  } catch (error: any) {
    console.error("ERROR CRÍTICO EN USUARIOS:", error.message);
    // Devolvemos el mensaje de error real para verlo en la consola del navegador
    return NextResponse.json({ 
      error: "Fallo en BD", 
      message: error.message 
    }, { status: 500 });
  }
}