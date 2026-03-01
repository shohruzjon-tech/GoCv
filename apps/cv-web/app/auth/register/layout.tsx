import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Free Account",
  description:
    "Create your free GoCV account and start building professional, AI-powered resumes in minutes. No credit card required.",
  alternates: {
    canonical: "/auth/register",
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
