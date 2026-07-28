"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type {
  PageSize,
  ResumePageColor,
  ResumeSectionType,
  ResumeTemplateId,
  ResumeThemeColor,
} from "@/lib/enums";
import * as api from "@/lib/resume-editor-client";
import {
  DEFAULT_SECTION_CONTENT,
  EDITABLE_SECTION_TYPES,
  type ResumeSectionItem,
} from "@/types/resume-section";

const SAVE_DEBOUNCE_MS = 800;

export type SaveStatus = "idle" | "saving" | "saved" | "error";

type ResumeEditorContextValue = {
  resumeId: string;
  title: string;
  sections: ResumeSectionItem[];
  activeSection: ResumeSectionItem | null;
  activeSectionId: string | null;
  availableTypes: ResumeSectionType[];
  templateId: ResumeTemplateId;
  themeColor: ResumeThemeColor;
  pageColor: ResumePageColor;
  pageSize: PageSize;
  saveStatus: SaveStatus;
  error: string | null;
  addingType: ResumeSectionType | null;
  selectSection: (sectionId: string) => void;
  addSection: (type: ResumeSectionType) => Promise<void>;
  deleteSection: (sectionId: string) => Promise<void>;
  toggleHidden: (sectionId: string) => Promise<void>;
  moveSection: (sectionId: string, direction: "up" | "down") => Promise<void>;
  updateContent: (sectionId: string, content: unknown) => void;
  replaceSectionContent: (sectionId: string, content: unknown) => void;
  replaceSections: (sections: ResumeSectionItem[]) => void;
  setAppearance: (patch: {
    templateId?: ResumeTemplateId;
    themeColor?: ResumeThemeColor;
    pageColor?: ResumePageColor;
    pageSize?: PageSize;
  }) => Promise<void>;
};

const ResumeEditorContext = createContext<ResumeEditorContextValue | null>(
  null,
);

export function useResumeEditor() {
  const context = useContext(ResumeEditorContext);
  if (!context) {
    throw new Error("useResumeEditor must be used within ResumeEditorProvider");
  }
  return context;
}

type Props = {
  resumeId: string;
  title: string;
  initialSections: ResumeSectionItem[];
  initialTemplateId: ResumeTemplateId;
  initialThemeColor: ResumeThemeColor;
  initialPageColor: ResumePageColor;
  initialPageSize: PageSize;
  children: ReactNode;
};

