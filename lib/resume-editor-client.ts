import type {
  PageSize,
  ResumePageColor,
  ResumeTemplateId,
  ResumeThemeColor,
} from "@/lib/enums";
import type { ResumeSectionType } from "@/lib/enums";
import type { ResumeSectionItem } from "@/types/resume-section";

const GENERIC_ERROR = "Something went wrong. Please try again.";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function request<T>(
  url: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      ...init,
      headers:
        init?.body !== undefined
          ? { "Content-Type": "application/json", ...init?.headers }
          : init?.headers,
    });

    if (response.status === 204) {
      return { ok: true, data: undefined as T };
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return { ok: false, error: data?.error ?? GENERIC_ERROR };
    }

    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: GENERIC_ERROR };
  }
}

export function createSection(
  resumeId: string,
  type: ResumeSectionType,
  content: unknown,
) {
  return request<{ section: ResumeSectionItem }>(
    `/api/resumes/${resumeId}/sections`,
    { method: "POST", body: JSON.stringify({ type, content }) },
  );
}

export function updateSection(
  resumeId: string,
  sectionId: string,
  patch: { content?: unknown; hidden?: boolean },
) {
  return request<{ section: ResumeSectionItem }>(
    `/api/resumes/${resumeId}/sections/${sectionId}`,
    { method: "PATCH", body: JSON.stringify(patch) },
  );
}

export function deleteSection(resumeId: string, sectionId: string) {
  return request<void>(`/api/resumes/${resumeId}/sections/${sectionId}`, {
    method: "DELETE",
  });
}

export function reorderSections(resumeId: string, order: string[]) {
  return request<void>(`/api/resumes/${resumeId}/sections/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ order }),
  });
}

export function updateAppearance(
  resumeId: string,
  patch: {
    templateId?: ResumeTemplateId;
    themeColor?: ResumeThemeColor;
    pageColor?: ResumePageColor;
    pageSize?: PageSize;
  },
) {
  return request<void>(`/api/resumes/${resumeId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function rewriteSection(
  resumeId: string,
  sectionId: string,
  input: { instructions: string; jobDescription: string },
) {
  return request<{ section: ResumeSectionItem }>(
    `/api/resumes/${resumeId}/sections/${sectionId}/rewrite`,
    { method: "POST", body: JSON.stringify(input) },
  );
}
