// Canonical value lists for string fields that stand in for enums.
// SQL Server (this project's datasource) has no native enum support,
// so these values are enforced at the application layer instead.

export const RESUME_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type ResumeStatus = (typeof RESUME_STATUSES)[number];

export const RESUME_TEMPLATE_IDS = [
  "CLASSIC",
  "MODERN",
  "MINIMAL",
  "PROFESSIONAL",
  "COMPACT",
  "EXECUTIVE",
  "TECHNICAL",
  "TIMELINE",
  "ELEGANT",
  "BOLD",
  "CREATIVE",
  "ACADEMIC",
] as const;
export type ResumeTemplateId = (typeof RESUME_TEMPLATE_IDS)[number];

export const RESUME_THEME_COLORS = [
  "SLATE",
  "BLUE",
  "EMERALD",
  "ROSE",
] as const;
export type ResumeThemeColor = (typeof RESUME_THEME_COLORS)[number];

// Paper/background color of the rendered resume page. Deliberately limited to
// a set of professional, near-white shades so exports stay print-friendly and
// ATS-safe. Distinct from RESUME_THEME_COLORS, which drives accent styling.
export const RESUME_PAGE_COLORS = [
  "WHITE",
  "OFF_WHITE",
  "IVORY",
  "COOL_GRAY",
  "WARM_GRAY",
] as const;
export type ResumePageColor = (typeof RESUME_PAGE_COLORS)[number];

// Physical page/paper size used for the on-screen preview and PDF/DOCX
// exports. Shared by both the resume and cover letter editors.
export const PAGE_SIZES = ["A4", "LETTER", "LEGAL", "A3"] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export const RESUME_SECTION_TYPES = [
  "PERSONAL_INFO",
  "SUMMARY",
  "EXPERIENCE",
  "EDUCATION",
  "SKILLS",
  "PROJECTS",
  "CERTIFICATIONS",
  "LANGUAGES",
  "AWARDS",
  "CUSTOM",
] as const;
export type ResumeSectionType = (typeof RESUME_SECTION_TYPES)[number];

export const AI_FEATURES = [
  "RESUME_GENERATION",
  "RESUME_REWRITE",
  "BULLET_IMPROVEMENT",
  "ATS_ANALYSIS",
  "COVER_LETTER_GENERATION",
  "COVER_LETTER_REWRITE",
  "COVER_LETTER_CUSTOMIZE",
  "KEYWORD_EXTRACTION",
  "RESUME_PARSING",
  "JOB_PARSING",
  "RESUME_TAILORING",
  "RESUME_REVIEW",
  "SKILL_GAP_ANALYSIS",
  "RESUME_ASSISTANT_CHAT",
  "INTERVIEW_QUESTION_GENERATION",
  "INTERVIEW_ANSWER_EVALUATION",
  "INTERVIEW_REPORT",
] as const;
export type AIFeature = (typeof AI_FEATURES)[number];

export const CHAT_ROLES = ["USER", "ASSISTANT"] as const;
export type ChatRole = (typeof CHAT_ROLES)[number];

export const REVIEW_PRIORITIES = ["HIGH", "MEDIUM", "LOW"] as const;
export type ReviewPriority = (typeof REVIEW_PRIORITIES)[number];

export const SECTION_REVIEW_STATUSES = ["MISSING", "WEAK", "STRONG"] as const;
export type SectionReviewStatus = (typeof SECTION_REVIEW_STATUSES)[number];

export const JOB_DESCRIPTION_SOURCES = ["MANUAL", "URL"] as const;
export type JobDescriptionSource = (typeof JOB_DESCRIPTION_SOURCES)[number];

// Ten tone/style presets offered when generating, rewriting, or customizing
// a cover letter. Kept as a flat allowlist (see file header) rather than a
// free-text field so prompts can be tailored per tone.
export const COVER_LETTER_TONES = [
  "PROFESSIONAL",
  "FORMAL",
  "CONVERSATIONAL",
  "ENTHUSIASTIC",
  "CONFIDENT",
  "CONCISE",
  "CREATIVE",
  "EXECUTIVE",
  "FRIENDLY",
  "STORYTELLING",
] as const;
export type CoverLetterTone = (typeof COVER_LETTER_TONES)[number];

export const SUBSCRIPTION_PLANS = ["FREE", "PRO", "TEAM"] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

