const repo = require("./reportes.repository");
const PDFDocument = require("pdfkit");
const path = require("path");

const LOGO_PATH = path.join(__dirname, "..", "..", "assets", "upel-logo.png");

// ── Colores institucionales UPEL ──────────────────────────
const AZUL = "#2b6cb0";
const VERDE = "#276749";
const NEGRO = "#1a202c";
const GRIS = "#718096";
const GRIS2 = "#e2e8f0";

// ════════════════════════════════════════════════════════════
// FUNCIONES PÚBLICAS
// ════════════════════════════════════════════════════════════

async function generarReportePorMaestria(maestria_id, periodo_id) {
  const maestria = repo.obtenerMaestria(maestria_id);
  if (!maestria) throw { status: 404, mensaje: "Maestría no encontrada" };

  const filas = repo.obtenerFilasPorMaestria(maestria_id, periodo_id);
  if (filas.length === 0)
    throw { status: 404, mensaje: "No hay datos para generar el reporte" };

  let periodoNombre = "Todos los períodos";
  if (periodo_id) {
    const p = filas[0]?.periodo;
    if (p) periodoNombre = `Período ${p}`;
  }

  return generarPDF(filas, maestria.nombre, periodoNombre, true);
}

async function generarReportePorEstudiante(cedula) {
  const alumno = repo.obtenerAlumnoPorCI(cedula);
  if (!alumno) throw { status: 404, mensaje: "Estudiante no encontrado" };

  const filas = repo.obtenerFilasPorEstudiante(cedula);
  if (filas.length === 0)
    throw { status: 404, mensaje: "No hay datos para generar el reporte" };

  return generarPDF(filas, filas[0].maestria, filas[0].periodo, false);
}

async function generarResumenPeriodo(periodo_id) {
  const filas = repo.obtenerResumenPorPeriodo(periodo_id);
  if (!filas || filas.length === 0) {
    throw { status: 404, mensaje: "No hay datos para este período" };
  }
  return generarPDFResumen(filas, periodo_id);
}

// ════════════════════════════════════════════════════════════
// GENERADOR PDF PRINCIPAL
// ════════════════════════════════════════════════════════════

function generarPDF(filas, nombreMaestria, periodo, incluirTotal) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        layout: "landscape",
      });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const PW = doc.page.width; // 841
      const PH = doc.page.height; // 595
      const M = 40; // margen

      // ── Encabezado ──────────────────────────────────
      dibujarEncabezado(doc, PW, M, nombreMaestria, periodo);

      // ── Tabla de datos ───────────────────────────────
      const tableTop = 185;
      const bottom = dibujarTabla(doc, filas, M, tableTop, PW, PH);

      // ── Total general (solo por maestría) ────────────
      let y = bottom + 10;
      if (incluirTotal) {
        const total = filas.reduce((acc, f, i) => {
          // sumar solo una vez por estudiante
          const prev = filas[i - 1];
          if (!prev || prev.cedula !== f.cedula) acc += f.total_pagado || 0;
          return acc;
        }, 0);

        doc
          .fontSize(9)
          .font("Helvetica-Bold")
          .fillColor(AZUL)
          .text(`TOTAL GENERAL RECAUDADO: $${total.toFixed(2)} USD`, M, y, {
            align: "right",
            width: PW - M * 2,
          });
        y += 18;
      }

      // ── Zona de firmas ───────────────────────────────
      dibujarFirmas(doc, PW, M, y + 20, PH);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ════════════════════════════════════════════════════════════
// GENERADOR PDF RESUMEN
// ════════════════════════════════════════════════════════════

