"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { STATUS_LABELS, StatusBadge } from "@/components/applications/status-badge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { JOB_APPLICATION_STATUSES } from "@/lib/enums";

export function SearchFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard/applications?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("search", search);
  };

  const currentStatus = searchParams.get("status") ?? "";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form onSubmit={handleSearchSubmit} className="flex-1">
        <Input
          type="search"
          placeholder="Search by company, position, or location"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>
      <div className="flex flex-wrap gap-1.5">
        <Badge
          asChild
          variant={currentStatus === "" ? "default" : "secondary"}
          className={cn(
            "cursor-pointer select-none",
            currentStatus === ""
              ? "ring-primary ring-2 ring-offset-2 ring-offset-background"
              : "opacity-70 transition-opacity hover:opacity-100",
          )}
        >
          <button type="button" onClick={() => updateParam("status", "")}>
            All
          </button>
        </Badge>
        {JOB_APPLICATION_STATUSES.map((status) => (
          <StatusBadge
            key={status}
            status={status}
            asChild
            className={cn(
              "cursor-pointer select-none",
              currentStatus === status
                ? "ring-primary ring-2 ring-offset-2 ring-offset-background"
                : "opacity-70 transition-opacity hover:opacity-100",
            )}
          >
            <button type="button" onClick={() => updateParam("status", status)}>
              {STATUS_LABELS[status]}
            </button>
          </StatusBadge>
        ))}
      </div>
    </div>
  );
}
