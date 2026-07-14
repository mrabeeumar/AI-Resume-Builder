BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[interview_sessions] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [resumeId] NVARCHAR(1000) NOT NULL,
    [versionId] NVARCHAR(1000),
    [jobDescriptionId] NVARCHAR(1000),
    [coverLetterId] NVARCHAR(1000),
    [interviewType] NVARCHAR(1000) NOT NULL,
    [difficulty] NVARCHAR(1000) NOT NULL,
    [questionCount] INT,
    [feedbackMode] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [interview_sessions_status_df] DEFAULT 'IN_PROGRESS',
    [startedAt] DATETIME2 NOT NULL CONSTRAINT [interview_sessions_startedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [completedAt] DATETIME2,
    [duration] INT,
    [overallScore] INT,
    [finalReport] NVARCHAR(max),
    CONSTRAINT [interview_sessions_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[interview_questions] (
    [id] NVARCHAR(1000) NOT NULL,
    [interviewSessionId] NVARCHAR(1000) NOT NULL,
    [order] INT NOT NULL,
    [question] NVARCHAR(max) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL,
    [difficulty] NVARCHAR(1000) NOT NULL,
    [resumeSection] NVARCHAR(1000),
    [expectedSkills] NVARCHAR(max),
    [relatedProject] NVARCHAR(1000),
    [estimatedAnswerSeconds] INT,
    [userAnswer] NVARCHAR(max),
    [aiEvaluation] NVARCHAR(max),
    [score] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [interview_questions_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [answeredAt] DATETIME2,
    CONSTRAINT [interview_questions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [interview_questions_interviewSessionId_order_key] UNIQUE NONCLUSTERED ([interviewSessionId],[order])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [interview_sessions_userId_resumeId_idx] ON [dbo].[interview_sessions]([userId], [resumeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [interview_sessions_resumeId_idx] ON [dbo].[interview_sessions]([resumeId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [interview_questions_interviewSessionId_idx] ON [dbo].[interview_questions]([interviewSessionId]);

-- AddForeignKey
ALTER TABLE [dbo].[interview_sessions] ADD CONSTRAINT [interview_sessions_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[interview_sessions] ADD CONSTRAINT [interview_sessions_resumeId_fkey] FOREIGN KEY ([resumeId]) REFERENCES [dbo].[resumes]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[interview_sessions] ADD CONSTRAINT [interview_sessions_jobDescriptionId_fkey] FOREIGN KEY ([jobDescriptionId]) REFERENCES [dbo].[job_descriptions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[interview_sessions] ADD CONSTRAINT [interview_sessions_coverLetterId_fkey] FOREIGN KEY ([coverLetterId]) REFERENCES [dbo].[cover_letters]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[interview_questions] ADD CONSTRAINT [interview_questions_interviewSessionId_fkey] FOREIGN KEY ([interviewSessionId]) REFERENCES [dbo].[interview_sessions]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
