"use client";

import * as React from "react";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export interface SecaoPDF {
  titulo?: string;
  head: string[];
  body: (string | number)[][];
}

interface ExportarPDFProps {
  titulo: string;
  subtitulo?: string;
  secoes: SecaoPDF[];
  arquivo: string;
}

export function ExportarPDF({
  titulo,
  subtitulo,
  secoes,
  arquivo,
}: ExportarPDFProps) {
  const [loading, setLoading] = React.useState(false);

  async function gerar() {
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();

      // Cabeçalho com identidade RO (azul-petróleo)
      doc.setFillColor(4, 20, 52); // #041434
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 26, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text("RO Construções e Incorporações", 14, 12);
      doc.setFontSize(11);
      doc.text(titulo, 14, 20);

      doc.setTextColor(90, 90, 90);
      doc.setFontSize(9);
      let y = 34;
      if (subtitulo) {
        doc.text(subtitulo, 14, y);
        y += 4;
      }
      doc.text(
        `Gerado em ${new Date().toLocaleString("pt-BR")}`,
        14,
        y,
      );
      y += 4;

      for (const secao of secoes) {
        if (secao.titulo) {
          y += 6;
          doc.setTextColor(4, 20, 52);
          doc.setFontSize(11);
          doc.text(secao.titulo, 14, y);
          y += 2;
        }
        autoTable(doc, {
          head: [secao.head],
          body: secao.body.map((r) => r.map((c) => String(c))),
          startY: y + 2,
          theme: "striped",
          headStyles: { fillColor: [30, 58, 95], textColor: 255 },
          styles: { fontSize: 9, cellPadding: 2 },
          margin: { left: 14, right: 14 },
        });
        // @ts-expect-error lastAutoTable é adicionado pelo plugin
        y = (doc.lastAutoTable?.finalY ?? y) + 4;
      }

      doc.save(`${arquivo}.pdf`);
      toast.success("PDF gerado");
    } catch (err) {
      console.error(err);
      toast.error("Falha ao gerar PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={gerar} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      Exportar PDF
    </Button>
  );
}
