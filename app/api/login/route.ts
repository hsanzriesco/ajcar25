import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ message: "Error en la configuración del servidor" }, { status: 500 });
    }

    const sql = neon(process.env.DATABASE_URL);

    // 1. Buscamos al usuario por email O por matrícula
    const users = await sql`
      SELECT * FROM usuarios 
      WHERE email = ${email} OR matricula = ${email}
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 401 });
    }

    const user = users[0];

    // 2. Verificamos la contraseña
    const hash = user.password_hash || user.password || user.contraseña;
    const match = await bcrypt.compare(password, hash);
    
    if (!match) {
      return NextResponse.json({ message: "Contraseña incorrecta" }, { status: 401 });
    }

    // 3. Verificamos que el usuario no esté bloqueado
    if (user.esta_activo === false) {
      return NextResponse.json({ 
        message: "Tu cuenta ha sido bloqueada. Contacta con el taller para más información." 
      }, { status: 403 });
    }

    // 4. Obtenemos el rol correctamente (normalizado a minúsculas)
    let userRole = (user.role || "cliente").toLowerCase().trim();

    if (user.id_rol && !isNaN(Number(user.id_rol))) {
      const roleData = await sql`SELECT nombre FROM roles WHERE id = ${user.id_rol} LIMIT 1`;
      if (roleData.length > 0) {
        userRole = roleData[0].nombre.toLowerCase().trim();
      }
    }

    return NextResponse.json({
      id: user.id,
      nombre: user.nombre,
      role: userRole,
      email: user.email
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error en login:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
