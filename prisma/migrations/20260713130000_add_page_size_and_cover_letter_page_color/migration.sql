BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[resumes] ADD [pageSize] NVARCHAR(1000) NOT NULL CONSTRAINT [resumes_pageSize_df] DEFAULT 'A4';

-- AlterTable
ALTER TABLE [dbo].[cover_letters] ADD [pageColor] NVARCHAR(1000) NOT NULL CONSTRAINT [cover_letters_pageColor_df] DEFAULT 'WHITE';
ALTER TABLE [dbo].[cover_letters] ADD [pageSize] NVARCHAR(1000) NOT NULL CONSTRAINT [cover_letters_pageSize_df] DEFAULT 'A4';

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
