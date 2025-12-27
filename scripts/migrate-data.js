import mongoose from "mongoose";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { mapProjectStatus } from "../lib/utils/projectStatusMapper.js";
import { cleanMongoFields, deepClone } from "../lib/utils/jsonUtils.js";

dotenv.config();

const prisma = new PrismaClient();
const mongoUri =
  process.env.MONGODB_URL ||
  process.env.MONGODB_URI ||
  "mongodb://localhost:27017/jloweai";

// Import MongoDB models
import AboutModel from "../models/About.js";
import ContactModel from "../models/Contact.js";
import ProjectModel from "../models/Project.js";
import ResourcesModel from "../models/Resources.js";
import WelcomeModel from "../models/Welcome.js";

async function connectMongoDB() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    return false;
  }
}

async function testPrismaConnection() {
  try {
    console.log("\nTesting Prisma connection...");

    // Check for DATABASE_URL or PRISMA_DATABASE_URL
    const dbUrl = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL;
    if (!dbUrl) {
      console.error("❌ DATABASE_URL or PRISMA_DATABASE_URL must be set");
      return false;
    }

    await prisma.$connect();

    // Try raw query (may not work with Prisma Accelerate)
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (queryError) {
      if (dbUrl.includes("accelerate.prisma-data.net")) {
        console.log(
          "⚠️  Raw queries not supported with Prisma Accelerate, but connection works",
        );
      } else {
        throw queryError;
      }
    }

    console.log("✅ Connected to PostgreSQL via Prisma");
    return true;
  } catch (error) {
    console.error("❌ Prisma connection error:", error);
    console.error(
      "Please ensure DATABASE_URL or PRISMA_DATABASE_URL is set correctly",
    );
    return false;
  }
}

async function migrateWelcome() {
  try {
    console.log("\n📦 Migrating Welcome data...");
    const welcomeData = await WelcomeModel.findOne({}).lean();

    if (!welcomeData) {
      console.log("⚠️  No Welcome data found in MongoDB");
      return;
    }

    // Delete existing data
    await prisma.welcome.deleteMany({});

    // Insert new data
    const { _id, __v, ...data } = welcomeData;
    await prisma.welcome.create({
      data: {
        name: data.name,
        briefBio: data.briefBio,
        callToAction: data.callToAction || null,
      },
    });

    console.log("✅ Welcome data migrated successfully");
  } catch (error) {
    console.error("❌ Error migrating Welcome data:", error);
    throw error;
  }
}

async function migrateAbout() {
  try {
    console.log("\n📦 Migrating About data...");
    const aboutData = await AboutModel.findOne({}).lean();

    if (!aboutData) {
      console.log("⚠️  No About data found in MongoDB");
      return;
    }

    // Delete existing data
    await prisma.about.deleteMany({});

    // Insert new data - MongoDB uses _id, we'll extract and convert to JSON
    const { _id, __v, ...data } = aboutData;

    // Convert MongoDB objects to plain JSON
    const aboutRecord = {
      professionalSummary: data.professionalSummary,
      technicalSkills: deepClone(data.technicalSkills || []),
      professionalExperience: deepClone(data.professionalExperience || []),
      education: deepClone(data.education || []),
      technicalCertifications: deepClone(data.technicalCertifications || []),
      leadershipExperience: deepClone(data.leadershipExperience || []),
      hobbies: deepClone(data.hobbies || []),
    };

    await prisma.about.create({
      data: aboutRecord,
    });

    console.log("✅ About data migrated successfully");
  } catch (error) {
    console.error("❌ Error migrating About data:", error);
    throw error;
  }
}

async function migrateContact() {
  try {
    console.log("\n📦 Migrating Contact data...");
    const contactData = await ContactModel.findOne({}).lean();

    if (!contactData) {
      console.log("⚠️  No Contact data found in MongoDB");
      return;
    }

    // Delete existing data
    await prisma.contact.deleteMany({});

    // Insert new data
    const { _id, __v, ...data } = contactData;

    const contactRecord = {
      name: data.name || null,
      emailAddress: data.emailAddress,
      phoneNumber: data.phoneNumber || null,
      socialMediaLinks: deepClone(data.socialMediaLinks),
      location: deepClone(data.location),
      availability: deepClone(data.availability),
      additionalContactMethods: deepClone(data.additionalContactMethods),
    };

    await prisma.contact.create({
      data: contactRecord,
    });

    console.log("✅ Contact data migrated successfully");
  } catch (error) {
    console.error("❌ Error migrating Contact data:", error);
    throw error;
  }
}