function generarPDFResumen(filas, periodo_codigo) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const PW = doc.page.width;
      const M = 40;

      // Encabezado
      try {
        doc.image(LOGO_PATH, M, 30, { width: 60 });
      } catch {
        /* sin logo */
      }

      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor(AZUL)
        .text("UNIVERSIDAD PEDAGÓGICA EXPERIMENTAL LIBERTADOR", M + 70, 32, {
          width: PW - M * 2 - 70,
          align: "center",
        });
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(NEGRO)
        .text(
          "INSTITUTO DE MEJORAMIENTO PROFESIONAL DEL MAGISTERIO",
          M + 70,
          48,
          { width: PW - M * 2 - 70, align: "center" },
        )
        .text("SUBDIRECCIÓN DE INVESTIGACIÓN Y POSTGRADO", M + 70, 61, {
          width: PW - M * 2 - 70,
          align: "center",
        })
        .text("EXTENSIÓN ACADÉMICA: MARACAIBO", M + 70, 74, {
          width: PW - M * 2 - 70,
          align: "center",
        });

      doc.moveDown(0.5);
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor(VERDE)
        .text("RESUMEN DE INGRESOS POR PERÍODO", M, 100, {
          align: "center",
          width: PW - M * 2,
        });

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor(NEGRO)
        .text(`Período Académico: ${periodo_codigo || "Todos"}`, M, 118, {
          align: "center",
          width: PW - M * 2,
        });

      // Línea separadora
      doc
        .moveTo(M, 134)
        .lineTo(PW - M, 134)
        .strokeColor(AZUL)
        .lineWidth(1.5)
        .stroke();

      // Tabla resumen
      const colX = [M, M + 280, M + 380, M + 460];
      const colW = [280, 100, 80, 80];
      let y = 148;

      // Cabecera tabla
      doc.rect(M, y, PW - M * 2, 18).fill(AZUL);
      doc.fontSize(8).font("Helvetica-Bold").fillColor("#ffffff");
      const headers = [
        "MAESTRÍA / PROGRAMA",
        "ESTUDIANTES",
        "RECAUDADO (USD)",
        "PENDIENTE (USD)",
      ];
      headers.forEach((h, i) => {
        doc.text(h, colX[i] + 4, y + 5, {
          width: colW[i] - 8,
          align: i === 0 ? "left" : "center",
        });
      });
      y += 18;

      // Filas
      let totalGeneral = 0;
      let totalEst = 0;
      filas.forEach((f, idx) => {
        const bg = idx % 2 === 0 ? "#ffffff" : "#f7fafc";
        doc.rect(M, y, PW - M * 2, 16).fill(bg);
        doc
          .fontSize(8)
          .font("Helvetica")
          .fillColor(NEGRO)
          .text(f.maestria, colX[0] + 4, y + 4, { width: colW[0] - 8 })
          .text(String(f.estudiantes), colX[1] + 4, y + 4, {
            width: colW[1] - 8,
            align: "center",
          })
          .text(`$${Number(f.recaudado || 0).toFixed(2)}`, colX[2] + 4, y + 4, {
            width: colW[2] - 8,
            align: "center",
          })
          .text(`$${Number(f.pendiente || 0).toFixed(2)}`, colX[3] + 4, y + 4, {
            width: colW[3] - 8,
            align: "center",
          });

        // borde fila
        doc
          .rect(M, y, PW - M * 2, 16)
          .strokeColor(GRIS2)
          .lineWidth(0.3)
          .stroke();
        totalGeneral += Number(f.recaudado || 0);
        totalEst += Number(f.estudiantes || 0);
        y += 16;
      });

      // Fila total
      doc.rect(M, y, PW - M * 2, 18).fill(VERDE);
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#ffffff")
        .text("TOTAL GENERAL", colX[0] + 4, y + 5, { width: colW[0] - 8 })
        .text(String(totalEst), colX[1] + 4, y + 5, {
          width: colW[1] - 8,
          align: "center",
        })
        .text(`$${totalGeneral.toFixed(2)}`, colX[2] + 4, y + 5, {
          width: colW[2] - 8,
          align: "center",
        });
      y += 18;

      // Firmas
      dibujarFirmas(doc, PW, M, y + 40, doc.page.height);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function dibujarEncabezado(doc, PW, M, nombreMaestria, periodo) {
  // Logo
  try {
    doc.image(LOGO_PATH, M, 20, { width: 55 });
  } catch {
    /* sin logo */
  }

  // Textos institucionales
  const tx = M + 65;
  doc
    .fontSize(10)
    .font("Helvetica-Bold")
    .fillColor(AZUL)
    .text("REPÚBLICA BOLIVARIANA DE VENEZUELA", tx, 22, {
      width: PW - tx - M,
      align: "center",
    });
  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor(NEGRO)
    .text("UNIVERSIDAD PEDAGÓGICA EXPERIMENTAL LIBERTADOR", tx, 36, {
      width: PW - tx - M,
      align: "center",
    });
  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor(NEGRO)
    .text("INSTITUTO DE MEJORAMIENTO PROFESIONAL DEL MAGISTERIO", tx, 50, {
      width: PW - tx - M,
      align: "center",
    })
    .text("SUBDIRECCIÓN DE INVESTIGACIÓN Y POSTGRADO", tx, 62, {
      width: PW - tx - M,
      align: "center",
    });

  // Línea dorada
  doc
    .moveTo(M, 78)
    .lineTo(PW - M, 78)
    .strokeColor("#c9973a")
    .lineWidth(1.5)
    .stroke();

  // Título del reporte
  doc
    .fontSize(11)
    .font("Helvetica-Bold")
    .fillColor(VERDE)
    .text("RELACIÓN DE PAGOS DE LOS ESTUDIANTES", M, 86, {
      align: "center",
      width: PW - M * 2,
    });

  // Info del reporte
  doc
    .fontSize(8.5)
    .font("Helvetica")
    .fillColor(NEGRO)
    .text(`EXTENSIÓN ACADÉMICA: MARACAIBO`, M, 103, { continued: true })
    .text(`PERÍODO ACADÉMICO: ${periodo}`, { align: "right" });

  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .fillColor(AZUL)
    .text(`MAESTRÍA: ${nombreMaestria.toUpperCase()}`, M, 116, {
      align: "center",
      width: PW - M * 2,
    });

  // Fecha de generación
  doc
    .fontSize(7.5)
    .font("Helvetica")
    .fillColor(GRIS)
    .text(`Generado: ${new Date().toLocaleDateString("es-VE")}`, M, 130, {
      align: "right",
      width: PW - M * 2,
    });

  // Línea separadora
  doc
    .moveTo(M, 140)
    .lineTo(PW - M, 140)
    .strokeColor(GRIS2)
    .lineWidth(0.8)
    .stroke();
}

