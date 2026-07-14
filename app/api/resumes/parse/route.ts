import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import { parseResume } from "@/services/resume-parser.service";
import { PARSER_MAX_FILE_SIZE_BYTES } from "@/types/parser";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A file is required." }, { status: 422 });
    }
    if (file.size > PARSER_MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "The uploaded file is too large. Maximum size is 5MB." },
        { status: 422 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseResume(
      { buffer, filename: file.name, mimeType: file.type },
      session.user.id,
    );

    return NextResponse.json({ parsed });
  } catch (error) {
    return handleRouteError(error, "POST /api/resumes/parse");
  }
}
