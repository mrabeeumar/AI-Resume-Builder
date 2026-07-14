BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[skill_gap_analyses] (
    [id] NVARCHAR(1000) NOT NULL,
    [resumeId] NVARCHAR(1000) NOT NULL,
    [versionId] NVARCHAR(1000),
    [jobDescriptionId] NVARCHAR(1000),
    [overallScore] INT NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [skill_gap_analyses_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [skill_gap_analyses_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [skill_gap_analyses_resumeId_idx] ON [dbo].[skill_gap_analyses]([resumeId]);

-- AddForeignKey
ALTER TABLE [dbo].[skill_gap_analyses] ADD CONSTRAINT [skill_gap_analyses_resumeId_fkey] FOREIGN KEY ([resumeId]) REFERENCES [dbo].[resumes]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[skill_gap_analyses] ADD CONSTRAINT [skill_gap_analyses_jobDescriptionId_fkey] FOREIGN KEY ([jobDescriptionId]) REFERENCES [dbo].[job_descriptions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
