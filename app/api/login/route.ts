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

    // 1. Buscamos al usuario por email
    const users = await sql`SELECT * FROM usuarios WHERE email = ${email} LIMIT 1`;

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

    // 3. Obtenemos el rol correctamente (normalizado a minúsculas)
    let userRole = (user.role || "cliente").toLowerCase().trim();

    // Si existe id_rol, intentamos obtener el nombre del rol desde la tabla roles
    if (user.id_rol && !isNaN(Number(user.id_rol))) {
      const roleData = await sql`SELECT nombre FROM roles WHERE id = ${user.id_rol} LIMIT 1`;
      if (roleData.length > 0) {
        userRole = roleData[0].nombre.toLowerCase().trim();
      }
    }

    // ✅ IMPORTANTE: Devolvemos el rol siempre en minúsculas para evitar problemas
    return NextResponse.json({
      id: user.id,
      nombre: user.nombre,
      role: userRole,           // ← Ahora siempre viene en minúsculas ("cliente", "empleado", etc.)
      email: user.email
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error en login:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}