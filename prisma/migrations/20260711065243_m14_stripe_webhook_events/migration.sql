BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[stripe_webhook_events] (
    [id] NVARCHAR(1000) NOT NULL,
    [stripeEventId] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [stripe_webhook_events_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [stripe_webhook_events_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [stripe_webhook_events_stripeEventId_key] UNIQUE NONCLUSTERED ([stripeEventId])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
