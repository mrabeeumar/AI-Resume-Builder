import type {
  PageSize,
  ResumePageColor,
  ResumeTemplateId,
  ResumeThemeColor,
} from "@/lib/enums";

export const TEMPLATE_LABELS: Record<ResumeTemplateId, string> = {
  CLASSIC: "Classic",
  MODERN: "Modern",
  MINIMAL: "Minimal",
  PROFESSIONAL: "Professional",
  COMPACT: "Compact",
  EXECUTIVE: "Executive",
  TECHNICAL: "Technical",
  TIMELINE: "Timeline",
  ELEGANT: "Elegant",
  BOLD: "Bold",
  CREATIVE: "Creative",
  ACADEMIC: "Academic",
};

export const TEMPLATE_DESCRIPTIONS: Record<ResumeTemplateId, string> = {
  CLASSIC: "Traditional single-column layout with clear section headings.",
  MODERN: "Bold header with a colored accent band and sidebar-style skills.",
  MINIMAL: "Understated typography-first layout with generous whitespace.",
  PROFESSIONAL:
    "Centered header with a double rule, built for corporate and finance roles.",
  COMPACT:
    "Tight spacing and smaller type to fit more experience on one page.",
  EXECUTIVE:
    "Left accent bar and large name treatment suited to senior/leadership roles.",
  TECHNICAL:
    "Monospace-accented headings and skill tags tailored for engineering roles.",
  TIMELINE:
    "Left border rail on each section for an easy-to-scan chronological read.",
  ELEGANT:
    "Serif type with a centered, letter-spaced header for a refined look.",
  BOLD: "Full-width colored name banner with strong section separation.",
  CREATIVE:
    "Soft tinted header card and colored headings for design-adjacent roles.",
  ACADEMIC:
    "Serif CV styling with understated ruled headings for research and academia.",
};

// All templates render single-column, linear-order sections (no tables,
// multi-column layouts, or text-in-images) so they parse correctly in ATS
// resume scanners.
export const ATS_FRIENDLY_TEMPLATES: Record<ResumeTemplateId, boolean> = {
  CLASSIC: true,
  MODERN: true,
  MINIMAL: true,
  PROFESSIONAL: true,
  COMPACT: true,
  EXECUTIVE: true,
  TECHNICAL: true,
  TIMELINE: true,
  ELEGANT: true,
  BOLD: true,
  CREATIVE: true,
  ACADEMIC: true,
};

export const THEME_COLOR_LABELS: Record<ResumeThemeColor, string> = {
  SLATE: "Slate",
  BLUE: "Blue",
  EMERALD: "Emerald",
  ROSE: "Rose",
};

export const THEME_COLOR_CLASSES: Record<
  ResumeThemeColor,
  { text: string; border: string; bg: string; swatch: string }
> = {
  SLATE: {
    text: "text-slate-600",
    border: "border-slate-600",
    bg: "bg-slate-50",
    swatch: "bg-slate-600",
  },
  BLUE: {
    text: "text-blue-600",
    border: "border-blue-600",
    bg: "bg-blue-50",
    swatch: "bg-blue-600",
  },
  EMERALD: {
    text: "text-emerald-600",
    border: "border-emerald-600",
    bg: "bg-emerald-50",
    swatch: "bg-emerald-600",
  },
  ROSE: {
    text: "text-rose-600",
    border: "border-rose-600",
    bg: "bg-rose-50",
    swatch: "bg-rose-600",
  },
};

export const PAGE_COLOR_LABELS: Record<ResumePageColor, string> = {
  WHITE: "Pure White",
  OFF_WHITE: "Off White",
  IVORY: "Ivory",
  COOL_GRAY: "Cool Gray",
  WARM_GRAY: "Warm Gray",
};

// Hex values for each page (paper) shade. Used both for inline styling in the
// on-screen templates and for the PDF/DOCX exports, so the browser preview and
// downloaded files render an identical background.
export const PAGE_COLOR_HEX: Record<ResumePageColor, string> = {
  WHITE: "#ffffff",
  OFF_WHITE: "#faf9f6",
  IVORY: "#fbfaf4",
  COOL_GRAY: "#f7f9fb",
  WARM_GRAY: "#f5f4f1",
};

export const PAGE_SIZE_LABELS: Record<PageSize, string> = {
  A4: "A4",
  LETTER: "Letter",
  LEGAL: "Legal",
  A3: "A3",
};

export const PAGE_SIZE_DESCRIPTIONS: Record<PageSize, string> = {
  A4: "210 × 297 mm",
  LETTER: "8.5 × 11 in",
  LEGAL: "8.5 × 14 in",
  A3: "297 × 420 mm",
};

// Millimeter dimensions per page size, used to derive both the on-screen
// preview width (scaled to px) and the DOCX export page size. The PDF export
// passes these size names straight through to react-pdf's <Page size> prop,
// which recognizes the same "A4" | "LETTER" | "LEGAL" | "A3" strings.
export const PAGE_SIZE_DIMENSIONS_MM: Record<
  PageSize,
  { width: number; height: number }
> = {
  A4: { width: 210, height: 297 },
  LETTER: { width: 215.9, height: 279.4 },
  LEGAL: { width: 215.9, height: 355.6 },
  A3: { width: 297, height: 420 },
};

// mm -> px at 96dpi (1in = 96px, 1in = 25.4mm), rounded to whole pixels. Used
// to size the on-screen preview page so relative proportions between sizes
// (e.g. A3 being noticeably wider than A4/Letter) are visible on screen.
const MM_TO_PX = 96 / 25.4;

export const PAGE_SIZE_WIDTH_PX: Record<PageSize, number> = Object.fromEntries(
  Object.entries(PAGE_SIZE_DIMENSIONS_MM).map(([size, { width }]) => [
    size,
    Math.round(width * MM_TO_PX),
  ]),
) as Record<PageSize, number>;
