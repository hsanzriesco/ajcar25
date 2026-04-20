import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const facturaId = params.id;

    // 1️⃣ Obtener datos de la factura desde la base de datos
    const result = await sql`
      SELECT id, numero_factura, cliente_nombre, vehiculo, total, articulos, creado_en, fecha_emision
      FROM facturas
      WHERE id = ${facturaId}
      LIMIT 1
    `;

    if (!result.length) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
    }

    const factura = result[0];
    const articulos = Array.isArray(factura.articulos)
      ? factura.articulos
      : JSON.parse(factura.articulos || "[]");

    // 2️⃣ Generar el PDF (mismo estilo que usa el empleado)
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;

    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, pageWidth, 55, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.text("AJCAR 25 - FACTURA", margin, 35);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Nº FACTURA: ${factura.numero_factura}`, margin, 70);
    doc.text(
      `FECHA: ${new Date(factura.fecha_emision || factura.creado_en).toLocaleDateString("es-ES")}`,
      pageWidth - margin,
      70,
      { align: "right" }
    );

    let y = 85;
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL CLIENTE", margin, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Cliente: ${factura.cliente_nombre}`, margin, y); y += 7;
    if (factura.vehiculo) doc.text(`Vehículo: ${factura.vehiculo}`, margin, y); y += 12;

    const tableBody = articulos.map((art: any) => [
      art.descripcion || art.nombre || "Artículo",
      art.cantidad?.toString() || "1",
      `${Number(art.precio_unitario || art.precio || 0).toFixed(2)}€`,
      `${(Number(art.cantidad || 0) * Number(art.precio_unitario || art.precio || 0)).toFixed(2)}€`
    ]);

    autoTable(doc, {
      startY: y,
      head: [["DESCRIPCIÓN", "CANT.", "PRECIO UNIT.", "TOTAL"]],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: [17, 24, 39],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 10,
        halign: "center",
      },
      styles: { fontSize: 9, cellPadding: 6, lineColor: [200, 200, 200] },
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "center", cellWidth: 25 },
        2: { halign: "right", cellWidth: 35 },
        3: { halign: "right", cellWidth: 35 },
      },
      margin: { left: margin, right: margin },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFillColor(41, 128, 185);
    doc.rect(margin, finalY, pageWidth - margin * 2, 12, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TOTAL", margin + 8, finalY + 8.5);
    doc.setFontSize(14);
    doc.text(`${Number(factura.total).toFixed(2)}€`, pageWidth - margin - 8, finalY + 8.5, { align: "right" });

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text("Gracias por su confianza, AJCAR 25", margin, finalY + 30);

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // 3️⃣ Responder con el archivo PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Factura_${factura.numero_factura}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error("Error al generar factura PDF:", error);
    return NextResponse.json({ error: "No se pudo generar la factura." }, { status: 500 });
  }
}
