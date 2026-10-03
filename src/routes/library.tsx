import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/glass";
import { ResumeCard } from "@/components/resume-card";
import { useAppData } from "@/lib/store";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Library — ResumeForge" },
      { name: "description", content: "Search and manage all your saved resumes." },
      { property: "og:title", content: "Library — ResumeForge" },
      { property: "og:description", content: "Search and manage all your saved resumes." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const data = useAppData();
  const [q, setQ] = useState("");
  const list = [...data.resumes]
    .filter((r) => r.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt);
  return (
    <div className="space-y-5">
      <PageHeader title="Library" subtitle="All your saved documents." />
      <Input
        className="glass-input max-w-sm"
        placeholder="Search resumes…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {list.length === 0 ? (
        <EmptyState title="Nothing here" body="Saved resumes will appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => (
            <ResumeCard key={r.id} resume={r} />
          ))}
        </div>
      )}
    </div>
  );
}
