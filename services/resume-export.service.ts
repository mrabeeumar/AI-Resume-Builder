import { createElement } from "react";
import {
  Document as PdfDocument,
  Page as PdfPage,
  StyleSheet,
  Text as PdfText,
  View as PdfView,
  renderToBuffer,
} from "@react-pdf/renderer";
import {
  AlignmentType,
  BorderStyle,
  convertMillimetersToTwip,
  Document as DocxDocument,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  TextRun,
} from "docx";

import type {
  PageSize,
  ResumePageColor,
  ResumeTemplateId,
  ResumeThemeColor,
} from "@/lib/enums";
import { PAGE_COLOR_HEX, PAGE_SIZE_DIMENSIONS_MM } from "@/lib/resume-templates";
import { listSectionsForResume } from "@/services/resume-section.service";
import { getOwnedResumeOrThrow } from "@/services/resume.service";
import type {
  CertificationsContent,
  CustomContent,
  EducationContent,
  ExperienceContent,
  PersonalInfoContent,
  ProjectsContent,
  ResumeSectionItem,
  SkillsContent,
  SummaryContent,
} from "@/types/resume-section";
import { getSectionHeading } from "@/types/resume-section";

type ExportItem = { primary?: string; secondary?: string; body?: string };
type ExportBlock = {
  heading: string;
  paragraph?: string;
  items?: ExportItem[];
  tags?: string[];
};
type ExportModel = {
  title: string;
  personalInfo: PersonalInfoContent;
  blocks: ExportBlock[];
  templateId: ResumeTemplateId;
  themeColor: ResumeThemeColor;
  pageColor: ResumePageColor;
  pageSize: PageSize;
};

// Hex equivalents of the Tailwind swatches in THEME_COLOR_CLASSES, since
// react-pdf/docx render outside the browser and can't resolve Tailwind classes.
const THEME_COLOR_HEX: Record<ResumeThemeColor, string> = {
  SLATE: "#475569",
  BLUE: "#2563eb",
  EMERALD: "#059669",
  ROSE: "#e11d48",
};

type HeaderVariant = "underline" | "banner" | "card" | "leftBar" | "doubleRule" | "plain";
type SectionRule = "line" | "leftBorder" | "none";

type TemplateExportStyle = {
  fontFamily: "Helvetica" | "Times-Roman" | "Courier";
  fontFamilyBold: "Helvetica-Bold" | "Times-Bold" | "Courier-Bold";
  docxFont: "Calibri" | "Times New Roman" | "Courier New";
  headerAlign: "left" | "center";
  headerVariant: HeaderVariant;
  sectionRule: SectionRule;
  compact: boolean;
  uppercaseHeadings: boolean;
  letterSpacedHeader: boolean;
};

