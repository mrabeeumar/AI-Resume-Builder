import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface BackButtonProps {
  href: string;
  label: string;
}

function BackButton({ href, label }: BackButtonProps) {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-3 w-fit">
      <Link href={href}>
        <ArrowLeft className="size-4" />
        {label}
      </Link>
    </Button>
  );
}

export { BackButton };
