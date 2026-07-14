BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[rate_limit_counters] (
    [key] NVARCHAR(1000) NOT NULL,
    [count] INT NOT NULL CONSTRAINT [rate_limit_counters_count_df] DEFAULT 0,
    [expiresAt] DATETIME2 NOT NULL,
    CONSTRAINT [rate_limit_counters_pkey] PRIMARY KEY CLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[ats_report_cache] (
    [key] NVARCHAR(1000) NOT NULL,
    [payload] NVARCHAR(max) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    CONSTRAINT [ats_report_cache_pkey] PRIMARY KEY CLUSTERED ([key])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [rate_limit_counters_expiresAt_idx] ON [dbo].[rate_limit_counters]([expiresAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [ats_report_cache_expiresAt_idx] ON [dbo].[ats_report_cache]([expiresAt]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
