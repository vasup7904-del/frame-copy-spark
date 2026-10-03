import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader } from "@/components/glass";

export const Route = createFileRoute("/cover-letters")({
  head: () => ({
    meta: [
      { title: "Cover Letters — ResumeForge" },
      { name: "description", content: "Write cover letters from your resume — coming in the next build." },
      { property: "og:title", content: "Cover Letters — ResumeForge" },
      { property: "og:description", content: "Write cover letters from your resume — coming in the next build." },
    ],
  }),
  component: CoverLettersPage,
});

function CoverLettersPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Cover Letters" subtitle="Built on the same resume data as the editor." />
      <EmptyState title="Coming next" body="Write cover letters from your resume — coming in the next build." />
    </div>
  );
}
