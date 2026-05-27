import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

// Autentica al usuario por email o matrícula, verifica la contraseña y devuelve los datos de sesión
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ message: "Error en la configuración del servidor" }, { status: 500 });
    }

    const sql = neon(process.env.DATABASE_URL);

    // Permite iniciar sesión tanto con email como con número de matrícula (empleados)
    const users = await sql`
      SELECT * FROM usuarios 
      WHERE email = ${email} OR matricula = ${email}
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 401 });
    }

    const user = users[0];

    // Compatibilidad con distintos nombres de columna según la versión del esquema
    const hash = user.password_hash || user.password || user.contraseña;
    const match = await bcrypt.compare(password, hash);

    if (!match) {
      return NextResponse.json({ message: "Contraseña incorrecta" }, { status: 401 });
    }

    // Bloquea el acceso si el jefe ha desactivado la cuenta del usuario
    if (user.esta_activo === false) {
      return NextResponse.json({
        message: "Tu cuenta ha sido bloqueada. Contacta con el taller para más información."
      }, { status: 403 });
    }

    // Obtiene el rol desde el campo directo o desde la tabla roles si se usa id_rol numérico
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