export function ResumeEditorProvider({
  resumeId,
  title,
  initialSections,
  initialTemplateId,
  initialThemeColor,
  initialPageColor,
  initialPageSize,
  children,
}: Props) {
  const [sections, setSections] =
    useState<ResumeSectionItem[]>(initialSections);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    initialSections[0]?.id ?? null,
  );
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [themeColor, setThemeColor] = useState(initialThemeColor);
  const [pageColor, setPageColor] = useState(initialPageColor);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [addingType, setAddingType] = useState<ResumeSectionType | null>(null);

  // Per-section debounce timers plus a counter of in-flight saves so the
  // global status reflects every pending write, not just the latest one.
  const saveTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const inFlightSavesRef = useRef(0);

  useEffect(() => {
    const timers = saveTimersRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  const beginSave = useCallback(() => {
    inFlightSavesRef.current += 1;
    setSaveStatus("saving");
    setError(null);
  }, []);

  const endSave = useCallback((failedWith?: string) => {
    inFlightSavesRef.current = Math.max(0, inFlightSavesRef.current - 1);
    if (failedWith) {
      setSaveStatus("error");
      setError(failedWith);
    } else if (inFlightSavesRef.current === 0) {
      setSaveStatus((prev) => (prev === "error" ? prev : "saved"));
    }
  }, []);

  const selectSection = useCallback((sectionId: string) => {
    setActiveSectionId(sectionId);
  }, []);

  const addSection = useCallback(
    async (type: ResumeSectionType) => {
      setAddingType(type);
      beginSave();
      const result = await api.createSection(
        resumeId,
        type,
        DEFAULT_SECTION_CONTENT[type],
      );
      setAddingType(null);

      if (!result.ok) {
        endSave(result.error);
        return;
      }

      endSave();
      setSections((prev) => [...prev, result.data.section]);
      setActiveSectionId(result.data.section.id);
    },
    [resumeId, beginSave, endSave],
  );

  const deleteSection = useCallback(
    async (sectionId: string) => {
      const previous = sections;
      const next = sections.filter((section) => section.id !== sectionId);
      setSections(next);
      if (activeSectionId === sectionId) {
        setActiveSectionId(next[0]?.id ?? null);
      }

      beginSave();
      const result = await api.deleteSection(resumeId, sectionId);
      if (!result.ok) {
        endSave(result.error);
        setSections(previous);
        return;
      }
      endSave();
    },
    [resumeId, sections, activeSectionId, beginSave, endSave],
  );

  const toggleHidden = useCallback(
    async (sectionId: string) => {
      const target = sections.find((section) => section.id === sectionId);
      if (!target) return;

      const hidden = !target.hidden;
      const previous = sections;
      setSections((prev) =>
        prev.map((section) =>
          section.id === sectionId ? { ...section, hidden } : section,
        ),
      );

      beginSave();
      const result = await api.updateSection(resumeId, sectionId, { hidden });
      if (!result.ok) {
        endSave(result.error);
        setSections(previous);
        return;
      }
      endSave();
    },
    [resumeId, sections, beginSave, endSave],
  );

  const moveSection = useCallback(
    async (sectionId: string, direction: "up" | "down") => {
      const index = sections.findIndex((section) => section.id === sectionId);
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (index === -1 || targetIndex < 0 || targetIndex >= sections.length) {
        return;
      }

      const previous = sections;
      const next = [...sections];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      setSections(next);

      beginSave();
      const result = await api.reorderSections(
        resumeId,
        next.map((section) => section.id),
      );
      if (!result.ok) {
        endSave(result.error);
        setSections(previous);
        return;
      }
      endSave();
    },
    [resumeId, sections, beginSave, endSave],
  );

  const updateContent = useCallback(
    (sectionId: string, content: unknown) => {
      setSections((prev) =>
        prev.map((section) =>
          section.id === sectionId ? { ...section, content } : section,
        ),
      );

      const timers = saveTimersRef.current;
      const existing = timers.get(sectionId);
      if (existing) {
        clearTimeout(existing);
      }

      timers.set(
        sectionId,
        setTimeout(async () => {
          timers.delete(sectionId);
          beginSave();
          const result = await api.updateSection(resumeId, sectionId, {
            content,
          });
          endSave(result.ok ? undefined : result.error);
        }, SAVE_DEBOUNCE_MS),
      );
    },
    [resumeId, beginSave, endSave],
  );

  // Immediate (already persisted) content replacement, e.g. after an AI
  // rewrite the server has saved — no debounce or extra write needed.
  const replaceSectionContent = useCallback(
    (sectionId: string, content: unknown) => {
      setSections((prev) =>
        prev.map((section) =>
          section.id === sectionId ? { ...section, content } : section,
        ),
      );
      setSaveStatus("saved");
    },
    [],
  );

  const replaceSections = useCallback((next: ResumeSectionItem[]) => {
    setSections(next);
    setActiveSectionId((prev) =>
      prev && next.some((section) => section.id === prev)
        ? prev
        : (next[0]?.id ?? null),
    );
    setSaveStatus("saved");
  }, []);

  const setAppearance = useCallback(
    async (patch: {
      templateId?: ResumeTemplateId;
      themeColor?: ResumeThemeColor;
      pageColor?: ResumePageColor;
      pageSize?: PageSize;
    }) => {
      const previous = { templateId, themeColor, pageColor, pageSize };
      if (patch.templateId) setTemplateId(patch.templateId);
      if (patch.themeColor) setThemeColor(patch.themeColor);
      if (patch.pageColor) setPageColor(patch.pageColor);
      if (patch.pageSize) setPageSize(patch.pageSize);

      beginSave();
      const result = await api.updateAppearance(resumeId, patch);
      if (!result.ok) {
        endSave(result.error);
        setTemplateId(previous.templateId);
        setThemeColor(previous.themeColor);
        setPageColor(previous.pageColor);
        setPageSize(previous.pageSize);
        return;
      }
      endSave();
    },
    [resumeId, templateId, themeColor, pageColor, pageSize, beginSave, endSave],
  );

  const activeSection = useMemo(
    () =>
      sections.find((section) => section.id === activeSectionId) ?? null,
    [sections, activeSectionId],
  );

  const availableTypes = useMemo(() => {
    const usedTypes = new Set(
      sections
        .filter((section) => section.type !== "CUSTOM")
        .map((section) => section.type),
    );
    return EDITABLE_SECTION_TYPES.filter((type) => !usedTypes.has(type));
  }, [sections]);

  const value = useMemo<ResumeEditorContextValue>(
    () => ({
      resumeId,
      title,
      sections,
      activeSection,
      activeSectionId,
      availableTypes,
      templateId,
      themeColor,
      pageColor,
      pageSize,
      saveStatus,
      error,
      addingType,
      selectSection,
      addSection,
      deleteSection,
      toggleHidden,
      moveSection,
      updateContent,
      replaceSectionContent,
      replaceSections,
      setAppearance,
    }),
    [
      resumeId,
      title,
      sections,
      activeSection,
      activeSectionId,
      availableTypes,
      templateId,
      themeColor,
      pageColor,
      pageSize,
      saveStatus,
      error,
      addingType,
      selectSection,
      addSection,
      deleteSection,
      toggleHidden,
      moveSection,
      updateContent,
      replaceSectionContent,
      replaceSections,
      setAppearance,
    ],
  );

  return (
    <ResumeEditorContext.Provider value={value}>
      {children}
    </ResumeEditorContext.Provider>
  );
}
