import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { PacienteResponse, EstudioResponse, AnalisisResponse } from "@/lib/python-api";

// Registrar fuentes estándar para asegurar compatibilidad y estilos correctos
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
    { src: 'Helvetica-Oblique', fontStyle: 'italic' }
  ]
});

// Estilos premium para impresión clínica
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 50,
    color: "#1f2937", // Gris oscuro
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#047857", // Verde bosque elegante
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hospitalName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#047857",
  },
  docTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "right",
  },
  docSub: {
    fontSize: 8,
    color: "#6b7280",
    textAlign: "right",
    marginTop: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
    gap: 15,
  },
  sectionBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#4b5563",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  label: {
    color: "#6b7280",
    fontSize: 8.5,
  },
  value: {
    fontWeight: "bold",
    color: "#1f2937",
    fontSize: 8.5,
  },
  valueMono: {
    fontFamily: "Helvetica", // Helvetica funciona como mono si no cargamos una específica, o podemos usar Courier
    fontSize: 8,
    color: "#374151",
  },
  // Alertas de riesgo
  riesgoBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontWeight: "bold",
    fontSize: 9,
    textAlign: "center",
    marginTop: 4,
    alignSelf: "flex-start",
  },
  riesgoBAJO: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
  },
  riesgoMODERADO: {
    backgroundColor: "#ffedd5",
    color: "#9a3412",
  },
  riesgoCRITICO: {
    backgroundColor: "#ffe4e6",
    color: "#9f1239",
  },
  riesgoNO_EVALUADO: {
    backgroundColor: "#f3f4f6",
    color: "#374151",
  },
  // Informe IA
  reportSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  reportContent: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 12,
  },
  paragraph: {
    fontSize: 9.5,
    color: "#374151",
    marginBottom: 8,
    textAlign: "justify",
  },
  markdownH1: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#047857",
    marginTop: 12,
    marginBottom: 6,
  },
  markdownH2: {
    fontSize: 10.5,
    fontWeight: "bold",
    color: "#0f766e",
    marginTop: 10,
    marginBottom: 5,
  },
  markdownH3: {
    fontSize: 9.5,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 8,
    marginBottom: 4,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    paddingLeft: 10,
  },
  bullet: {
    width: 10,
    fontSize: 9.5,
    color: "#047857",
  },
  listText: {
    flex: 1,
    fontSize: 9.5,
    color: "#374151",
  },
  // Tabla de Hallazgos
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  tableColHeader: {
    fontWeight: "bold",
    color: "#374151",
    fontSize: 8.5,
  },
  tableColText: {
    color: "#4b5563",
    fontSize: 8.5,
  },
  colEtiqueta: { flex: 3 },
  colConfianza: { flex: 1.5, textAlign: "right", paddingRight: 10 },
  colCritico: { flex: 1.5, textAlign: "center" },
  badgeCritico: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    fontSize: 7.5,
    fontWeight: "bold",
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 3,
    alignSelf: "center",
  },
  badgeNormal: {
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
    fontSize: 7.5,
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 3,
    alignSelf: "center",
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerDisclaimer: {
    fontSize: 7,
    color: "#9ca3af",
    maxWidth: "80%",
  },
  pageNum: {
    fontSize: 7.5,
    color: "#9ca3af",
  },
});

// Helper para renderizar texto con marcas de formato de Markdown (**negrita**, *cursiva*, `código`, [enlaces])
const renderFormattedText = (text: string) => {
  // Regex para segmentar marcas de negrita, cursiva y código inline
  const regex = /(\*\*.*?\*\*|\*.*?\*|_.*?_|`.*?`)/g;
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Text key={index} style={{ fontWeight: "bold" }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return (
        <Text key={index} style={{ fontStyle: "italic" }}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <Text key={index} style={{ fontFamily: "Courier", fontSize: 8.5, backgroundColor: "#f3f4f6" }}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    
    // Limpieza de enlaces en formato [texto](url) -> texto
    let cleanText = part;
    const linkRegex = /\[(.*?)\]\(.*?\)/g;
    cleanText = cleanText.replace(linkRegex, "$1");
    
    return cleanText;
  });
};

