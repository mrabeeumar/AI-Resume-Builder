import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { withRequestLog } from "@/lib/api-log";
import { enforceRateLimit } from "@/lib/rate-limit";
import { importResumeFromFile } from "@/services/resume-import.service";
import { IMPORT_MAX_FILE_SIZE_BYTES } from "@/types/resume-import";

const IMPORT_RATE_LIMIT = 20;
const IMPORT_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

export const POST = withRequestLog(
  "POST /api/resumes/import",
  async (request: Request) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    try {
      await enforceRateLimit(
        `resumes:import:${session.user.id}`,
        IMPORT_RATE_LIMIT,
        IMPORT_RATE_LIMIT_WINDOW_SECONDS,
      );

      const formData = await request.formData();
      const file = formData.get("file");

      if (!(file instanceof File)) {
        return NextResponse.json(
          { error: "A file is required." },
          { status: 422 },
        );
      }

      // Reject oversized uploads before buffering the whole file into memory.
      if (file.size > IMPORT_MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: "The uploaded file is too large. Maximum size is 5MB." },
          { status: 422 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const resume = await importResumeFromFile(
        { buffer, filename: file.name, mimeType: file.type },
        session.user.id,
      );

      return NextResponse.json({ resume }, { status: 201 });
    } catch (error) {
      return handleRouteError(error, "POST /api/resumes/import");
    }
  },
);
