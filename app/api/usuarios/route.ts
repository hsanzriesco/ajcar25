import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await request.json();

    // 1. Limpieza y normalización de datos
    const nombre = (body.nombre || "").trim().toUpperCase();
    const apellidos = (body.apellidos || "").trim().toUpperCase();
    const email = body.email?.toLowerCase().trim();
    const telefono = (body.telefono || "").trim();

    if (!nombre || !apellidos) {
      return NextResponse.json({ error: "Nombre y apellidos son obligatorios" }, { status: 400 });
    }

    console.log(`🚀 Intentando procesar usuario: ${nombre} ${apellidos} (${email})`);

    // 2. VERIFICACIÓN: Buscamos si el EMAIL ya existe
    // El email suele ser una restricción UNIQUE en la base de datos
    const usuarioPorEmail = await sql`
      SELECT id, nombre, apellidos FROM usuarios 
      WHERE email = ${email} 
      LIMIT 1
    `;

    if (usuarioPorEmail.length > 0) {
      console.log(`ℹ️ Usuario recuperado por email exacto: ${usuarioPorEmail[0].id}`);
      return NextResponse.json({
        success: true,
        id: usuarioPorEmail[0].id,
        mensaje: "Usuario recuperado por email exacto"
      }, { status: 200 });
    }

    // 3. VERIFICACIÓN: Buscamos si el NOMBRE Y APELLIDO ya existen
    // Esto evita duplicar personas si el email es generado automáticamente
    const usuarioPorNombre = await sql`
      SELECT id FROM usuarios 
      WHERE TRIM(UPPER(nombre)) = ${nombre} 
      AND TRIM(UPPER(apellidos)) = ${apellidos} 
      LIMIT 1
    `;

    if (usuarioPorNombre.length > 0) {
      console.log(`ℹ️ Usuario recuperado por nombre y apellido: ${usuarioPorNombre[0].id}`);
      return NextResponse.json({
        success: true,
        id: usuarioPorNombre[0].id,
        mensaje: "Usuario ya existía por nombre y apellido"
      }, { status: 200 });
    }

    // 4. INSERCIÓN: Si no existe, lo creamos físicamente en la BD
    // Nota: He puesto 'role' como nombre de columna basándome en tu código previo. 
    // Asegúrate de que en tu tabla de Neon la columna se llame 'role' y no 'rol'.
    const nuevo = await sql`
      INSERT INTO usuarios (
        nombre, 
        apellidos, 
        email, 
        telefono, 
        role, 
        password_hash, 
        esta_activo, 
        tipo_cliente,
        documento_identidad
      )
      VALUES (
        ${nombre}, 
        ${apellidos}, 
        ${email}, 
        ${telefono}, 
        'user', 
        'hash_default_123', 
        true, 
        'particular',
        'PENDIENTE' 
      )
      RETURNING id
    `;

    console.log("✅ NUEVO USUARIO CREADO FÍSICAMENTE CON ID:", nuevo[0].id);

    return NextResponse.json({
      success: true,
      id: nuevo[0].id,
      mensaje: "Usuario creado desde cero en la base de datos"
    }, { status: 201 });

  } catch (error: any) {
    console.error("🔴 ERROR CRÍTICO EN API/USUARIOS/ROUTE.TS:", error.message);
    return NextResponse.json({
      error: "Error interno al guardar el usuario",
      detalle: error.message
    }, { status: 500 });
  }
}