function dibujarTabla(doc, filas, M, tableTop, PW, PH) {
  // Definir columnas
  const cols = [
    { label: "Nº", w: 20, align: "center" },
    { label: "APELLIDOS Y NOMBRES", w: 145, align: "left" },
    { label: "C.I.", w: 55, align: "center" },
    { label: "COSTO\nPERÍODO", w: 42, align: "center" },
    { label: "FECHA\n1RA", w: 44, align: "center" },
    { label: "MONTO\n1RA", w: 44, align: "center" },
    { label: "REF.\n1RA", w: 62, align: "center" },
    { label: "FECHA\n2DA", w: 44, align: "center" },
    { label: "MONTO\n2DA", w: 44, align: "center" },
    { label: "REF.\n2DA", w: 62, align: "center" },
    { label: "FECHA\n3RA", w: 44, align: "center" },
    { label: "MONTO\n3RA", w: 44, align: "center" },
    { label: "REF.\n3RA", w: 62, align: "center" },
    { label: "TOTAL\nPAGADO", w: 48, align: "center" },
  ];

  // Calcular posiciones X
  let x = M;
  cols.forEach((c) => {
    c.x = x;
    x += c.w;
  });

  const ROW_H = 20;
  const HEAD_H = 28;

  // Cabecera
  doc.rect(M, tableTop, PW - M * 2, HEAD_H).fill(AZUL);
  doc.fontSize(6.5).font("Helvetica-Bold").fillColor("#ffffff");
  cols.forEach((c) => {
    doc.text(c.label, c.x + 2, tableTop + 4, {
      width: c.w - 4,
      align: c.align,
      lineGap: 1,
    });
  });

  // Agrupar filas por estudiante
  const estudiantes = agruparPorEstudiante(filas);
  let y = tableTop + HEAD_H;
  let num = 1;

  estudiantes.forEach((est) => {
    // Nueva página si no hay espacio
    if (y + ROW_H > PH - 120) {
      doc.addPage({ size: "A4", layout: "landscape", margin: 40 });
      y = M + 10;
      // Repetir cabecera
      doc.rect(M, y, PW - M * 2, HEAD_H).fill(AZUL);
      doc.fontSize(6.5).font("Helvetica-Bold").fillColor("#ffffff");
      cols.forEach((c) => {
        doc.text(c.label, c.x + 2, y + 4, {
          width: c.w - 4,
          align: c.align,
          lineGap: 1,
        });
      });
      y += HEAD_H;
    }

    const bg = num % 2 === 0 ? "#f7fafc" : "#ffffff";
    doc.rect(M, y, PW - M * 2, ROW_H).fill(bg);

    // Datos del estudiante
    const cuotas = est.cuotas;
    const c1 = cuotas[0] || {};
    const c2 = cuotas[1] || {};
    const c3 = cuotas[2] || {};

    const valores = [
      String(num),
      est.nombre,
      est.cedula,
      `$${Number(est.costo_usd || 0).toFixed(2)}`,
      formatFecha(c1.fecha_pago),
      c1.monto_usd ? `$${Number(c1.monto_usd).toFixed(2)}` : "",
      c1.referencia || "",
      formatFecha(c2.fecha_pago),
      c2.monto_usd ? `$${Number(c2.monto_usd).toFixed(2)}` : "",
      c2.referencia || "",
      formatFecha(c3.fecha_pago),
      c3.monto_usd ? `$${Number(c3.monto_usd).toFixed(2)}` : "",
      c3.referencia || "",
      `$${Number(est.total_pagado || 0).toFixed(2)}`,
    ];

    doc.fontSize(6.5).font("Helvetica").fillColor(NEGRO);
    valores.forEach((v, i) => {
      doc.text(v, cols[i].x + 2, y + 6, {
        width: cols[i].w - 4,
        align: cols[i].align,
        ellipsis: true,
        lineBreak: false,
      });
    });

    // Borde fila
    doc
      .rect(M, y, PW - M * 2, ROW_H)
      .strokeColor(GRIS2)
      .lineWidth(0.3)
      .stroke();
    y += ROW_H;
    num++;
  });

  return y;
}

