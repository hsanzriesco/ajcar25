import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function POST(request: Request) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const body = await request.json();
    
    const nombre = (body.nombre || "NUEVO").toUpperCase().trim();
    const apellidos = (body.apellidos || "CLIENTE").toUpperCase().trim();
    const email = body.email?.toLowerCase().trim() || `user_${Date.now()}@ajcar25.com`;
    const telefono = body.telefono || "";

    // 1. Verificamos si existe para evitar duplicados
    const existe = await sql`
      SELECT id FROM usuarios 
      WHERE UPPER(nombre) = ${nombre} AND UPPER(apellidos) = ${apellidos}
      LIMIT 1
    `;

    if (existe.length > 0) {
      return NextResponse.json({ success: true, id: existe[0].id }, { status: 200 });
    }

    // 2. Intento de inserción. 
    // Si 'cliente' o 'CLIENTE' fallan, capturamos el error para decirte qué poner.
    try {
      const nuevo = await sql`
        INSERT INTO usuarios (
          nombre, apellidos, email, telefono, 
          role, password_hash, esta_activo, tipo_cliente
        )
        VALUES (
          ${nombre}, ${apellidos}, ${email}, ${telefono}, 
          'cliente', -- <--- Si falla aquí, mira el bloque catch de abajo
          'hash_123', true, 'particular'
        )
        RETURNING id
      `;
      return NextResponse.json({ success: true, id: nuevo[0].id }, { status: 201 });
      
    } catch (sqlError: any) {
      // Si el error es por el ENUM, intentamos con 'admin' o el valor por defecto
      // Pero lo más útil es pedirle a la DB que nos diga los valores válidos
      const validRoles = await sql`
        SELECT enumlabel FROM pg_enum 
        JOIN pg_type ON pg_enum.enum_typid = pg_type.oid 
        WHERE pg_type.typname = 'user_role'
      `;
      
      const rolesPermitidos = validRoles.map(r => r.enumlabel).join(", ");
      
      return NextResponse.json({ 
        error: "Valor de ROL no válido",
        detalle: `Tu base de datos solo acepta estos roles: [${rolesPermitidos}]`,
        causa_real: sqlError.message
      }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: "Error de servidor", detalle: error.message }, { status: 500 });
  }
}