async function migrateProjects() {
  try {
    console.log("\n📦 Migrating Projects data...");
    const projects = await ProjectModel.find({}).lean();

    if (!projects || projects.length === 0) {
      console.log("⚠️  No Projects data found in MongoDB");
      return;
    }

    // Delete existing data (cascade will handle team members)
    await prisma.projectTeamMember.deleteMany({});
    await prisma.project.deleteMany({});

    for (const project of projects) {
      const { _id, __v, team, techStack, ...projectData } = project;

      // Map status from MongoDB format to Prisma enum
      const mappedStatus = mapProjectStatus(projectData.status);

      // Clean techStack to remove MongoDB _id fields
      const cleanedTechStack = techStack ? cleanMongoFields(techStack) : null;

      // Create project
      const createdProject = await prisma.project.create({
        data: {
          title: projectData.title,
          description: projectData.description || null,
          repositoryLink: projectData.repositoryLink || null,
          startDate: new Date(projectData.startDate),
          releaseDate: projectData.releaseDate
            ? new Date(projectData.releaseDate)
            : null,
          status: mappedStatus,
          techStack: cleanedTechStack,
          teamMembers: {
            create: (team || []).map((member) => ({
              name: member.name,
              email: member.email || null,
            })),
          },
        },
      });

      console.log(
        `  ✓ Migrated project: ${projectData.title}${mappedStatus ? ` (status: ${mappedStatus})` : ""}`,
      );
    }

    console.log(
      `✅ Projects data migrated successfully (${projects.length} projects)`,
    );
  } catch (error) {
    console.error("❌ Error migrating Projects data:", error);
    throw error;
  }
}

async function migrateResources() {
  try {
    console.log("\n📦 Migrating Resources data to Posts...");
    const resources = await ResourcesModel.find({}).lean();

    if (!resources || resources.length === 0) {
      console.log("⚠️  No Resources data found in MongoDB");
      return;
    }

    // Import reading time calculator
    const { calculateReadingTime } = await import(
      "../lib/utils/readingTime.js"
    );

    // Delete existing posts that might have been migrated before
    // (This is optional - you might want to skip this if you have existing posts)
    // await prisma.post.deleteMany({});

    for (const resource of resources) {
      const { _id, __v, ...resourceData } = resource;

      // Calculate reading time if content exists
      let readingTime = null;
      if (resourceData.content) {
        readingTime = calculateReadingTime(resourceData.content);
      }

      try {
        await prisma.post.create({
          data: {
            title: resourceData.title,
            description: resourceData.description,
            postType: resourceData.contentType, // "Article" or "Video"
            url: resourceData.url || null,
            content: resourceData.content || null,
            tags: resourceData.tags || [],
            topic: resourceData.topic.toLowerCase(),
            slug: resourceData.slug,
            author: resourceData.author,
            status: "Published", // Default to published for migrated content
            datePublished: resourceData.datePublished
              ? new Date(resourceData.datePublished)
              : new Date(),
            readingTime,
          },
        });

        console.log(`  ✓ Migrated resource to post: ${resourceData.title}`);
      } catch (createError) {
        // Skip duplicates (if slug already exists)
        if (createError.code === "P2002") {
          console.log(
            `  ⚠️  Skipped duplicate: ${resourceData.title} (slug already exists)`,
          );
        } else {
          console.error(
            `  ❌ Error migrating resource: ${resourceData.title}`,
            createError,
          );
        }
      }
    }

    console.log(
      `✅ Resources data migrated successfully (${resources.length} resources)`,
    );
  } catch (error) {
    console.error("❌ Error migrating Resources data:", error);
    throw error;
  }
}

async function migrate() {
  console.log("🚀 Starting data migration from MongoDB to PostgreSQL...\n");

  // Test connections first
  const mongoConnected = await connectMongoDB();
  if (!mongoConnected) {
    console.error("❌ Cannot proceed without MongoDB connection");
    process.exit(1);
  }

  const prismaConnected = await testPrismaConnection();
  if (!prismaConnected) {
    console.error("❌ Cannot proceed without Prisma/PostgreSQL connection");
    await mongoose.disconnect();
    process.exit(1);
  }

  try {
    // Run migrations in order
    await migrateWelcome();
    await migrateAbout();
    await migrateContact();
    await migrateProjects();
    await migrateResources();

    console.log("\n✅ All data migration completed successfully!");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  } finally {
    // Cleanup
    await mongoose.disconnect();
    await prisma.$disconnect();
    console.log("\n👋 Disconnected from databases");
  }
}

// Run migration
migrate();
