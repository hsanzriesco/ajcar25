import { NextRequest, NextResponse } from 'next/server';
import { neon } from "@neondatabase/serverless";

// Comprueba si un email está registrado y devuelve los datos del usuario junto con su tipo (cliente o empleado)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    email = email.toLowerCase().trim();

    const sql = neon(process.env.DATABASE_URL!);

    const result = await sql`
      SELECT 
        id, 
        nombre, 
        apellido1, 
        apellido2, 
        email, 
        telefono, 
        tipo_cliente,
        role
      FROM usuarios 
      WHERE email = ${email}
      LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json({ existe: false });
    }

    const usuario = result[0];

    // Considera empleado cualquier usuario con role empleado, admin o jefe;
    // todo lo demás se trata como cliente
    const esEmpleado =
      usuario.tipo_cliente === 'empleado' ||
      usuario.role?.toLowerCase() === 'empleado' ||
      usuario.role?.toLowerCase() === 'admin' ||
      usuario.role?.toLowerCase() === 'jefe';

    const esCliente = !esEmpleado;

    return NextResponse.json({
      existe: true,
      esCliente,
      esEmpleado,
      usuario
    });

  } catch (error: any) {
    console.error("Error verificando email:", error);
    return NextResponse.json({
      error: "Error interno del servidor",
      detalle: error.message
    }, { status: 500 });
  }
}