// One entry per RESUME_TEMPLATE_IDS value — keeps PDF/DOCX exports visually
// distinct per template, mirroring (not pixel-matching) the on-screen templates
// in components/resume/templates/*.
const TEMPLATE_EXPORT_STYLES: Record<ResumeTemplateId, TemplateExportStyle> = {
  CLASSIC: {
    fontFamily: "Helvetica",
    fontFamilyBold: "Helvetica-Bold",
    docxFont: "Calibri",
    headerAlign: "left",
    headerVariant: "underline",
    sectionRule: "line",
    compact: false,
    uppercaseHeadings: true,
    letterSpacedHeader: false,
  },
  MODERN: {
    fontFamily: "Helvetica",
    fontFamilyBold: "Helvetica-Bold",
    docxFont: "Calibri",
    headerAlign: "left",
    headerVariant: "banner",
    sectionRule: "line",
    compact: false,
    uppercaseHeadings: true,
    letterSpacedHeader: false,
  },
  MINIMAL: {
    fontFamily: "Helvetica",
    fontFamilyBold: "Helvetica-Bold",
    docxFont: "Calibri",
    headerAlign: "left",
    headerVariant: "plain",
    sectionRule: "none",
    compact: false,
    uppercaseHeadings: false,
    letterSpacedHeader: false,
  },
  PROFESSIONAL: {
    fontFamily: "Helvetica",
    fontFamilyBold: "Helvetica-Bold",
    docxFont: "Calibri",
    headerAlign: "center",
    headerVariant: "doubleRule",
    sectionRule: "line",
    compact: false,
    uppercaseHeadings: true,
    letterSpacedHeader: false,
  },
  COMPACT: {
    fontFamily: "Helvetica",
    fontFamilyBold: "Helvetica-Bold",
    docxFont: "Calibri",
    headerAlign: "left",
    headerVariant: "underline",
    sectionRule: "line",
    compact: true,
    uppercaseHeadings: true,
    letterSpacedHeader: false,
  },
  EXECUTIVE: {
    fontFamily: "Helvetica",
    fontFamilyBold: "Helvetica-Bold",
    docxFont: "Calibri",
    headerAlign: "left",
    headerVariant: "leftBar",
    sectionRule: "line",
    compact: false,
    uppercaseHeadings: true,
    letterSpacedHeader: false,
  },
  TECHNICAL: {
    fontFamily: "Courier",
    fontFamilyBold: "Courier-Bold",
    docxFont: "Courier New",
    headerAlign: "left",
    headerVariant: "underline",
    sectionRule: "line",
    compact: false,
    uppercaseHeadings: true,
    letterSpacedHeader: false,
  },
  TIMELINE: {
    fontFamily: "Helvetica",
    fontFamilyBold: "Helvetica-Bold",
    docxFont: "Calibri",
    headerAlign: "left",
    headerVariant: "plain",
    sectionRule: "leftBorder",
    compact: false,
    uppercaseHeadings: true,
    letterSpacedHeader: false,
  },
  ELEGANT: {
    fontFamily: "Times-Roman",
    fontFamilyBold: "Times-Bold",
    docxFont: "Times New Roman",
    headerAlign: "center",
    headerVariant: "plain",
    sectionRule: "line",
    compact: false,
    uppercaseHeadings: true,
    letterSpacedHeader: true,
  },
  BOLD: {
    fontFamily: "Helvetica",
    fontFamilyBold: "Helvetica-Bold",
    docxFont: "Calibri",
    headerAlign: "left",
    headerVariant: "banner",
    sectionRule: "line",
    compact: false,
    uppercaseHeadings: true,
    letterSpacedHeader: false,
  },
  CREATIVE: {
    fontFamily: "Helvetica",
    fontFamilyBold: "Helvetica-Bold",
    docxFont: "Calibri",
    headerAlign: "left",
    headerVariant: "card",
    sectionRule: "line",
    compact: false,
    uppercaseHeadings: false,
    letterSpacedHeader: false,
  },
  ACADEMIC: {
    fontFamily: "Times-Roman",
    fontFamilyBold: "Times-Bold",
    docxFont: "Times New Roman",
    headerAlign: "left",
    headerVariant: "underline",
    sectionRule: "line",
    compact: false,
    uppercaseHeadings: false,
    letterSpacedHeader: false,
  },
};

function joined(parts: Array<string | undefined | null>, separator: string) {
  const value = parts.filter(Boolean).join(separator);
  return value.length > 0 ? value : undefined;
}

