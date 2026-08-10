-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL,
    "aboutTitle" TEXT NOT NULL DEFAULT 'About Elearning',
    "aboutContent" TEXT NOT NULL DEFAULT 'Elearning is a place to learn real, job-ready skills from instructors who use them every day.',
    "footerTagline" TEXT NOT NULL DEFAULT 'Learn skills that move your career forward.',
    "footerCopyright" TEXT,
    "twitterUrl" TEXT,
    "linkedinUrl" TEXT,
    "githubUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
