BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[cover_letter_versions] (
    [id] NVARCHAR(1000) NOT NULL,
    [coverLetterId] NVARCHAR(1000) NOT NULL,
    [versionNumber] INT NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [note] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [cover_letter_versions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [cover_letter_versions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [cover_letter_versions_coverLetterId_versionNumber_key] UNIQUE NONCLUSTERED ([coverLetterId],[versionNumber])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [cover_letter_versions_coverLetterId_idx] ON [dbo].[cover_letter_versions]([coverLetterId]);

-- AddForeignKey
ALTER TABLE [dbo].[cover_letter_versions] ADD CONSTRAINT [cover_letter_versions_coverLetterId_fkey] FOREIGN KEY ([coverLetterId]) REFERENCES [dbo].[cover_letters]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