function buildExportModel(resume: {
  title: string;
  sections: ResumeSectionItem[];
  templateId: ResumeTemplateId;
  themeColor: ResumeThemeColor;
  pageColor: ResumePageColor;
  pageSize: PageSize;
}): ExportModel {
  const personalSection = resume.sections.find(
    (section) => section.type === "PERSONAL_INFO",
  );
  const personalInfo = (personalSection?.content ?? {}) as PersonalInfoContent;

  const blocks: ExportBlock[] = [];

  for (const section of resume.sections) {
    if (section.hidden || section.type === "PERSONAL_INFO") continue;
    const heading = getSectionHeading(section);

    if (section.type === "SUMMARY") {
      const content = section.content as SummaryContent;
      if (content.text) blocks.push({ heading, paragraph: content.text });
      continue;
    }

    if (section.type === "EXPERIENCE") {
      const content = section.content as ExperienceContent;
      const items = content.items.map((item) => ({
        primary: joined([item.role, item.company], " · "),
        secondary: joined(
          [item.startDate, item.current ? "Present" : item.endDate],
          " — ",
        ),
        body: joined([item.location, item.description], "\n"),
      }));
      if (items.length > 0) blocks.push({ heading, items });
      continue;
    }

    if (section.type === "EDUCATION") {
      const content = section.content as EducationContent;
      const items = content.items.map((item) => ({
        primary: joined([item.degree, item.fieldOfStudy], ", "),
        secondary: joined([item.startDate, item.endDate], " — "),
        body: joined([item.school, item.description], "\n"),
      }));
      if (items.length > 0) blocks.push({ heading, items });
      continue;
    }

    if (section.type === "SKILLS") {
      const content = section.content as SkillsContent;
      if (content.items.length > 0) blocks.push({ heading, tags: content.items });
      continue;
    }

    if (section.type === "PROJECTS") {
      const content = section.content as ProjectsContent;
      const items = content.items.map((item) => ({
        primary: item.name || undefined,
        secondary: item.technologies || undefined,
        body: joined([item.url, item.description], "\n"),
      }));
      if (items.length > 0) blocks.push({ heading, items });
      continue;
    }

    if (section.type === "CERTIFICATIONS") {
      const content = section.content as CertificationsContent;
      const items = content.items.map((item) => ({
        primary: joined([item.name, item.issuer], " · "),
        secondary: item.date || undefined,
      }));
      if (items.length > 0) blocks.push({ heading, items });
      continue;
    }

    if (section.type === "CUSTOM") {
      const content = section.content as CustomContent;
      const items = content.items.map((item) => ({
        primary: item.title || undefined,
        secondary: joined([item.subtitle, item.date], " · "),
        body: item.description || undefined,
      }));
      if (items.length > 0) blocks.push({ heading, items });
    }
  }

  return {
    title: resume.title,
    personalInfo,
    blocks,
    templateId: resume.templateId,
    themeColor: resume.themeColor,
    pageColor: resume.pageColor,
    pageSize: resume.pageSize,
  };
}