// Parser robusto de Markdown para react-pdf
const parseMarkdownToPdf = (markdown: string | undefined) => {
  if (!markdown) return <Text style={styles.paragraph}>No hay informe clínico detallado disponible.</Text>;

  const lines = markdown.split("\n");
  let inCodeBlock = false;

  return lines.map((line, index) => {
    const text = line.trim();

    // Delimitador de bloques de código (```)
    if (text.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      return null;
    }

    if (inCodeBlock) {
      return (
        <Text key={index} style={[styles.paragraph, { fontFamily: "Courier", fontSize: 8, color: "#4b5563" }]}>
          {line}
        </Text>
      );
    }

    if (text === "") return <View key={index} style={{ height: 6 }} />;

    // Separadores horizontales (---, ***, ___)
    if (text === "---" || text === "***" || text === "___") {
      return (
        <View key={index} style={{ borderBottomWidth: 1, borderBottomColor: "#e5e7eb", marginVertical: 8 }} />
      );
    }

    // Encabezados
    if (text.startsWith("###")) {
      const content = text.replace("###", "").trim();
      return (
        <Text key={index} style={styles.markdownH3}>
          {renderFormattedText(content)}
        </Text>
      );
    }
    if (text.startsWith("##")) {
      const content = text.replace("##", "").trim();
      return (
        <Text key={index} style={styles.markdownH2}>
          {renderFormattedText(content)}
        </Text>
      );
    }
    if (text.startsWith("#")) {
      const content = text.replace("#", "").trim();
      return (
        <Text key={index} style={styles.markdownH1}>
          {renderFormattedText(content)}
        </Text>
      );
    }

    // Blockquotes (citas de texto)
    if (text.startsWith(">")) {
      const content = text.replace(">", "").trim();
      return (
        <View key={index} style={{ borderLeftWidth: 2, borderLeftColor: "#047857", paddingLeft: 8, marginVertical: 4 }}>
          <Text style={[styles.paragraph, { color: "#4b5563", fontStyle: "italic" }]}>
            {renderFormattedText(content)}
          </Text>
        </View>
      );
    }

    // Listas desordenadas
    if (text.startsWith("-") || text.startsWith("*")) {
      const content = text.substring(1).trim();
      return (
        <View key={index} style={styles.listItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.listText}>{renderFormattedText(content)}</Text>
        </View>
      );
    }

    // Listas ordenadas (1. 2. ...)
    const matchOrdered = text.match(/^(\d+)\.\s(.*)/);
    if (matchOrdered) {
      const num = matchOrdered[1];
      const content = matchOrdered[2];
      return (
        <View key={index} style={styles.listItem}>
          <Text style={[styles.bullet, { width: 15 }]}>{num}.</Text>
          <Text style={styles.listText}>{renderFormattedText(content)}</Text>
        </View>
      );
    }

    // Párrafo general
    return (
      <Text key={index} style={styles.paragraph}>
        {renderFormattedText(text)}
      </Text>
    );
  }).filter(el => el !== null);
};

interface ReportePDFDocumentProps {
  paciente: PacienteResponse;
  estudio: EstudioResponse;
  analisis: AnalisisResponse;
}

