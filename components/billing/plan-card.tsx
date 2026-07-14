import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  name: string;
  description: string;
  features: string[];
  isCurrent: boolean;
  action?: React.ReactNode;
}

function PlanCard({
  name,
  description,
  features,
  isCurrent,
  action,
}: PlanCardProps) {
  return (
    <Card
      className={cn(
        "hover-glow flex-1",
        isCurrent &&
          "border-primary/40 from-primary/[0.07] to-card ring-primary/30 bg-gradient-to-b shadow-md ring-1",
      )}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">{name}</CardTitle>
          {isCurrent ? <Badge>Current plan</Badge> : null}
        </div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <ul className="text-foreground flex flex-col gap-2 text-sm">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2.5">
              <span className="from-brand-1 to-brand-2 size-1.5 shrink-0 rounded-full bg-gradient-to-br" />
              {feature}
            </li>
          ))}
        </ul>
        {action ? <div className="mt-auto">{action}</div> : null}
      </CardContent>
    </Card>
  );
}

export { PlanCard };
