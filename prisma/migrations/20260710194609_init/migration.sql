BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [email] NVARCHAR(1000) NOT NULL,
    [emailVerified] DATETIME2,
    [image] NVARCHAR(1000),
    [passwordHash] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[accounts] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [provider] NVARCHAR(1000) NOT NULL,
    [providerAccountId] NVARCHAR(1000) NOT NULL,
    [refresh_token] NVARCHAR(max),
    [access_token] NVARCHAR(max),
    [expires_at] INT,
    [token_type] NVARCHAR(1000),
    [scope] NVARCHAR(1000),
    [id_token] NVARCHAR(max),
    [session_state] NVARCHAR(1000),
    CONSTRAINT [accounts_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [accounts_provider_providerAccountId_key] UNIQUE NONCLUSTERED ([provider],[providerAccountId])
);

-- CreateTable
CREATE TABLE [dbo].[sessions] (
    [id] NVARCHAR(1000) NOT NULL,
    [sessionToken] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    CONSTRAINT [sessions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [sessions_sessionToken_key] UNIQUE NONCLUSTERED ([sessionToken])
);

-- CreateTable
CREATE TABLE [dbo].[verification_tokens] (
    [identifier] NVARCHAR(1000) NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    CONSTRAINT [verification_tokens_token_key] UNIQUE NONCLUSTERED ([token]),
    CONSTRAINT [verification_tokens_identifier_token_key] UNIQUE NONCLUSTERED ([identifier],[token])
);

-- CreateTable
CREATE TABLE [dbo].[resumes] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [resumes_status_df] DEFAULT 'DRAFT',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [resumes_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [resumes_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[resume_sections] (
    [id] NVARCHAR(1000) NOT NULL,
    [resumeId] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [order] INT NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [resume_sections_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [resume_sections_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[resume_versions] (
    [id] NVARCHAR(1000) NOT NULL,
    [resumeId] NVARCHAR(1000) NOT NULL,
    [versionNumber] INT NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [note] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [resume_versions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [resume_versions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [resume_versions_resumeId_versionNumber_key] UNIQUE NONCLUSTERED ([resumeId],[versionNumber])
);

-- CreateTable
CREATE TABLE [dbo].[cover_letters] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [resumeId] NVARCHAR(1000),
    [jobDescriptionId] NVARCHAR(1000),
    [title] NVARCHAR(1000) NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [cover_letters_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [cover_letters_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[job_descriptions] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [company] NVARCHAR(1000),
    [content] NVARCHAR(max) NOT NULL,
    [source] NVARCHAR(1000) NOT NULL CONSTRAINT [job_descriptions_source_df] DEFAULT 'MANUAL',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [job_descriptions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [job_descriptions_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[subscriptions] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [plan] NVARCHAR(1000) NOT NULL CONSTRAINT [subscriptions_plan_df] DEFAULT 'FREE',
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [subscriptions_status_df] DEFAULT 'ACTIVE',
    [stripeCustomerId] NVARCHAR(1000),
    [stripeSubscriptionId] NVARCHAR(1000),
    [stripePriceId] NVARCHAR(1000),
    [currentPeriodEnd] DATETIME2,
    [cancelAtPeriodEnd] BIT NOT NULL CONSTRAINT [subscriptions_cancelAtPeriodEnd_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [subscriptions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [subscriptions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [subscriptions_userId_key] UNIQUE NONCLUSTERED ([userId]),
    CONSTRAINT [subscriptions_stripeCustomerId_key] UNIQUE NONCLUSTERED ([stripeCustomerId]),
    CONSTRAINT [subscriptions_stripeSubscriptionId_key] UNIQUE NONCLUSTERED ([stripeSubscriptionId])
);

-- CreateTable
CREATE TABLE [dbo].[ai_usages] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [feature] NVARCHAR(1000) NOT NULL,
    [tokensUsed] INT NOT NULL CONSTRAINT [ai_usages_tokensUsed_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ai_usages_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ai_usages_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [resumes_userId_idx] ON [dbo].[resumes]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [resume_sections_resumeId_idx] ON [dbo].[resume_sections]([resumeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [resume_sections_resumeId_order_idx] ON [dbo].[resume_sections]([resumeId], [order]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [resume_versions_resumeId_idx] ON [dbo].[resume_versions]([resumeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [cover_letters_userId_idx] ON [dbo].[cover_letters]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [cover_letters_resumeId_idx] ON [dbo].[cover_letters]([resumeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [job_descriptions_userId_idx] ON [dbo].[job_descriptions]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ai_usages_userId_idx] ON [dbo].[ai_usages]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ai_usages_userId_feature_idx] ON [dbo].[ai_usages]([userId], [feature]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ai_usages_createdAt_idx] ON [dbo].[ai_usages]([createdAt]);

-- AddForeignKey
ALTER TABLE [dbo].[accounts] ADD CONSTRAINT [accounts_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[sessions] ADD CONSTRAINT [sessions_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[resumes] ADD CONSTRAINT [resumes_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[resume_sections] ADD CONSTRAINT [resume_sections_resumeId_fkey] FOREIGN KEY ([resumeId]) REFERENCES [dbo].[resumes]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[resume_versions] ADD CONSTRAINT [resume_versions_resumeId_fkey] FOREIGN KEY ([resumeId]) REFERENCES [dbo].[resumes]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[cover_letters] ADD CONSTRAINT [cover_letters_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[cover_letters] ADD CONSTRAINT [cover_letters_resumeId_fkey] FOREIGN KEY ([resumeId]) REFERENCES [dbo].[resumes]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[cover_letters] ADD CONSTRAINT [cover_letters_jobDescriptionId_fkey] FOREIGN KEY ([jobDescriptionId]) REFERENCES [dbo].[job_descriptions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[job_descriptions] ADD CONSTRAINT [job_descriptions_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[subscriptions] ADD CONSTRAINT [subscriptions_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ai_usages] ADD CONSTRAINT [ai_usages_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH

