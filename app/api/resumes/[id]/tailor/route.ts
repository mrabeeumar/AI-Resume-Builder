import { NextResponse } from "next/server";
import { after } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { withRequestLog } from "@/lib/api-log";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  createAiJob,
  markAiJobCompleted,
  markAiJobFailed,
  markAiJobProcessing,
} from "@/services/ai-job.service";
import { generateTailoredResume } from "@/services/resume-tailoring.service";
import { PARSER_MAX_FILE_SIZE_BYTES } from "@/types/parser";

type RouteParams = { params: Promise<{ id: string }> };

const AI_JOB_RATE_LIMIT = 15;
const AI_JOB_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

// Queues a tailoring job and returns its id immediately (202). The actual
// OpenAI call runs in the background via `after()`, so it keeps running on
// the server even if the client navigates away; the client polls
// /api/ai-jobs/[jobId] (or reattaches via GET /api/ai-jobs) to learn when
// it's done and is notified with a toast regardless of which page it's on.
export const POST = withRequestLog(
  "POST /api/resumes/[id]/tailor",
  async (request: Request, { params }: RouteParams) => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;
    const contentType = request.headers.get("content-type") ?? "";

    try {
      await enforceRateLimit(
        `resumes:tailor:${userId}`,
        AI_JOB_RATE_LIMIT,
        AI_JOB_RATE_LIMIT_WINDOW_SECONDS,
      );

      let input: {
        sourceVersionId?: string;
        jobDescriptionId?: string;
        jobDescription?: string;
      };
      let fileSource:
        { buffer: Buffer; filename: string; mimeType: string } | undefined;

      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        const file = formData.get("file");
        const sourceVersionId = formData.get("sourceVersionId");

        if (!(file instanceof File)) {
          return NextResponse.json(
            { error: "A job description file is required." },
            { status: 422 },
          );
        }
        if (file.size > PARSER_MAX_FILE_SIZE_BYTES) {
          return NextResponse.json(
            { error: "The uploaded file is too large. Maximum size is 5MB." },
            { status: 422 },
          );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        fileSource = { buffer, filename: file.name, mimeType: file.type };
        input = {
          sourceVersionId:
            typeof sourceVersionId === "string" ? sourceVersionId : undefined,
        };
      } else {
        input = await request.json().catch(() => ({}));
      }

      const job = await createAiJob(id, userId, "RESUME_TAILORING", input);

      after(async () => {
        try {
          await markAiJobProcessing(job.id);
          const result = await generateTailoredResume(
            id,
            userId,
            input,
            fileSource,
          );
          await markAiJobCompleted(job.id, result);
        } catch (error) {
          await markAiJobFailed(
            job.id,
            error instanceof Error ? error.message : "Something went wrong.",
          );
        }
      });

      return NextResponse.json({ jobId: job.id }, { status: 202 });
    } catch (error) {
      return handleRouteError(error, "POST /api/resumes/[id]/tailor");
    }
  },
);
