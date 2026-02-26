import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
// Importante: Instala bcryptjs para seguridad: npm install bcryptjs
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ message: "Datos insuficientes" }, { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL!);

    // 1. Verificar si el token existe y no ha caducado
    const resetRequest = await sql`
      SELECT email FROM password_reset_tokens 
      WHERE token = ${token} AND expires_at > NOW() 
      LIMIT 1
    `;

    if (resetRequest.length === 0) {
      return NextResponse.json(
        { message: "El enlace es inválido o ha expirado. Solicita uno nuevo." }, 
        { status: 400 }
      );
    }

    const email = resetRequest[0].email;

    // 2. Encriptar la nueva contraseña (SEGURIDAD OBLIGATORIA)
    // No la guardes en texto plano porque no funcionará el Login si este usa bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Actualizar en la tabla 'usuarios' usando el nombre de columna 'password_hash'
    const updateResult = await sql`
      UPDATE usuarios 
      SET password_hash = ${hashedPassword} 
      WHERE email = ${email}
    `;

    // 4. Borrar el token usado
    await sql`DELETE FROM password_reset_tokens WHERE email = ${email}`;

    return NextResponse.json({ message: "Contraseña actualizada con éxito" }, { status: 200 });

  } catch (error: any) {
    console.error("Error al actualizar contraseña:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}