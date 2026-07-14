import {
  DocumentExtractionError,
  extractTextFromDocument,
} from "@/lib/parsing/document-extraction";
import { prisma } from "@/lib/prisma";
import { ResumeServiceError } from "@/services/resume.service";
import { createVersionSnapshot } from "@/services/resume-version.service";
import {
  IMPORT_MAX_FILE_SIZE_BYTES,
  isSupportedImportMimeType,
} from "@/types/resume-import";

export type ImportFile = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
};

async function extractText(file: ImportFile): Promise<string> {
  if (!isSupportedImportMimeType(file.mimeType)) {
    throw new ResumeServiceError(
      "Unsupported file type. Please upload a PDF or DOCX file.",
      422,
    );
  }

  try {
    return await extractTextFromDocument(file);
  } catch (error) {
    if (error instanceof DocumentExtractionError) {
      throw new ResumeServiceError(error.message, error.status);
    }
    throw error;
  }
}

function titleFromFilename(filename: string): string {
  const withoutExtension = filename.replace(/\.[^./\\]+$/, "").trim();
  return withoutExtension.length > 0
    ? withoutExtension.slice(0, 200)
    : "Imported resume";
}

// Extracts raw text from the uploaded file and seeds a new resume with it in
// an editable Summary section. Structured field extraction (splitting the
// text into experience/education/skills) is handled by the AI layer (M09),
// not here.
export async function importResumeFromFile(file: ImportFile, userId: string) {
  if (file.buffer.byteLength === 0) {
    throw new ResumeServiceError("The uploaded file is empty.", 422);
  }

  if (file.buffer.byteLength > IMPORT_MAX_FILE_SIZE_BYTES) {
    throw new ResumeServiceError(
      "The uploaded file is too large. Maximum size is 5MB.",
      422,
    );
  }

  const text = await extractText(file);

  if (!text) {
    throw new ResumeServiceError(
      "No readable text was found in the uploaded file.",
      422,
    );
  }

  const resume = await prisma.resume.create({
    data: {
      title: titleFromFilename(file.filename),
      userId,
      sections: {
        create: [
          {
            type: "PERSONAL_INFO",
            order: 0,
            content: JSON.stringify({
              fullName: "",
              email: "",
              phone: "",
              location: "",
              website: "",
            }),
          },
          {
            type: "SUMMARY",
            order: 1,
            content: JSON.stringify({ text: text.slice(0, 20000) }),
          },
        ],
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
      templateId: true,
      themeColor: true,
      pageColor: true,
      pageSize: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  await createVersionSnapshot(resume.id, "Imported from file");

  return resume;
}
