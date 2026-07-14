"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HeartIcon, SearchIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  RESUME_TEMPLATE_IDS,
  RESUME_THEME_COLORS,
  type ResumeTemplateId,
  type ResumeThemeColor,
} from "@/lib/enums";
import {
  TEMPLATE_DESCRIPTIONS,
  TEMPLATE_LABELS,
  THEME_COLOR_CLASSES,
} from "@/lib/resume-templates";

type GalleryEntry = {
  id: string;
  templateId: ResumeTemplateId;
  themeColor: ResumeThemeColor;
  name: string;
  description: string;
};

const GALLERY: GalleryEntry[] = RESUME_TEMPLATE_IDS.flatMap((templateId) =>
  RESUME_THEME_COLORS.map((themeColor) => ({
    id: `${templateId}-${themeColor}`,
    templateId,
    themeColor,
    name: `${TEMPLATE_LABELS[templateId]} ${themeColor.charAt(0)}${themeColor.slice(1).toLowerCase()}`,
    description: TEMPLATE_DESCRIPTIONS[templateId],
  })),
);

const CATEGORIES: { label: string; value: ResumeTemplateId | "ALL" }[] = [
  { label: "All", value: "ALL" },
  ...RESUME_TEMPLATE_IDS.map((id) => ({ label: TEMPLATE_LABELS[id], value: id })),
];

function TemplatePreview({ themeColor }: { themeColor: ResumeThemeColor }) {
  const classes = THEME_COLOR_CLASSES[themeColor];
  return (
    <div className="flex flex-col gap-2.5 p-5">
      <div className="bg-foreground h-2.5 w-3/5 rounded" />
      <div className="bg-muted-foreground/30 h-1.5 w-2/5 rounded" />
      <div className="bg-border my-3 h-px" />
      {[0, 1, 2].map((block) => (
        <div key={block} className="flex flex-col gap-1.5">
          <div className={cn("h-1.5 w-1/4 rounded", classes.swatch)} />
          <div className="bg-muted h-1.5 w-11/12 rounded" />
          <div className="bg-muted h-1.5 w-4/5 rounded" />
        </div>
      ))}
    </div>
  );
}

function TemplateGallery() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    ResumeTemplateId | "ALL" | "FAVORITES"
  >("ALL");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GALLERY.filter((entry) => {
      if (activeCategory === "FAVORITES" && !favorites.has(entry.id))
        return false;
      if (
        activeCategory !== "ALL" &&
        activeCategory !== "FAVORITES" &&
        entry.templateId !== activeCategory
      )
        return false;
      if (
        q &&
        !entry.name.toLowerCase().includes(q) &&
        !entry.description.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [query, activeCategory, favorites]);

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-card focus-within:border-ring focus-within:ring-ring/30 mx-auto flex w-full max-w-xl items-center gap-3 rounded-xl border px-4 py-3 shadow-xs transition-[border-color,box-shadow] duration-200 focus-within:ring-[3px] hover:shadow-sm">
        <SearchIcon className="text-muted-foreground size-4 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates…"
          className="placeholder:text-muted-foreground flex-1 border-none bg-transparent text-sm outline-none"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setActiveCategory(cat.value)}
            className={cn(
              "cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95",
              activeCategory === cat.value
                ? "from-brand-1 to-brand-2 shadow-primary/30 border-transparent bg-gradient-to-r text-white shadow-md"
                : "hover:border-primary/50 hover:text-primary bg-card text-foreground hover:-translate-y-0.5 hover:shadow-sm",
            )}
          >
            {cat.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setActiveCategory("FAVORITES")}
          className={cn(
            "cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 active:scale-95",
            activeCategory === "FAVORITES"
              ? "border-primary bg-primary text-primary-foreground shadow-primary/25 shadow-md"
              : "hover:border-primary/50 hover:text-primary bg-card text-foreground hover:-translate-y-0.5 hover:shadow-sm",
          )}
        >
          Favorites
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center text-sm">
          No templates match &quot;{query}&quot; — try a different search.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((entry) => {
            const isFavorite = favorites.has(entry.id);
            return (
              <div key={entry.id} className="group flex flex-col gap-2.5">
                <div className="bg-card group-hover:border-primary/30 relative overflow-hidden rounded-xl border transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-xl">
                  <TemplatePreview themeColor={entry.themeColor} />
                  <button
                    type="button"
                    onClick={() => toggleFavorite(entry.id)}
                    aria-label={
                      isFavorite ? "Remove from favorites" : "Add to favorites"
                    }
                    className="bg-card/90 absolute top-3 right-3 flex size-8 cursor-pointer items-center justify-center rounded-full border backdrop-blur transition-transform duration-200 hover:scale-110 active:scale-90"
                  >
                    <HeartIcon
                      className={cn(
                        "size-4",
                        isFavorite
                          ? "fill-destructive text-destructive"
                          : "text-muted-foreground",
                      )}
                    />
                  </button>
                  <div className="from-foreground/80 absolute inset-x-0 bottom-0 flex translate-y-2 justify-center bg-gradient-to-t to-transparent p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <Button size="sm" asChild>
                      <Link href="/register">Use this template</Link>
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-heading text-sm font-semibold">
                      {entry.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {TEMPLATE_LABELS[entry.templateId]}
                    </p>
                  </div>
                  <Badge variant="success">ATS ✓</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { TemplateGallery };
