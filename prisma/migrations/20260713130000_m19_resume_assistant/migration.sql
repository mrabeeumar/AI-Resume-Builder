BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[conversations] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [resumeId] NVARCHAR(1000) NOT NULL,
    [versionId] NVARCHAR(1000),
    [title] NVARCHAR(1000) NOT NULL CONSTRAINT [conversations_title_df] DEFAULT 'New conversation',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [conversations_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [conversations_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[chat_messages] (
    [id] NVARCHAR(1000) NOT NULL,
    [conversationId] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [confidence] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [chat_messages_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [chat_messages_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [conversations_userId_resumeId_idx] ON [dbo].[conversations]([userId], [resumeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [conversations_resumeId_idx] ON [dbo].[conversations]([resumeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [chat_messages_conversationId_idx] ON [dbo].[chat_messages]([conversationId]);

-- AddForeignKey
ALTER TABLE [dbo].[conversations] ADD CONSTRAINT [conversations_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[conversations] ADD CONSTRAINT [conversations_resumeId_fkey] FOREIGN KEY ([resumeId]) REFERENCES [dbo].[resumes]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[chat_messages] ADD CONSTRAINT [chat_messages_conversationId_fkey] FOREIGN KEY ([conversationId]) REFERENCES [dbo].[conversations]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
