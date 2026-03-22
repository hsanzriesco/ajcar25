import { NextResponse } from "next/server";
// Importa tu cliente de base de datos (ejemplo con Prisma)
// import { prisma } from "@/lib/prisma"; 

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nombre = searchParams.get("nombre")?.toLowerCase().trim();
    const apellidos = searchParams.get("apellidos")?.toLowerCase().trim();

    if (!nombre || !apellidos) {
      return NextResponse.json(
        { error: "Nombre y apellidos son requeridos" },
        { status: 400 }
      );
    }

    // --- LÓGICA DE BÚSQUEDA ---
    // Aquí buscas en tu tabla de 'usuarios' o 'clientes'
    // Ejemplo con Prisma:
    /*
    const usuario = await prisma.usuario.findFirst({
      where: {
        nombre: { equals: nombre, mode: 'insensitive' },
        apellidos: { equals: apellidos, mode: 'insensitive' }
      }
    });
    */

    // Simulación de búsqueda (Sustituye esto por tu consulta real)
    const usuarioExiste = false; // Aquí iría: !!usuario

    if (usuarioExiste) {
      return NextResponse.json({ existe: true });
    } else {
      // Si no existe, devolvemos existe: false para que salte el 'confirm' en el frontend
      return NextResponse.json({ existe: false });
    }

  } catch (error) {
    console.error("Error verificando usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}