function sanitizeFilename(title: string) {
  const cleaned = title
    .replace(/[\r\n]+/g, " ")
    .replace(/[\\/:*?"<>|]+/g, "")
    .trim();
  return cleaned.length > 0 ? cleaned : "resume";
}

async function loadExportModel(resumeId: string, userId: string) {
  const resume = await getOwnedResumeOrThrow(resumeId, userId);
  const sections = await listSectionsForResume(resumeId, userId);

  return buildExportModel({
    title: resume.title,
    sections,
    templateId: resume.templateId as ResumeTemplateId,
    themeColor: resume.themeColor as ResumeThemeColor,
    pageColor: resume.pageColor as ResumePageColor,
    pageSize: resume.pageSize as PageSize,
  });
}

function buildPdfDocument(model: ExportModel) {
  const style = TEMPLATE_EXPORT_STYLES[model.templateId];
  const accent = THEME_COLOR_HEX[model.themeColor];
  const onAccent = "#ffffff";
  const compactScale = style.compact ? 0.85 : 1;

  const pdfStyles = StyleSheet.create({
    page: {
      padding: 40,
      fontSize: 10 * compactScale,
      fontFamily: style.fontFamily,
      color: "#1f2937",
      backgroundColor: PAGE_COLOR_HEX[model.pageColor],
    },
    headerWrap: {
      marginBottom: 16,
      alignItems: style.headerAlign === "center" ? "center" : "flex-start",
      textAlign: style.headerAlign,
      ...(style.headerVariant === "underline" && {
        borderBottomWidth: 2,
        borderBottomColor: accent,
        paddingBottom: 12,
      }),
      ...(style.headerVariant === "doubleRule" && {
        borderTopWidth: 1.5,
        borderBottomWidth: 1.5,
        borderTopColor: accent,
        borderBottomColor: accent,
        paddingVertical: 10,
      }),
      ...(style.headerVariant === "banner" && {
        backgroundColor: accent,
        padding: 16,
        marginHorizontal: -40,
        marginTop: -40,
        paddingHorizontal: 40,
      }),
      ...(style.headerVariant === "card" && {
        backgroundColor: `${accent}1a`,
        borderRadius: 6,
        padding: 14,
      }),
      ...(style.headerVariant === "leftBar" && {
        borderLeftWidth: 5,
        borderLeftColor: accent,
        paddingLeft: 14,
      }),
    },
    name: {
      fontSize: 20 * compactScale,
      fontFamily: style.fontFamilyBold,
      marginBottom: 2,
      letterSpacing: style.letterSpacedHeader ? 2 : 0,
      color: style.headerVariant === "banner" ? onAccent : "#111827",
    },
    contact: {
      fontSize: 9 * compactScale,
      color: style.headerVariant === "banner" ? onAccent : "#4b5563",
    },
    heading: {
      fontSize: 10 * compactScale,
      fontFamily: style.fontFamilyBold,
      textTransform: style.uppercaseHeadings ? "uppercase" : "none",
      letterSpacing: style.uppercaseHeadings ? 1 : 0,
      marginBottom: 6 * compactScale,
      marginTop: 14 * compactScale,
      color: accent,
    },
    block: {
      ...(style.sectionRule === "leftBorder" && {
        borderLeftWidth: 2,
        borderLeftColor: accent,
        paddingLeft: 10,
      }),
    },
    paragraph: { fontSize: 10 * compactScale, lineHeight: 1.4 },
    itemRow: { flexDirection: "row", justifyContent: "space-between" },
    itemPrimary: { fontSize: 10 * compactScale, fontFamily: style.fontFamilyBold },
    itemSecondary: { fontSize: 9 * compactScale, color: "#4b5563" },
    itemBody: { fontSize: 10 * compactScale, lineHeight: 1.4, marginTop: 2 },
    itemBlock: { marginBottom: 8 * compactScale },
    tagRow: { flexDirection: "row", flexWrap: "wrap" },
    tag: {
      fontSize: 9 * compactScale,
      borderWidth: 1,
      borderColor: accent,
      color: accent,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginRight: 6,
      marginBottom: 4,
    },
  });

  const contactLine = joined(
    [
      model.personalInfo.email,
      model.personalInfo.phone,
      model.personalInfo.location,
      model.personalInfo.website,
    ],
    "  ·  ",
  );

  return createElement(
    PdfDocument,
    null,
    createElement(
      PdfPage,
      { size: model.pageSize, style: pdfStyles.page },
      createElement(
        PdfView,
        { style: pdfStyles.headerWrap },
        createElement(
          PdfText,
          { style: pdfStyles.name },
          model.personalInfo.fullName || model.title,
        ),
        contactLine
          ? createElement(PdfText, { style: pdfStyles.contact }, contactLine)
          : null,
      ),
      ...model.blocks.map((block, blockIndex) =>
        createElement(
          PdfView,
          { key: blockIndex, style: pdfStyles.block },
          createElement(PdfText, { style: pdfStyles.heading }, block.heading),
          block.paragraph
            ? createElement(PdfText, { style: pdfStyles.paragraph }, block.paragraph)
            : null,
          ...(block.items ?? []).map((item, itemIndex) =>
            createElement(
              PdfView,
              { key: itemIndex, style: pdfStyles.itemBlock },
              createElement(
                PdfView,
                { style: pdfStyles.itemRow },
                item.primary
                  ? createElement(PdfText, { style: pdfStyles.itemPrimary }, item.primary)
                  : null,
                item.secondary
                  ? createElement(PdfText, { style: pdfStyles.itemSecondary }, item.secondary)
                  : null,
              ),
              item.body
                ? createElement(PdfText, { style: pdfStyles.itemBody }, item.body)
                : null,
            ),
          ),
          block.tags
            ? createElement(
                PdfView,
                { style: pdfStyles.tagRow },
                ...block.tags.map((tag) =>
                  createElement(PdfText, { key: tag, style: pdfStyles.tag }, tag),
                ),
              )
            : null,
        ),
      ),
    ),
  );
}

export async function exportResumeToPdf(resumeId: string, userId: string) {
  const model = await loadExportModel(resumeId, userId);
  const buffer = await renderToBuffer(buildPdfDocument(model));

  return { buffer, filename: `${sanitizeFilename(model.title)}.pdf` };
}

function buildDocxDocument(model: ExportModel) {
  const style = TEMPLATE_EXPORT_STYLES[model.templateId];
  const accent = THEME_COLOR_HEX[model.themeColor].replace("#", "");
  const alignment =
    style.headerAlign === "center" ? AlignmentType.CENTER : AlignmentType.LEFT;
  const headerShading =
    style.headerVariant === "banner" || style.headerVariant === "card"
      ? { type: ShadingType.CLEAR, fill: accent, color: "auto" }
      : undefined;
  const headerTextColor = style.headerVariant === "banner" ? "FFFFFF" : "111111";
  const headerBorder = {
    ...(style.headerVariant === "underline" && {
      bottom: { style: BorderStyle.SINGLE, size: 12, color: accent },
    }),
    ...(style.headerVariant === "doubleRule" && {
      top: { style: BorderStyle.SINGLE, size: 6, color: accent },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: accent },
    }),
    ...(style.headerVariant === "leftBar" && {
      left: { style: BorderStyle.SINGLE, size: 24, color: accent },
    }),
  };

  const children: Paragraph[] = [
    new Paragraph({
      text: model.personalInfo.fullName || model.title,
      heading: HeadingLevel.TITLE,
      alignment,
      shading: headerShading,
      border: Object.keys(headerBorder).length > 0 ? headerBorder : undefined,
      run: {
        font: style.docxFont,
        color: headerTextColor,
        allCaps: style.letterSpacedHeader,
      },
      spacing: { after: 80 },
    }),
  ];

  const contactLine = joined(
    [
      model.personalInfo.email,
      model.personalInfo.phone,
      model.personalInfo.location,
      model.personalInfo.website,
    ],
    "  ·  ",
  );
  if (contactLine) {
    children.push(
      new Paragraph({
        text: contactLine,
        alignment,
        shading: headerShading,
        run: { font: style.docxFont, color: headerTextColor },
        spacing: { after: 200 },
      }),
    );
  }

  for (const block of model.blocks) {
    children.push(
      new Paragraph({
        text: style.uppercaseHeadings ? block.heading.toUpperCase() : block.heading,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
        border:
          style.sectionRule === "leftBorder"
            ? { left: { style: BorderStyle.SINGLE, size: 12, color: accent } }
            : undefined,
        run: { font: style.docxFont, color: accent },
      }),
    );

    if (block.paragraph) {
      children.push(
        new Paragraph({
          text: block.paragraph,
          spacing: { after: 100 },
          run: { font: style.docxFont },
        }),
      );
    }

    for (const item of block.items ?? []) {
      const runs: TextRun[] = [];
      if (item.primary) {
        runs.push(new TextRun({ text: item.primary, bold: true, font: style.docxFont }));
      }
      if (item.secondary) {
        runs.push(
          new TextRun({ text: `   ${item.secondary}`, italics: true, font: style.docxFont }),
        );
      }
      if (runs.length > 0) children.push(new Paragraph({ children: runs }));
      if (item.body) {
        children.push(
          new Paragraph({
            text: item.body,
            spacing: { after: 100 },
            run: { font: style.docxFont },
          }),
        );
      }
    }

    if (block.tags) {
      children.push(
        new Paragraph({
          text: block.tags.join(", "),
          spacing: { after: 100 },
          run: { font: style.docxFont },
        }),
      );
    }
  }

  const pageDimensions = PAGE_SIZE_DIMENSIONS_MM[model.pageSize];

  return new DocxDocument({
    background: { color: PAGE_COLOR_HEX[model.pageColor].replace("#", "") },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertMillimetersToTwip(pageDimensions.width),
              height: convertMillimetersToTwip(pageDimensions.height),
            },
          },
        },
        children,
      },
    ],
  });
}

export async function exportResumeToDocx(resumeId: string, userId: string) {
  const model = await loadExportModel(resumeId, userId);
  const buffer = await Packer.toBuffer(buildDocxDocument(model));

  return { buffer, filename: `${sanitizeFilename(model.title)}.docx` };
}
