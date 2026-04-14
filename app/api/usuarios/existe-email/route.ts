import { NextRequest, NextResponse } from 'next/server';
import { neon } from "@neondatabase/serverless";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    const result = await sql`
      SELECT id, nombre, apellido1, apellido2, email, telefono 
      FROM usuarios 
      WHERE email = ${email.toLowerCase().trim()}
      LIMIT 1
    `;

    if (result.length > 0) {
      return NextResponse.json({
        existe: true,
        usuario: result[0]
      });
    } else {
      return NextResponse.json({ existe: false });
    }

  } catch (error: any) {
    console.error("Error verificando email:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}


