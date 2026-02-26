import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - CV Builder",
  description: "Terms of Service for CV Builder AI-Powered Resume Builder",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/60 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-bold text-zinc-900 dark:text-white">
              CV Builder
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="mb-2 text-4xl font-bold text-zinc-900 dark:text-white">
          Terms of Service
        </h1>
        <p className="mb-12 text-sm text-zinc-500">
          Last updated: February 26, 2026
        </p>

        <div className="space-y-10 text-zinc-600 dark:text-zinc-400 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-zinc-900 dark:[&_h2]:text-white [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-zinc-800 dark:[&_h3]:text-zinc-200 [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6">
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using CV Builder (&quot;the Service&quot;), you
              agree to be bound by these Terms of Service (&quot;Terms&quot;).
              If you do not agree to these Terms, you may not use the Service.
            </p>
            <p>
              These Terms constitute a legally binding agreement between you and
              CV Builder. We reserve the right to update these Terms at any
              time, and your continued use of the Service after such changes
              constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>
              CV Builder is an AI-powered resume and CV building platform that
              provides:
            </p>
            <ul>
              <li>AI-assisted CV and resume content generation using GPT-5.</li>
              <li>
                CV editing, formatting, and section management through an
                interactive builder.
              </li>
              <li>Public CV landing pages with unique shareable URLs.</li>
              <li>PDF export and download of generated CVs.</li>
              <li>Project portfolio management with image gallery uploads.</li>
              <li>Google OAuth-based authentication.</li>
            </ul>
          </section>

          <section>
            <h2>3. Account Registration</h2>

            <h3>3.1 Google Authentication</h3>
            <p>
              You sign in using your Google account. By doing so, you authorize
              us to access your basic profile information (name, email, profile
              picture) as described in our{" "}
              <Link
                href="/privacy-policy"
                className="text-blue-600 underline hover:text-blue-700"
              >
                Privacy Policy
              </Link>
              .
            </p>

            <h3>3.2 Account Responsibility</h3>
            <p>
              You are responsible for all activity that occurs under your
              account. You must not share your account or allow unauthorized
              access. You agree to notify us immediately of any unauthorized
              use.
            </p>

            <h3>3.3 Account Termination</h3>
            <p>
              We reserve the right to suspend or terminate your account at any
              time if you violate these Terms, engage in abusive behavior, or
              use the Service in a manner that may harm other users or our
              infrastructure.
            </p>
          </section>

          <section>
            <h2>4. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul>
              <li>
                Upload, generate, or publish content that is false, misleading,
                defamatory, obscene, harassing, or illegal.
              </li>
              <li>
                Impersonate another person or misrepresent your qualifications,
                credentials, or identity.
              </li>
              <li>
                Attempt to gain unauthorized access to the Service, other user
                accounts, or our systems.
              </li>
              <li>
                Use automated tools, bots, or scrapers to access or extract data
                from the Service without our written consent.
              </li>
              <li>Upload malware, viruses, or any harmful code or files.</li>
              <li>
                Abuse the AI features by submitting excessive, automated, or
                malicious prompts designed to circumvent safety measures.
              </li>
              <li>
                Use the Service for any unlawful purpose or in violation of any
                applicable laws or regulations.
              </li>
            </ul>
          </section>

          <section>
            <h2>5. Intellectual Property</h2>

            <h3>5.1 Your Content</h3>
            <p>
              You retain ownership of all content you create, upload, or input
              into the Service, including your CV data, project descriptions,
              images, and profile information. By using the Service, you grant
              us a limited, non-exclusive license to process, store, and display
              your content as necessary to provide the Service.
            </p>

            <h3>5.2 AI-Generated Content</h3>
            <p>
              Content generated by our AI (including CV text, summaries, and
              HTML layouts) is created based on your input. You are granted full
              usage rights to any AI-generated content for your personal and
              professional use. You are responsible for reviewing and verifying
              the accuracy of all AI-generated content before use.
            </p>

            <h3>5.3 Our Property</h3>
            <p>
              The Service, including its design, code, features, trademarks, and
              branding, is owned by CV Builder and protected by intellectual
              property laws. You may not copy, modify, distribute, or reverse
              engineer any part of the Service.
            </p>
          </section>

          <section>
            <h2>6. AI-Generated Content Disclaimer</h2>
            <p>
              Our AI generates content based on the information and prompts you
              provide. Please be aware:
            </p>
            <ul>
              <li>
                AI-generated content may contain inaccuracies, errors, or
                fabricated information. Always review and verify before using.
              </li>
              <li>
                We do not guarantee that AI-generated content will be suitable
                for any specific purpose or job application.
              </li>
              <li>
                You are solely responsible for the accuracy and truthfulness of
                the content in your published CV.
              </li>
              <li>
                AI outputs may vary and are not deterministic — the same prompt
                may produce different results.
              </li>
            </ul>
          </section>

          <section>
            <h2>7. Public CV Pages</h2>
            <p>
              When you publish your CV, it becomes accessible via a unique
              public URL. By publishing, you acknowledge that:
            </p>
            <ul>
              <li>
                The published content is publicly visible to anyone with the
                link.
              </li>
              <li>Search engines may index your public CV page.</li>
              <li>
                You can unpublish your CV at any time to remove public access.
              </li>
              <li>
                You are responsible for ensuring published content does not
                violate any third-party rights or applicable laws.
              </li>
            </ul>
          </section>

          <section>
            <h2>8. File Uploads</h2>
            <p>
              You may upload images and files for your project portfolio. By
              uploading, you confirm that:
            </p>
            <ul>
              <li>You own or have the right to use all uploaded files.</li>
              <li>
                Uploaded files do not infringe on any third-party copyrights,
                trademarks, or other rights.
              </li>
              <li>
                Files must not contain malicious content, explicit material, or
                illegal content.
              </li>
            </ul>
            <p>
              We impose file size limits (5 MB for images, 10 MB for documents)
              and reserve the right to remove content that violates these Terms.
            </p>
          </section>

          <section>
            <h2>9. Service Availability</h2>
            <p>
              We strive to keep the Service available at all times, but we do
              not guarantee uninterrupted or error-free operation. The Service
              may be temporarily unavailable due to maintenance, updates, or
              circumstances beyond our control. We are not liable for any loss
              or damage arising from Service downtime.
            </p>
          </section>

          <section>
            <h2>10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, CV Builder and its
              operators shall not be liable for:
            </p>
            <ul>
              <li>
                Any indirect, incidental, special, consequential, or punitive
                damages arising from your use of the Service.
              </li>
              <li>
                Loss of data, revenue, employment opportunities, or business
                arising from the use or inability to use the Service.
              </li>
              <li>
                Any inaccuracies in AI-generated content or reliance on such
                content.
              </li>
              <li>
                Unauthorized access to your account due to your failure to
                maintain account security.
              </li>
            </ul>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as
              available&quot; without warranties of any kind, express or
              implied.
            </p>
          </section>

          <section>
            <h2>11. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless CV Builder, its
              operators, and affiliates from any claims, losses, damages,
              liabilities, and expenses (including legal fees) arising from your
              use of the Service, your violation of these Terms, or your
              violation of any rights of a third party.
            </p>
          </section>

          <section>
            <h2>12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with
              the laws of the jurisdiction in which CV Builder operates, without
              regard to conflict of law principles. Any disputes shall be
              resolved in the competent courts of that jurisdiction.
            </p>
          </section>

          <section>
            <h2>13. Changes to These Terms</h2>
            <p>
              We may modify these Terms at any time. Material changes will be
              communicated by updating the &quot;Last updated&quot; date at the
              top of this page. Continued use of the Service after changes are
              posted constitutes your acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2>14. Contact Us</h2>
            <p>
              If you have any questions about these Terms of Service, please
              contact us at:
            </p>
            <p>
              <strong>Email:</strong>{" "}
              <a
                href="mailto:legal@cvbuilder.com"
                className="text-blue-600 underline hover:text-blue-700"
              >
                legal@cvbuilder.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-white py-8 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 text-sm text-zinc-500 sm:flex-row sm:justify-between sm:px-6">
          <span>
            © {new Date().getFullYear()} CV Builder. All rights reserved.
          </span>
          <div className="flex gap-6">
            <Link
              href="/privacy-policy"
              className="hover:text-zinc-900 dark:hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-service"
              className="hover:text-zinc-900 dark:hover:text-white"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
