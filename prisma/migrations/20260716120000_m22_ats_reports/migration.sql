BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ats_reports] (
    [id] NVARCHAR(1000) NOT NULL,
    [resumeId] NVARCHAR(1000) NOT NULL,
    [overallScore] INT NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ats_reports_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ats_reports_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ats_reports_resumeId_idx] ON [dbo].[ats_reports]([resumeId]);

-- AddForeignKey
ALTER TABLE [dbo].[ats_reports] ADD CONSTRAINT [ats_reports_resumeId_fkey] FOREIGN KEY ([resumeId]) REFERENCES [dbo].[resumes]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
