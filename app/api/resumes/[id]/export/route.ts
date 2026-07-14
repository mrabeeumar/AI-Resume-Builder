import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { handleRouteError } from "@/lib/api-error";
import {
  exportResumeToDocx,
  exportResumeToPdf,
} from "@/services/resume-export.service";
import { exportFormatSchema } from "@/types/resume-export";

type RouteParams = { params: Promise<{ id: string }> };

const EXPORT_CONTENT_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

export async function GET(request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const url = new URL(request.url);
  const parsedFormat = exportFormatSchema.safeParse(
    url.searchParams.get("format"),
  );

  if (!parsedFormat.success) {
    return NextResponse.json(
      { error: "Invalid or missing format. Use 'pdf' or 'docx'." },
      { status: 422 },
    );
  }

  try {
    const format = parsedFormat.data;
    const { buffer, filename } =
      format === "pdf"
        ? await exportResumeToPdf(id, session.user.id)
        : await exportResumeToDocx(id, session.user.id);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": EXPORT_CONTENT_TYPES[format],
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleRouteError(error, "GET /api/resumes/[id]/export");
  }
}
