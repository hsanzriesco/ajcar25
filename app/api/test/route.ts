import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const roles = await prisma.role.findMany();
    return Response.json(roles);
  } catch (error) {
    return Response.json(
      { error: "Error conectando con la base de datos" },
      { status: 500 }
    );
  }
}