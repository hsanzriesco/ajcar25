import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

// Establece la contraseña de un usuario usando el token de activación recibido por email
// Flujo: valida el token → hashea la nueva clave → actualiza el usuario y activa la cuenta
export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();
    const sql = neon(process.env.DATABASE_URL!);

    // Verifica que el token exista y no haya expirado
    const usuario = await sql`
      SELECT id FROM usuarios 
      WHERE reset_token = ${token} 
      AND reset_token_expires > NOW()
      LIMIT 1
    `;

    if (usuario.length === 0) {
      return NextResponse.json({ error: "El enlace es inválido o ha caducado." }, { status: 400 });
    }

    // Hashea la nueva contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, 10);

    // Guarda el hash, activa la cuenta y elimina el token para que no pueda reutilizarse
    await sql`
      UPDATE usuarios 
      SET password_hash = ${hashedPassword},
          reset_token = NULL,
          reset_token_expires = NULL,
          esta_activo = true
      WHERE id = ${usuario[0].id}
    `;

    return NextResponse.json({ success: true, mensaje: "Contraseña establecida correctamente" });

  } catch (error: any) {
    console.error("Error estableciendo contraseña:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
