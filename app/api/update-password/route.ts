import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const validarPassword = (password: string): string | null => {
  if (!password || password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
  if (!/[a-z]/.test(password)) return "La contraseña debe tener al menos una letra minúscula.";
  if (!/[A-Z]/.test(password)) return "La contraseña debe tener al menos una letra mayúscula.";
  if (!/[0-9]/.test(password)) return "La contraseña debe tener al menos un número.";
  if (!/[^a-zA-Z0-9]/.test(password)) return "La contraseña debe tener al menos un carácter especial (!@#$...).";
  return null;
};

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ message: "Datos insuficientes" }, { status: 400 });
    }

    // ✅ Validación igual que en el panel cliente
    const errorPassword = validarPassword(password);
    if (errorPassword) {
      return NextResponse.json({ message: errorPassword }, { status: 400 });
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

    // 2. Encriptar la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Actualizar en la tabla usuarios
    await sql`
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
