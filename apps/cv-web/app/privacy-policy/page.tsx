import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - CV Builder",
  description: "Privacy Policy for CV Builder AI-Powered Resume Builder",
};

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p className="mb-12 text-sm text-zinc-500">
          Last updated: February 26, 2026
        </p>

        <div className="space-y-10 text-zinc-600 dark:text-zinc-400 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-zinc-900 dark:[&_h2]:text-white [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-zinc-800 dark:[&_h3]:text-zinc-200 [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6">
          <section>
            <h2>1. Introduction</h2>
            <p>
              Welcome to CV Builder (&quot;we,&quot; &quot;our,&quot; or
              &quot;us&quot;). We are committed to protecting your personal
              information and your right to privacy. This Privacy Policy
              explains what information we collect, how we use it, and what
              rights you have in relation to it.
            </p>
            <p>
              By using our AI-powered CV building service, you agree to the
              collection and use of information in accordance with this policy.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>

            <h3>2.1 Information You Provide</h3>
            <ul>
              <li>
                <strong>Account Information:</strong> When you sign in with
                Google, we receive your name, email address, and profile picture
                from your Google account.
              </li>
              <li>
                <strong>CV & Profile Data:</strong> Personal details, work
                experience, education, skills, and other information you provide
                to build your CV.
              </li>
              <li>
                <strong>Project Data:</strong> Project descriptions, images, and
                links you upload to your portfolio.
              </li>
              <li>
                <strong>AI Interactions:</strong> Prompts and conversations you
                have with our AI assistant to generate or edit CV content.
              </li>
            </ul>

            <h3>2.2 Information Collected Automatically</h3>
            <ul>
              <li>
                <strong>Session Data:</strong> IP address, browser type, device
                information, and session activity for security and analytics.
              </li>
              <li>
                <strong>Usage Data:</strong> Pages visited, features used, and
                interaction patterns to improve our service.
              </li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide, maintain, and improve the CV Builder service.</li>
              <li>
                Generate AI-powered CV content tailored to your profile and
                preferences.
              </li>
              <li>
                Create and host your public CV landing page if you choose to
                publish it.
              </li>
              <li>Generate PDF exports of your CV.</li>
              <li>Authenticate your identity and maintain session security.</li>
              <li>
                Send service-related communications (e.g., account
                notifications).
              </li>
              <li>Monitor and prevent fraudulent or unauthorized activity.</li>
            </ul>
          </section>

          <section>
            <h2>4. Data Storage & Security</h2>
            <p>
              Your data is stored securely using industry-standard practices:
            </p>
            <ul>
              <li>
                <strong>Database:</strong> CV and profile data is stored in
                MongoDB with encryption at rest.
              </li>
              <li>
                <strong>File Storage:</strong> Uploaded images and documents are
                stored in AWS S3 with restricted access policies.
              </li>
              <li>
                <strong>Authentication:</strong> We use JWT tokens with secure
                session management. Passwords (for admin accounts) are hashed
                using bcrypt.
              </li>
              <li>
                <strong>Transport:</strong> All data is transmitted over HTTPS.
              </li>
            </ul>
          </section>

          <section>
            <h2>5. Third-Party Services</h2>
            <p>
              We integrate with the following third-party services, each with
              their own privacy policies:
            </p>
            <ul>
              <li>
                <strong>Google OAuth:</strong> For authentication (
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-700"
                >
                  Google Privacy Policy
                </a>
                ).
              </li>
              <li>
                <strong>OpenAI:</strong> For AI-powered CV generation. Your CV
                data and prompts are sent to OpenAI&apos;s API for processing (
                <a
                  href="https://openai.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-700"
                >
                  OpenAI Privacy Policy
                </a>
                ).
              </li>
              <li>
                <strong>Amazon Web Services:</strong> For file storage and
                infrastructure (
                <a
                  href="https://aws.amazon.com/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-700"
                >
                  AWS Privacy Policy
                </a>
                ).
              </li>
            </ul>
          </section>

          <section>
            <h2>6. Data Sharing</h2>
            <p>
              We do <strong>not</strong> sell your personal data. We only share
              your information in these circumstances:
            </p>
            <ul>
              <li>
                <strong>Public CVs:</strong> If you publish your CV, the content
                you choose to make public will be accessible via your unique
                shareable URL.
              </li>
              <li>
                <strong>AI Processing:</strong> CV data is sent to OpenAI for
                content generation. We do not share more data than necessary for
                this purpose.
              </li>
              <li>
                <strong>Legal Requirements:</strong> We may disclose information
                if required by law, legal process, or governmental request.
              </li>
            </ul>
          </section>

          <section>
            <h2>7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>
                <strong>Access:</strong> Request a copy of the personal data we
                hold about you.
              </li>
              <li>
                <strong>Rectification:</strong> Update or correct your personal
                information through your dashboard.
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and
                all associated data.
              </li>
              <li>
                <strong>Portability:</strong> Export your CV data in PDF format.
              </li>
              <li>
                <strong>Withdraw Consent:</strong> Unpublish your public CV at
                any time or revoke Google OAuth access.
              </li>
            </ul>
          </section>

          <section>
            <h2>8. Cookies & Local Storage</h2>
            <p>
              We use browser local storage to maintain your authentication
              session (JWT token and basic user profile). We do not use
              third-party tracking cookies. Essential session data is required
              for the service to function.
            </p>
          </section>

          <section>
            <h2>9. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. If you
              delete your account, we will delete all associated personal data,
              CVs, projects, and uploaded files within 30 days. Some anonymized,
              aggregated data may be retained for analytics purposes.
            </p>
          </section>

          <section>
            <h2>10. Children&apos;s Privacy</h2>
            <p>
              Our service is not intended for users under the age of 16. We do
              not knowingly collect personal information from children. If we
              learn that we have collected data from a child under 16, we will
              take steps to delete it promptly.
            </p>
          </section>

          <section>
            <h2>11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by posting the new policy on
              this page and updating the &quot;Last updated&quot; date. Your
              continued use of the service after changes constitutes acceptance
              of the updated policy.
            </p>
          </section>

          <section>
            <h2>12. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or your
              personal data, please contact us at:
            </p>
            <p>
              <strong>Email:</strong>{" "}
              <a
                href="mailto:privacy@cvbuilder.com"
                className="text-blue-600 underline hover:text-blue-700"
              >
                privacy@cvbuilder.com
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
