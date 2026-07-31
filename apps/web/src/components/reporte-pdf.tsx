import {
  Document,
  Font,
  Image,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";

import type { ImagenAnotada } from "@/lib/anotar-imagen";
import { filtrarConfiables, UMBRAL_CONFIANZA } from "@/lib/hallazgos";
import type {
  AnalisisResponse,
  EstudioResponse,
  PacienteResponse,
  ReporteResponse,
} from "@/lib/python-api";

/** Azul hospitalario de marca. El PDF no resuelve variables CSS. */
const AZUL = "#005EB8";
const AZUL_OSCURO = "#00437F";
const AZUL_SUAVE = "#eff6ff";

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
    // Deja sitio al pie: el aviso de validez ocupa tres líneas.
    paddingBottom: 74,
    paddingHorizontal: 50,
    color: "#1f2937", // Gris oscuro
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: AZUL,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hospitalName: {
    fontSize: 14,
    fontWeight: "bold",
    color: AZUL,
  },
  hospitalUnit: {
    fontSize: 7.5,
    color: "#6b7280",
    marginTop: 1,
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
  // Aviso de validez legal del documento
  avisoValidez: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginBottom: 16,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  avisoPendiente: {
    backgroundColor: "#fffbeb",
    borderColor: "#f59e0b",
  },
  avisoValidado: {
    backgroundColor: "#ecfdf5",
    borderColor: "#059669",
  },
  avisoTitulo: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 2,
  },
  avisoTexto: {
    fontSize: 8,
    color: "#4b5563",
    lineHeight: 1.4,
  },
  // Informe clínico
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
    color: AZUL,
    marginTop: 12,
    marginBottom: 6,
  },
  markdownH2: {
    fontSize: 10.5,
    fontWeight: "bold",
    color: AZUL_OSCURO,
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
    color: AZUL,
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
  colCorte: { flex: 1, textAlign: "center" },
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
  // Imágenes con etiquetas
  galeria: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  galeriaItem: {
    width: "47%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 6,
  },
  galeriaImagen: {
    width: "100%",
    objectFit: "contain",
    borderRadius: 3,
  },
  galeriaCaption: {
    fontSize: 7.5,
    color: "#4b5563",
    marginTop: 4,
  },
  galeriaCaptionTitulo: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#1f2937",
  },
  leyenda: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 10,
    alignItems: "center",
  },
  leyendaItem: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  leyendaMuestra: {
    width: 9,
    height: 9,
    borderRadius: 2,
  },
  leyendaTexto: {
    fontSize: 7.5,
    color: "#4b5563",
  },
  // Validación médica
  firmaBox: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 12,
  },
  firmaLinea: {
    borderBottomWidth: 1,
    borderBottomColor: "#9ca3af",
    marginTop: 28,
    marginBottom: 4,
    width: "60%",
  },
  firmaPie: {
    fontSize: 7.5,
    color: "#6b7280",
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
        <View key={index} style={{ borderLeftWidth: 2, borderLeftColor: AZUL, paddingLeft: 8, marginVertical: 4 }}>
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

/** Insignia de marca. Mismo trazado que `components/logo.tsx`. */
function LogoPdf({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        d="M13,0 H35 A13,13 0 0 1 48,13 V35 A13,13 0 0 1 35,48 H13 A13,13 0 0 1 0,35 V13 A13,13 0 0 1 13,0 Z"
        fill={AZUL}
      />
      <Path d="M20,9 H28 V20 H39 V28 H28 V39 H20 V28 H9 V20 H20 Z" fill="#ffffff" />
    </Svg>
  );
}

function CabeceraPdf({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.headerBrand}>
          <LogoPdf />
          <View>
            <Text style={styles.hospitalName}>MedImaging</Text>
            <Text style={styles.hospitalUnit}>Unidad de Diagnóstico por Imagen</Text>
          </View>
        </View>
        <View>
          <Text style={styles.docTitle}>{titulo}</Text>
          <Text style={styles.docSub}>{subtitulo}</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Pie fijo. Se repite en cada página porque `fixed` sólo alcanza a la página
 * donde se declara: el aviso de validez debe aparecer en todas.
 */
function PiePdf() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerDisclaimer}>
        * Documento de apoyo al diagnóstico. Este informe sólo es válido si es revisado,
        validado y firmado por un médico. Sin esa validación su contenido es preliminar y
        no constituye un diagnóstico.
      </Text>
      <Text
        style={styles.pageNum}
        render={({ pageNumber, totalPages }) => `Pág. ${pageNumber} de ${totalPages}`}
      />
    </View>
  );
}

