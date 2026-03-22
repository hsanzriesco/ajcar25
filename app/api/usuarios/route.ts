import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await request.json();
    
    // Extraemos y limpiamos los datos
    const nombre = body.nombre?.toUpperCase().trim() || "SIN NOMBRE";
    const apellidos = body.apellidos?.toUpperCase().trim() || "SIN APELLIDO";
    const email = body.email || `temporal_${Date.now()}@ajcar25.com`;
    const telefono = body.telefono || "";
    const rol = body.rol || 'cliente';

    console.log("Intentando insertar usuario:", { nombre, apellidos, email });

    // La consulta SQL debe coincidir EXACTAMENTE con tus columnas de Neon
    const resultado = await sql`
      INSERT INTO usuarios (nombre, apellidos, email, telefono, role, password)
      VALUES (${nombre}, ${apellidos}, ${email}, ${telefono}, ${rol}, 'ajcar2024')
      RETURNING id
    `;

    return NextResponse.json({ 
      success: true, 
      id: resultado[0].id 
    }, { status: 201 });

  } catch (error: any) {
    // ESTO ES CLAVE: Imprime el error real en la terminal de VS Code o Logs de Vercel
    console.error("ERROR EN POST USUARIOS:", error.message);
    
    return NextResponse.json({ 
      error: "Error interno", 
      detalle: error.message 
    }, { status: 500 });
  }
}