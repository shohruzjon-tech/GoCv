import { redirect } from "next/navigation";

/**
 * Legacy builder page — permanently redirects to the new CV generation wizard.
 * Kept so any bookmarks / old links still work.
 */
export default function BuilderRedirect() {
  redirect("/dashboard/cv/generate");
}
