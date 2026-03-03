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

    // 3. Obtenemos el rol (priorizamos columna 'role')
    let userRole = user.role || "Cliente";

    // Si el rol es un ID (número), intentamos buscar el nombre en la tabla roles
    if (user.id_rol && !isNaN(Number(user.id_rol))) {
      const roleData = await sql`SELECT nombre FROM roles WHERE id = ${user.id_rol} LIMIT 1`;
      if (roleData.length > 0) userRole = roleData[0].nombre;
    }

    return NextResponse.json({
      id: user.id,
      nombre: user.nombre,
      role: userRole // Enviamos el texto: "Empleado", "Cliente", etc.
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ message: "Error: " + error.message }, { status: 500 });
  }
}