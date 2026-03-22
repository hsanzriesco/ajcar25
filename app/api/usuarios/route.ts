import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const { nombre, apellidos, email, telefono, rol } = await request.json();

    // Insertar en la tabla usuarios (ajusta los nombres de columnas si son diferentes)
    await sql`
      INSERT INTO usuarios (nombre, apellidos, email, telefono, role, password)
      VALUES (
        ${nombre.toUpperCase()}, 
        ${apellidos.toUpperCase()}, 
        ${email || null}, 
        ${telefono || null}, 
        ${rol || 'cliente'}, 
        'auto123'
      )
    `;

    return NextResponse.json({ message: "Usuario creado correctamente" }, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear usuario:", error);
    return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 });
  }
}