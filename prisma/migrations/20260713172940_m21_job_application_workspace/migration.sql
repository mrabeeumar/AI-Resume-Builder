BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[job_applications] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [company] NVARCHAR(1000) NOT NULL,
    [companyLogo] NVARCHAR(1000),
    [position] NVARCHAR(1000) NOT NULL,
    [location] NVARCHAR(1000),
    [salary] NVARCHAR(1000),
    [employmentType] NVARCHAR(1000),
    [workMode] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [job_applications_status_df] DEFAULT 'SAVED',
    [source] NVARCHAR(1000) NOT NULL CONSTRAINT [job_applications_source_df] DEFAULT 'MANUAL',
    [applicationDate] DATETIME2,
    [deadline] DATETIME2,
    [originalJobUrl] NVARCHAR(1000),
    [parsedJobDescription] NVARCHAR(max),
    [notes] NVARCHAR(max),
    [resumeId] NVARCHAR(1000),
    [resumeVersionId] NVARCHAR(1000),
    [coverLetterId] NVARCHAR(1000),
    [jobDescriptionId] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [job_applications_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [job_applications_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[job_interviews] (
    [id] NVARCHAR(1000) NOT NULL,
    [applicationId] NVARCHAR(1000) NOT NULL,
    [roundNumber] INT NOT NULL,
    [interviewType] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [job_interviews_status_df] DEFAULT 'PENDING',
    [scheduledDate] DATETIME2,
    [scheduledTime] NVARCHAR(1000),
    [timezone] NVARCHAR(1000),
    [meetingPlatform] NVARCHAR(1000),
    [meetingLink] NVARCHAR(1000),
    [interviewerName] NVARCHAR(1000),
    [interviewerEmail] NVARCHAR(1000),
    [location] NVARCHAR(1000),
    [notes] NVARCHAR(max),
    [completedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [job_interviews_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [job_interviews_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [job_interviews_applicationId_roundNumber_key] UNIQUE NONCLUSTERED ([applicationId],[roundNumber])
);

-- CreateTable
CREATE TABLE [dbo].[application_timeline] (
    [id] NVARCHAR(1000) NOT NULL,
    [applicationId] NVARCHAR(1000) NOT NULL,
    [event] NVARCHAR(1000) NOT NULL,
    [timestamp] DATETIME2 NOT NULL CONSTRAINT [application_timeline_timestamp_df] DEFAULT CURRENT_TIMESTAMP,
    [notes] NVARCHAR(1000),
    CONSTRAINT [application_timeline_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [job_applications_userId_idx] ON [dbo].[job_applications]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [job_applications_userId_status_idx] ON [dbo].[job_applications]([userId], [status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [job_interviews_applicationId_idx] ON [dbo].[job_interviews]([applicationId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [application_timeline_applicationId_idx] ON [dbo].[application_timeline]([applicationId]);

-- AddForeignKey
ALTER TABLE [dbo].[job_applications] ADD CONSTRAINT [job_applications_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[job_applications] ADD CONSTRAINT [job_applications_resumeId_fkey] FOREIGN KEY ([resumeId]) REFERENCES [dbo].[resumes]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[job_applications] ADD CONSTRAINT [job_applications_resumeVersionId_fkey] FOREIGN KEY ([resumeVersionId]) REFERENCES [dbo].[resume_versions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[job_applications] ADD CONSTRAINT [job_applications_coverLetterId_fkey] FOREIGN KEY ([coverLetterId]) REFERENCES [dbo].[cover_letters]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[job_applications] ADD CONSTRAINT [job_applications_jobDescriptionId_fkey] FOREIGN KEY ([jobDescriptionId]) REFERENCES [dbo].[job_descriptions]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[job_interviews] ADD CONSTRAINT [job_interviews_applicationId_fkey] FOREIGN KEY ([applicationId]) REFERENCES [dbo].[job_applications]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[application_timeline] ADD CONSTRAINT [application_timeline_applicationId_fkey] FOREIGN KEY ([applicationId]) REFERENCES [dbo].[job_applications]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
