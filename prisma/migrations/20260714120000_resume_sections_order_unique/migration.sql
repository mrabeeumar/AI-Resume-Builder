BEGIN TRY

BEGIN TRAN;

-- DropIndex
DROP INDEX [resume_sections_resumeId_order_idx] ON [dbo].[resume_sections];

-- CreateIndex
ALTER TABLE [dbo].[resume_sections] ADD CONSTRAINT [resume_sections_resumeId_order_key] UNIQUE NONCLUSTERED ([resumeId], [order]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