// Long-running AI operations tracked as background jobs (see AiJob model)
// so they survive client navigation and notify the user on completion.
export const AI_JOB_TYPES = [
  "RESUME_TAILORING",
  "RESUME_REVIEW",
  "ATS_ANALYSIS",
  "SKILL_GAP_ANALYSIS",
] as const;
export type AiJobType = (typeof AI_JOB_TYPES)[number];

export const AI_JOB_STATUSES = [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
] as const;
export type AiJobStatus = (typeof AI_JOB_STATUSES)[number];

// AI Interview Preparation (see .claude/roadmap/M20-Interview-questions.md).
export const INTERVIEW_TYPES = [
  "RESUME",
  "TECHNICAL",
  "HR",
  "BEHAVIORAL",
  "MIXED",
] as const;
export type InterviewType = (typeof INTERVIEW_TYPES)[number];

export const INTERVIEW_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
export type InterviewDifficulty = (typeof INTERVIEW_DIFFICULTIES)[number];

// Fixed question-count presets, plus null for "Unlimited" (capped at
// INTERVIEW_MAX_QUESTIONS in services/interview.service.ts to bound AI cost).
export const INTERVIEW_QUESTION_COUNTS = [5, 10, 20] as const;
export type InterviewQuestionCount = (typeof INTERVIEW_QUESTION_COUNTS)[number];

export const INTERVIEW_FEEDBACK_MODES = [
  "AFTER_EACH_QUESTION",
  "END_ONLY",
] as const;
export type InterviewFeedbackMode = (typeof INTERVIEW_FEEDBACK_MODES)[number];

export const INTERVIEW_SESSION_STATUSES = [
  "IN_PROGRESS",
  "COMPLETED",
  "ABANDONED",
] as const;
export type InterviewSessionStatus = (typeof INTERVIEW_SESSION_STATUSES)[number];

// A MIXED session generates questions across these categories; a
// non-MIXED session's questions all share the session's interviewType.
export const INTERVIEW_QUESTION_CATEGORIES = [
  "RESUME",
  "TECHNICAL",
  "HR",
  "BEHAVIORAL",
] as const;
export type InterviewQuestionCategory =
  (typeof INTERVIEW_QUESTION_CATEGORIES)[number];

export const HIRING_READINESS_LEVELS = [
  "BEGINNER",
  "INTERMEDIATE",
  "STRONG_CANDIDATE",
  "INTERVIEW_READY",
] as const;
export type HiringReadiness = (typeof HIRING_READINESS_LEVELS)[number];

export const SUBSCRIPTION_STATUSES = [
  "ACTIVE",
  "TRIALING",
  "PAST_DUE",
  "CANCELED",
  "INCOMPLETE",
  "UNPAID",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

// Job Application Workspace & Interview Tracking (see
// .claude/roadmap/M21-interview-tracking.md).
export const JOB_APPLICATION_STATUSES = [
  "SAVED",
  "APPLIED",
  "RESUME_VIEWED",
  "ASSESSMENT",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_COMPLETED",
  "SECOND_INTERVIEW",
  "FINAL_INTERVIEW",
  "OFFER_RECEIVED",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
  "ARCHIVED",
] as const;
export type JobApplicationStatus = (typeof JOB_APPLICATION_STATUSES)[number];

export const JOB_APPLICATION_SOURCES = [
  "MANUAL",
  "URL_IMPORT",
  "TAILORING",
] as const;
export type JobApplicationSource = (typeof JOB_APPLICATION_SOURCES)[number];

export const EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "FREELANCE",
  "TEMPORARY",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const WORK_MODES = ["ONSITE", "REMOTE", "HYBRID"] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const JOB_INTERVIEW_STATUSES = [
  "PENDING",
  "SCHEDULED",
  "COMPLETED",
  "CANCELED",
  "RESCHEDULED",
] as const;
export type JobInterviewStatus = (typeof JOB_INTERVIEW_STATUSES)[number];

export const MEETING_PLATFORMS = [
  "ZOOM",
  "GOOGLE_MEET",
  "MICROSOFT_TEAMS",
  "PHONE",
  "IN_PERSON",
  "OTHER",
] as const;
export type MeetingPlatform = (typeof MEETING_PLATFORMS)[number];

export const APPLICATION_TIMELINE_EVENTS = [
  "APPLIED",
  "RESUME_VIEWED",
  "ASSESSMENT_SENT",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_COMPLETED",
  "OFFER_RECEIVED",
  "STATUS_UPDATED",
  "NOTE_ADDED",
  "REJECTED",
  "WITHDRAWN",
] as const;
export type ApplicationTimelineEvent =
  (typeof APPLICATION_TIMELINE_EVENTS)[number];
