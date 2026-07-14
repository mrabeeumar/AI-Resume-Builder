import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { withRequestLog } from "@/lib/api-log";
import { enforceRateLimit } from "@/lib/rate-limit";
import { parseJobDescription } from "@/services/job-parser.service";
import { PARSER_MAX_FILE_SIZE_BYTES } from "@/types/parser";

const PARSE_RATE_LIMIT = 20;
const PARSE_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

export const POST = withRequestLog(
  "POST /api/job-descriptions/parse",
  async (request: Request) => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    try {
      await enforceRateLimit(
        `job-descriptions:parse:${session.user.id}`,
        PARSE_RATE_LIMIT,
        PARSE_RATE_LIMIT_WINDOW_SECONDS,
      );

      const formData = await request.formData();
      const file = formData.get("file");
      const content = formData.get("content");

      if (file instanceof File) {
        if (file.size > PARSER_MAX_FILE_SIZE_BYTES) {
          return NextResponse.json(
            { error: "The uploaded file is too large. Maximum size is 5MB." },
            { status: 422 },
          );
        }
        const buffer = Buffer.from(await file.arrayBuffer());
        const parsed = await parseJobDescription(
          {
            kind: "file",
            file: { buffer, filename: file.name, mimeType: file.type },
          },
          session.user.id,
        );
        return NextResponse.json({ parsed });
      }

      if (typeof content === "string" && content.trim()) {
        const parsed = await parseJobDescription(
          { kind: "text", content },
          session.user.id,
        );
        return NextResponse.json({ parsed });
      }

      return NextResponse.json(
        { error: "A file or job description text is required." },
        { status: 422 },
      );
    } catch (error) {
      return handleRouteError(error, "POST /api/job-descriptions/parse");
    }
  },
);