export function ReportePDFDocument({ paciente, estudio, analisis }: ReportePDFDocumentProps) {
  const fechaInforme = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const getRiesgoStyle = (nivel: string) => {
    switch (nivel) {
      case "BAJO": return styles.riesgoBAJO;
      case "MODERADO": return styles.riesgoMODERADO;
      case "CRITICO": return styles.riesgoCRITICO;
      default: return styles.riesgoNO_EVALUADO;
    }
  };

  const traducirRiesgo = (nivel: string) => {
    switch (nivel) {
      case "BAJO": return "Riesgo Bajo";
      case "MODERADO": return "Riesgo Moderado";
      case "CRITICO": return "Riesgo Crítico";
      default: return "No Evaluado";
    }
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Cabecera */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.hospitalName}>Medical AI System</Text>
            <View>
              <Text style={styles.docTitle}>INFORME CLÍNICO DE ESTUDIO</Text>
              <Text style={styles.docSub}>Análisis asistido por Inteligencia Artificial</Text>
            </View>
          </View>
        </View>

        {/* Sección de Datos */}
        <View style={styles.grid}>
          {/* Paciente */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Datos del Paciente</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Nombre:</Text>
              <Text style={styles.value}>{paciente.nombre} {paciente.apellido}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Doc. Identidad:</Text>
              <Text style={styles.value}>{paciente.documento_identidad}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>F. Nacimiento:</Text>
              <Text style={styles.value}>{paciente.fecha_nacimiento}</Text>
            </View>
          </View>

          {/* Estudio */}
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Datos del Estudio</Text>
            <View style={styles.row}>
              <Text style={styles.label}>ID Estudio:</Text>
              <Text style={[styles.value, styles.valueMono]}>{estudio.id.slice(0, 16)}...</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tipo de Estudio:</Text>
              <Text style={styles.value}>{estudio.mime_type || "Resonancia Magnética (MRI)"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>F. Informe:</Text>
              <Text style={styles.value}>{fechaInforme}</Text>
            </View>
          </View>
        </View>

        {/* Resumen del Análisis */}
        <View style={{ marginBottom: 15 }}>
          <Text style={[styles.sectionTitle, { fontSize: 10, color: "#1f2937" }]}>Resumen del Análisis de Diagnóstico</Text>
          <View style={{ flexDirection: "row", gap: 20, marginTop: 5 }}>
            <View style={{ flex: 1.5 }}>
              <Text style={styles.label}>Nivel de Riesgo:</Text>
              <Text style={[styles.riesgoBadge, getRiesgoStyle(analisis.nivel_riesgo)]}>
                {traducirRiesgo(analisis.nivel_riesgo)}
              </Text>
            </View>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={styles.label}>Hallazgos Totales:</Text>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1f2937" }}>{analisis.total_hallazgos}</Text>
            </View>
            <View style={{ flex: 1.2, justifyContent: "center" }}>
              <Text style={styles.label}>Hallazgos Críticos:</Text>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: analisis.hallazgos.some(h => h.es_critico) ? "#991b1b" : "#4b5563" }}>
                {analisis.hallazgos.filter(h => h.es_critico).length}
              </Text>
            </View>
          </View>
        </View>

        {/* Informe Clínico IA */}
        <View style={styles.reportSection}>
          <Text style={[styles.sectionTitle, { fontSize: 10, color: "#1f2937" }]}>Informe Médico de IA</Text>
          <View style={styles.reportContent}>
            {parseMarkdownToPdf(analisis.informe_avanzado_ia)}
          </View>
        </View>

        {/* Tabla de Hallazgos */}
        {analisis.hallazgos && analisis.hallazgos.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={[styles.sectionTitle, { fontSize: 10, color: "#1f2937" }]}>Hallazgos Patológicos Detectados</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableColHeader, styles.colEtiqueta]}>Patología / Hallazgo</Text>
                <Text style={[styles.tableColHeader, styles.colConfianza]}>Confianza</Text>
                <Text style={[styles.tableColHeader, styles.colCritico]}>Estado</Text>
              </View>
              {analisis.hallazgos.map((hallazgo, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableColText, styles.colEtiqueta, { fontWeight: hallazgo.es_critico ? "bold" : "normal" }]}>
                    {hallazgo.etiqueta}
                  </Text>
                  <Text style={[styles.tableColText, styles.colConfianza]}>
                    {(hallazgo.confianza * 100).toFixed(1)}%
                  </Text>
                  <View style={styles.colCritico}>
                    <Text style={hallazgo.es_critico ? styles.badgeCritico : styles.badgeNormal}>
                      {hallazgo.es_critico ? "Crítico" : "Normal"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerDisclaimer}>
            * Exclusión de responsabilidad: Este documento contiene un análisis preliminar asistido por modelos de Inteligencia Artificial (IA). No constituye un diagnóstico definitivo. Debe ser interpretado exclusivamente por un profesional médico calificado.
          </Text>
          <Text style={styles.pageNum} render={({ pageNumber, totalPages }) => (
            `Pág. ${pageNumber} de ${totalPages}`
          )} />
        </View>
      </Page>
    </Document>
  );
}
