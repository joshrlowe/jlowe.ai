-- CreateEnum
CREATE TYPE "project_status" AS ENUM ('Planned', 'InProgress', 'InDevelopment', 'InTesting', 'Completed', 'InProduction', 'Maintenance', 'OnHold', 'Deprecated', 'Sunsetted');

-- CreateEnum
CREATE TYPE "content_type" AS ENUM ('Article', 'Video');

-- CreateTable
CREATE TABLE "welcome" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "briefBio" TEXT NOT NULL,
    "callToAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "welcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "about" (
    "id" TEXT NOT NULL,
    "professionalSummary" TEXT NOT NULL,
    "technicalSkills" JSONB NOT NULL,
    "professionalExperience" JSONB NOT NULL,
    "education" JSONB NOT NULL,
    "technicalCertifications" JSONB NOT NULL,
    "leadershipExperience" JSONB NOT NULL,
    "hobbies" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "about_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "emailAddress" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "socialMediaLinks" JSONB,
    "location" JSONB,
    "availability" JSONB,
    "additionalContactMethods" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "repositoryLink" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "releaseDate" TIMESTAMP(3),
    "status" "project_status",
    "techStack" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_team_members" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,

    CONSTRAINT "project_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contentType" "content_type" NOT NULL,
    "url" TEXT,
    "content" TEXT,
    "tags" TEXT[],
    "datePublished" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resources_slug_key" ON "resources"("slug");

-- CreateIndex
CREATE INDEX "resources_topic_idx" ON "resources"("topic");

-- CreateIndex
CREATE INDEX "resources_slug_idx" ON "resources"("slug");

-- AddForeignKey
ALTER TABLE "project_team_members" ADD CONSTRAINT "project_team_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