function dibujarFirmas(doc, PW, M, yInicio, PH) {
  // Si no hay espacio, nueva página
  if (yInicio + 90 > PH - 20) {
    doc.addPage({ size: "A4", layout: "landscape", margin: 40 });
    yInicio = 60;
  }

  const firmantes = [
    "COORDINADOR(A) DE POSTGRADO",
    "ADMINISTRADORA DE SUBDIRECCIÓN\nDE INV. Y POSTGRADO",
    "SUBDIRECTOR(A) DE INVESTIGACIÓN\nY POSTGRADO",
  ];

  const fw = (PW - M * 2) / 3;
  const fy = yInicio + 30;

  // Línea superior zona firmas
  doc
    .moveTo(M, yInicio)
    .lineTo(PW - M, yInicio)
    .strokeColor(GRIS2)
    .lineWidth(0.8)
    .stroke();

  firmantes.forEach((nombre, i) => {
    const fx = M + fw * i + fw * 0.1;
    const fw2 = fw * 0.8;

    // Línea de firma
    doc
      .moveTo(fx, fy + 30)
      .lineTo(fx + fw2, fy + 30)
      .strokeColor(NEGRO)
      .lineWidth(0.8)
      .stroke();

    // Cargo
    doc
      .fontSize(7)
      .font("Helvetica-Bold")
      .fillColor(NEGRO)
      .text(nombre, fx, fy + 34, { width: fw2, align: "center" });
  });
}

function agruparPorEstudiante(filas) {
  const map = new Map();
  filas.forEach((f) => {
    if (!map.has(f.cedula)) {
      map.set(f.cedula, {
        cedula: f.cedula,
        nombre: `${f.apellidos}, ${f.nombres}`,
        costo_usd: f.costo_usd,
        total_pagado: f.total_pagado,
        cuotas: [],
      });
    }
    if (f.cuota_numero) {
      map.get(f.cedula).cuotas.push({
        fecha_pago: f.fecha_pago,
        monto_usd: f.monto_usd,
        referencia: f.referencia,
      });
    }
  });
  return Array.from(map.values());
}

function formatFecha(str) {
  if (!str) return "";
  const [y, m, d] = str.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}

module.exports = {
  generarReportePorMaestria,
  generarReportePorEstudiante,
  generarResumenPeriodo,
};
