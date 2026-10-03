import { createFileRoute } from "@tanstack/react-router";
import { EmptyState, PageHeader } from "@/components/glass";

export const Route = createFileRoute("/tailoring")({
  head: () => ({
    meta: [
      { title: "Job Tailoring — ResumeForge" },
      { name: "description", content: "Tailor a resume to a job description — coming in the next build." },
      { property: "og:title", content: "Job Tailoring — ResumeForge" },
      { property: "og:description", content: "Tailor a resume to a job description — coming in the next build." },
    ],
  }),
  component: TailoringPage,
});

function TailoringPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Job Tailoring" subtitle="Built on the same resume data as the editor." />
      <EmptyState title="Coming next" body="Tailor a resume to a job description — coming in the next build." />
    </div>
  );
}
