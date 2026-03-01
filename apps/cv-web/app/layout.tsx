import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gocv.live";
const SITE_NAME = "GoCV";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8faff" },
    { media: "(prefers-color-scheme: dark)", color: "#08081a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default:
      "GoCV — Free AI Resume Builder | Create Professional CV Online in Minutes",
    template: "%s | GoCV — Free AI Resume Builder",
  },

  description:
    "Build your professional resume for free with GoCV's AI-powered resume builder. Generate ATS-optimized CVs, get a shareable online page, and download stunning PDF resumes in minutes. Better than Zety, Resume.io, Novoresume & Canva.",

  keywords: [
    // ── Primary service keywords (free emphasis) ──
    "free resume builder",
    "free CV builder",
    "free AI resume builder",
    "free online resume maker",
    "free CV maker online",
    "free professional resume builder",
    "create resume free",
    "build CV for free",
    "free resume generator",
    "free CV generator",

    // ── AI & technology keywords ──
    "AI resume builder",
    "AI CV builder",
    "AI resume generator",
    "AI-powered resume maker",
    "GPT resume builder",
    "AI resume writer",
    "smart resume builder",
    "automated resume builder",

    // ── Feature keywords ──
    "ATS-optimized resume",
    "ATS-friendly CV",
    "ATS resume builder",
    "resume PDF download free",
    "online resume page",
    "shareable CV link",
    "resume landing page",
    "resume portfolio builder",
    "resume with projects",
    "resume website builder",

    // ── Job seeker intent keywords ──
    "professional resume builder",
    "modern resume builder",
    "best resume builder 2026",
    "resume builder for developers",
    "resume builder for engineers",
    "resume builder no sign up",
    "instant resume builder",
    "quick resume maker",
    "one page resume builder",
    "creative resume builder",

    // ── Competitor brand keywords ──
    "Zety alternative",
    "Zety free alternative",
    "Resume.io alternative",
    "Resume.io free alternative",
    "Novoresume alternative",
    "Novoresume free alternative",
    "Canva resume alternative",
    "Canva resume builder alternative",
    "Indeed resume builder alternative",
    "LinkedIn resume builder alternative",
    "Kickresume alternative",
    "Kickresume free alternative",
    "VisualCV alternative",
    "Enhancv alternative",
    "Enhancv free alternative",
    "Resumake alternative",
    "FlowCV alternative",
    "FlowCV free alternative",
    "Standard Resume alternative",
    "Reactive Resume alternative",
    "Teal resume builder alternative",
    "Rezi AI alternative",
    "Rezi free alternative",
    "ResumAI alternative",

    // ── Long-tail keywords ──
    "free resume builder with AI",
    "best free AI resume builder 2026",
    "create CV with AI for free",
    "free resume builder no watermark",
    "free resume builder with PDF download",
    "build resume with chatgpt",
    "resume builder with shareable link",
    "resume builder with portfolio",
    "developer resume builder",
    "software engineer resume builder free",
    "tech resume builder free",
  ],

  authors: [{ name: "GoCV", url: SITE_URL }],
  creator: "GoCV",
  publisher: "GoCV",

  applicationName: SITE_NAME,
  generator: "Next.js",
  referrer: "origin-when-cross-origin",

  category: "Technology",
  classification: "Resume Builder, CV Builder, Career Tools",

  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title:
      "GoCV — Free AI Resume Builder | Create Professional CV Online in Minutes",
    description:
      "Build your professional resume for free with AI. Generate ATS-optimized CVs, get a shareable online page, and download stunning PDF resumes. No watermarks, no hidden fees.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GoCV — Free AI-Powered Resume Builder",
        type: "image/png",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "GoCV — Free AI Resume Builder | Create Professional CV in Minutes",
    description:
      "Build your professional resume for free with AI. ATS-optimized, shareable online page, PDF export. Better than Zety, Resume.io & Canva.",
    images: ["/og-image.png"],
    creator: "@gocv_live",
    site: "@gocv_live",
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: SITE_URL,
  },

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },

  manifest: "/site.webmanifest",

  other: {
    "msapplication-TileColor": "#08081a",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": SITE_NAME,
    "mobile-web-app-capable": "yes",
    "format-detection": "telephone=no",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description:
          "Free AI-powered resume builder. Create professional, ATS-optimized CVs with shareable online pages and PDF export.",
        publisher: { "@id": `${SITE_URL}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
        inLanguage: "en-US",
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/gocv_logo.png`,
          width: 1139,
          height: 501,
        },
        sameAs: [],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#application`,
        name: "GoCV — Free AI Resume Builder",
        url: SITE_URL,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Resume Builder",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          description:
            "Free plan with AI-generated CV, templates, shareable link, and PDF download",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          ratingCount: "2500",
          bestRating: "5",
          worstRating: "1",
        },
        featureList:
          "AI Resume Generation, ATS Optimization, PDF Export, Shareable Online Page, Project Portfolio, Beautiful Templates, AI Chat Assistant",
        screenshot: `${SITE_URL}/og-image.png`,
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: "GoCV — Free AI Resume Builder | Create Professional CV Online in Minutes",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#application` },
        description:
          "Build your professional resume for free with GoCV's AI-powered resume builder. Generate ATS-optimized CVs, get a shareable online page, and download stunning PDF resumes in minutes.",
        inLanguage: "en-US",
        potentialAction: {
          "@type": "ReadAction",
          target: [SITE_URL],
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "Is GoCV really free?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes! GoCV offers a free plan that includes 1 AI-generated CV, basic templates, a shareable link, and PDF download. No credit card required, no watermarks.",
            },
          },
          {
            "@type": "Question",
            name: "How does the AI resume builder work?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Simply describe your experience and skills in plain language. Our AI (powered by GPT-5) analyzes your input and generates professional, ATS-optimized resume content tailored to your industry.",
            },
          },
          {
            "@type": "Question",
            name: "Is GoCV better than Zety or Resume.io?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "GoCV offers AI-powered content generation, a free shareable online CV page, and project portfolio features that most competitors like Zety, Resume.io, and Novoresume don't include in their free plans.",
            },
          },
          {
            "@type": "Question",
            name: "Are GoCV resumes ATS-friendly?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, every CV generated by GoCV is optimized for Applicant Tracking Systems (ATS). Our templates use clean formatting and proper heading structures to ensure maximum compatibility.",
            },
          },
          {
            "@type": "Question",
            name: "Can I download my resume as PDF for free?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Absolutely! All GoCV plans, including the free tier, allow you to download your resume as a pixel-perfect PDF ready for job applications.",
            },
          },
        ],
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${inter.variable} ${jakarta.variable} font-sans antialiased bg-page`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
