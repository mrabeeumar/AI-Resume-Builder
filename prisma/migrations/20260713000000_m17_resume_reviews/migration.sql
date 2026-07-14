BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[resume_reviews] (
    [id] NVARCHAR(1000) NOT NULL,
    [resumeId] NVARCHAR(1000) NOT NULL,
    [versionId] NVARCHAR(1000),
    [overallScore] INT NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [resume_reviews_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [resume_reviews_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [resume_reviews_resumeId_idx] ON [dbo].[resume_reviews]([resumeId]);

-- AddForeignKey
ALTER TABLE [dbo].[resume_reviews] ADD CONSTRAINT [resume_reviews_resumeId_fkey] FOREIGN KEY ([resumeId]) REFERENCES [dbo].[resumes]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