interface ReportePDFDocumentProps {
  paciente: PacienteResponse;
  estudio: EstudioResponse;
  analisis: AnalisisResponse;
  /** Estado de validación médica. Sin él, el informe se marca como pendiente. */
  reporte?: ReporteResponse | null;
  /** Cortes rasterizados con los bboxes y etiquetas ya dibujados. */
  imagenesAnotadas?: ImagenAnotada[];
}

export function ReportePDFDocument({
  paciente,
  estudio,
  analisis,
  reporte = null,
  imagenesAnotadas = [],
}: ReportePDFDocumentProps) {
  const fechaInforme = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Sólo entran al informe las etiquetas que superan el umbral de confianza;
  // los totales se recalculan sobre ellas para que cuadren con la tabla.
  const hallazgos = filtrarConfiables(analisis.hallazgos);
  const criticos = hallazgos.filter((h) => h.es_critico);
  const umbralPct = Math.round(UMBRAL_CONFIANZA * 100);

  const validado = reporte?.estado === "APROBADO";
  const fechaValidacion = reporte?.aprobado_en
    ? new Date(reporte.aprobado_en).toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const cortesConHallazgos = imagenesAnotadas.filter((img) => img.hallazgos.length > 0).length;

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
        <CabeceraPdf titulo="INFORME RADIOLÓGICO DE ESTUDIO" subtitulo={`Emitido el ${fechaInforme}`} />

        {/* Validez del documento — lo primero que debe leerse */}
        <View
          style={[styles.avisoValidez, validado ? styles.avisoValidado : styles.avisoPendiente]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.avisoTitulo, { color: validado ? "#065f46" : "#92400e" }]}>
              {validado
                ? "INFORME VALIDADO POR UN MÉDICO"
                : "PENDIENTE DE VALIDACIÓN MÉDICA — SIN VALIDEZ CLÍNICA"}
            </Text>
            <Text style={styles.avisoTexto}>
              {validado
                ? `Este informe fue revisado y validado por un médico${fechaValidacion ? ` el ${fechaValidacion}` : ""}. Su validez deriva exclusivamente de esa validación.`
                : "Este informe sólo es válido si es validado por un médico. Hasta que sea revisado, validado y firmado, su contenido es preliminar y no debe utilizarse como diagnóstico."}
            </Text>
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
          <Text style={[styles.sectionTitle, { fontSize: 10, color: "#1f2937" }]}>Resumen del Estudio</Text>
          <View style={{ flexDirection: "row", gap: 20, marginTop: 5 }}>
            <View style={{ flex: 1.5 }}>
              <Text style={styles.label}>Nivel de Riesgo:</Text>
              <Text style={[styles.riesgoBadge, getRiesgoStyle(analisis.nivel_riesgo)]}>
                {traducirRiesgo(analisis.nivel_riesgo)}
              </Text>
            </View>
            <View style={{ flex: 1, justifyContent: "center" }}>
              <Text style={styles.label}>Hallazgos Totales:</Text>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1f2937" }}>{hallazgos.length}</Text>
            </View>
            <View style={{ flex: 1.2, justifyContent: "center" }}>
              <Text style={styles.label}>Hallazgos Críticos:</Text>
              <Text style={{ fontSize: 16, fontWeight: "bold", color: criticos.length > 0 ? "#991b1b" : "#4b5563" }}>
                {criticos.length}
              </Text>
            </View>
          </View>
        </View>

        {/* Informe clínico */}
        <View style={styles.reportSection}>
          <Text style={[styles.sectionTitle, { fontSize: 10, color: "#1f2937" }]}>Informe Radiológico</Text>
          <View style={styles.reportContent}>
            {parseMarkdownToPdf(analisis.informe_avanzado_ia)}
          </View>
        </View>

        {/* Observaciones que el médico añadió durante la revisión */}
        {reporte?.observaciones?.trim() ? (
          <View style={{ marginBottom: 15 }}>
            <Text style={[styles.sectionTitle, { fontSize: 10, color: "#1f2937" }]}>
              Observaciones del Médico
            </Text>
            <View style={styles.reportContent}>
              <Text style={styles.paragraph}>{reporte.observaciones.trim()}</Text>
            </View>
          </View>
        ) : null}

        {/* Tabla de Hallazgos */}
        {hallazgos.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={[styles.sectionTitle, { fontSize: 10, color: "#1f2937" }]}>Hallazgos Detectados</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableColHeader, styles.colEtiqueta]}>Patología / Hallazgo</Text>
                <Text style={[styles.tableColHeader, styles.colCorte]}>Corte</Text>
                <Text style={[styles.tableColHeader, styles.colConfianza]}>Confianza</Text>
                <Text style={[styles.tableColHeader, styles.colCritico]}>Estado</Text>
              </View>
              {hallazgos.map((hallazgo, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableColText, styles.colEtiqueta, { fontWeight: hallazgo.es_critico ? "bold" : "normal" }]}>
                    {hallazgo.etiqueta}
                  </Text>
                  <Text style={[styles.tableColText, styles.colCorte]}>
                    {hallazgo.image_index + 1}
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
            <Text style={[styles.footerDisclaimer, { maxWidth: "100%", marginTop: -14 }]}>
              Sólo se listan los hallazgos con una confianza igual o superior al {umbralPct}%.
            </Text>
          </View>
        )}

        {/* Validación médica + firma */}
        <View style={styles.firmaBox} wrap={false}>
          <Text style={styles.sectionTitle}>Validación Médica</Text>
          {validado ? (
            <View>
              <View style={styles.row}>
                <Text style={styles.label}>Estado:</Text>
                <Text style={styles.value}>Validado por un médico</Text>
              </View>
              {fechaValidacion && (
                <View style={styles.row}>
                  <Text style={styles.label}>Fecha de validación:</Text>
                  <Text style={styles.value}>{fechaValidacion}</Text>
                </View>
              )}
              {reporte?.aprobado_por && (
                <View style={styles.row}>
                  <Text style={styles.label}>Ref. del validador:</Text>
                  <Text style={[styles.value, styles.valueMono]}>{reporte.aprobado_por}</Text>
                </View>
              )}
            </View>
          ) : (
            <View>
              <Text style={styles.avisoTexto}>
                El informe queda sin validez hasta que un médico lo revise y lo firme.
              </Text>
              <View style={styles.firmaLinea} />
              <Text style={styles.firmaPie}>Nombre, firma y sello del médico</Text>
              <Text style={[styles.firmaPie, { marginTop: 6 }]}>Fecha: ____ / ____ / ________</Text>
            </View>
          )}
        </View>

        <PiePdf />
      </Page>

      {/* Cortes del estudio con los hallazgos señalizados sobre la imagen */}
      {imagenesAnotadas.length > 0 && (
        <Page size="LETTER" style={styles.page}>
          <CabeceraPdf
            titulo="IMÁGENES DEL ESTUDIO"
            subtitulo={`${imagenesAnotadas.length} corte(s) · ${cortesConHallazgos} con hallazgos`}
          />

          <View style={styles.leyenda}>
            <View style={styles.leyendaItem}>
              <View style={[styles.leyendaMuestra, { backgroundColor: "#dc2626" }]} />
              <Text style={styles.leyendaTexto}>Hallazgo crítico</Text>
            </View>
            <View style={styles.leyendaItem}>
              <View style={[styles.leyendaMuestra, { backgroundColor: "#0284c7" }]} />
              <Text style={styles.leyendaTexto}>Hallazgo no crítico</Text>
            </View>
            <Text style={styles.leyendaTexto}>
              Cada recuadro indica la región detectada y su confianza (≥ {umbralPct}%).
            </Text>
          </View>

          <View style={styles.galeria}>
            {imagenesAnotadas.map((img) => (
              <View key={img.index} style={styles.galeriaItem} wrap={false}>
                <Image src={img.dataUrl} style={styles.galeriaImagen} />
                <Text style={styles.galeriaCaptionTitulo}>Corte {img.index + 1}</Text>
                <Text style={styles.galeriaCaption}>
                  {img.hallazgos.length === 0
                    ? "Sin hallazgos etiquetados."
                    : img.hallazgos
                        .map((h) => `${h.etiqueta} ${Math.round(h.confianza * 100)}%`)
                        .join(" · ")}
                </Text>
              </View>
            ))}
          </View>

          <PiePdf />
        </Page>
      )}
    </Document>
  );
}
