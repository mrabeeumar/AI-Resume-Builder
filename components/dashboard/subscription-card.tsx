import { CreditCardIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SubscriptionCardProps {
  plan: string;
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

function statusVariant(status: string, cancelAtPeriodEnd: boolean) {
  if (cancelAtPeriodEnd) return "warning" as const;
  if (status.toUpperCase() === "ACTIVE") return "success" as const;
  if (status.toUpperCase() === "PAST_DUE") return "destructive" as const;
  return "secondary" as const;
}

function SubscriptionCard({
  plan,
  status,
  currentPeriodEnd,
  cancelAtPeriodEnd,
}: SubscriptionCardProps) {
  return (
    <Card className="hover-glow">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="from-chart-violet/20 to-chart-violet/5 text-chart-violet ring-chart-violet/15 flex size-9 items-center justify-center rounded-lg bg-gradient-to-br ring-1 ring-inset">
            <CreditCardIcon className="size-4.5" />
          </div>
          <CardTitle className="text-lg">Subscription</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge className="capitalize">{plan.toLowerCase()}</Badge>
          <Badge variant={statusVariant(status, cancelAtPeriodEnd)} className="capitalize">
            {status.toLowerCase().replace("_", " ")}
          </Badge>
        </div>
        {currentPeriodEnd ? (
          <p className="text-muted-foreground text-xs">
            {cancelAtPeriodEnd ? "Cancels" : "Renews"} on{" "}
            {currentPeriodEnd.toLocaleDateString()}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export { SubscriptionCard };
