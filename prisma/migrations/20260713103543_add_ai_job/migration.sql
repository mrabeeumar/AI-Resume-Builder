BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ai_jobs] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [resumeId] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [ai_jobs_status_df] DEFAULT 'PENDING',
    [input] NVARCHAR(max) NOT NULL,
    [result] NVARCHAR(max),
    [error] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ai_jobs_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ai_jobs_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ai_jobs_userId_status_idx] ON [dbo].[ai_jobs]([userId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ai_jobs_resumeId_idx] ON [dbo].[ai_jobs]([resumeId]);

-- AddForeignKey
ALTER TABLE [dbo].[ai_jobs] ADD CONSTRAINT [ai_jobs_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ai_jobs] ADD CONSTRAINT [ai_jobs_resumeId_fkey] FOREIGN KEY ([resumeId]) REFERENCES [dbo].[resumes]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
