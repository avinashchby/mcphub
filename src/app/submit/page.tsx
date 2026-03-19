import type { Metadata } from "next";
import { getAllCategories } from "@/lib/db";
import { SubmitForm } from "@/components/submit-form";

export const metadata: Metadata = {
  title: "Submit a Server — mcphub",
  description: "Add a new MCP server to the directory.",
};

/** Server submission page — fetches categories server-side, delegates form to client. */
export default function SubmitPage() {
  const categories = getAllCategories();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Submit a Server</h1>
        <p className="text-muted-foreground">
          Add a new MCP server to the directory. Provide a GitHub URL and we will
          auto-populate as much as we can.
        </p>
      </div>

      <SubmitForm categories={categories} />
    </div>
  );
}
