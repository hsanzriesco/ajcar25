import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nombre = searchParams.get("nombre");
    const apellidos = searchParams.get("apellidos");

    console.log("DEBUG -> Petición para:", nombre, apellidos);

    // Respondemos con un 200 OK y existe: false para que el modal funcione
    return NextResponse.json({ existe: false }, { status: 200 });
    
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}