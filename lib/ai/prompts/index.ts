// Side-effect imports: each prompt module registers itself with the
// central prompt-manager registry on load. Feature services import this
// module once to ensure all M10 prompt templates are registered.
import "@/lib/ai/prompts/resume-generation.prompt";
import "@/lib/ai/prompts/resume-rewrite.prompt";
import "@/lib/ai/prompts/bullet-improvement.prompt";
import "@/lib/ai/prompts/keyword-optimization.prompt";
import "@/lib/ai/prompts/ats-analysis.prompt";
import "@/lib/ai/prompts/cover-letter-generate.prompt";
import "@/lib/ai/prompts/cover-letter-rewrite.prompt";
import "@/lib/ai/prompts/cover-letter-customize.prompt";
import "@/lib/ai/prompts/resume-parsing.prompt";
import "@/lib/ai/prompts/job-parsing.prompt";
import "@/lib/ai/prompts/resume-tailoring.prompt";
import "@/lib/ai/prompts/resume-review.prompt";
import "@/lib/ai/prompts/skill-gap-analysis.prompt";
import "@/lib/ai/prompts/resume-assistant.prompt";
import "@/lib/ai/prompts/interview-question-generation.prompt";
import "@/lib/ai/prompts/interview-answer-evaluation.prompt";
import "@/lib/ai/prompts/interview-report.prompt";
