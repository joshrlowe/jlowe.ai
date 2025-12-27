/**
 * Script to migrate existing resources from PostgreSQL to Posts
 * This is for cases where resources were already migrated to PostgreSQL
 * but need to be converted to the new Post model structure
 */

import { PrismaClient } from "@prisma/client";
import { calculateReadingTime } from "../lib/utils/readingTime.js";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function migrateResourcesToPosts() {
  try {
    console.log("\n📦 Migrating Resources from PostgreSQL to Posts...");

    // Check if resources table exists by trying to query it
    let resources = [];
    try {
      // Try to query resources using raw SQL
      resources = await prisma.$queryRaw`
        SELECT * FROM resources
      `;
    } catch (error) {
      if (error.code === "P2021" || error.message?.includes("does not exist")) {
        console.log("⚠️  Resources table does not exist - nothing to migrate");
        return;
      }
      throw error;
    }

    if (!resources || resources.length === 0) {
      console.log("⚠️  No resources found in PostgreSQL");
      return;
    }

    console.log(`Found ${resources.length} resources to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const resource of resources) {
      try {
        // Calculate reading time if content exists
        let readingTime = null;
        if (resource.content) {
          readingTime = calculateReadingTime(resource.content);
        }

        // Map contentType to postType
        const postType =
          resource.contentType === "Article" || resource.contentType === "Video"
            ? resource.contentType
            : "Article"; // Default to Article

        await prisma.post.create({
          data: {
            title: resource.title,
            description: resource.description,
            postType,
            url: resource.url || null,
            content: resource.content || null,
            tags: resource.tags || [],
            topic: (resource.topic || "general").toLowerCase(),
            slug: resource.slug,
            author: resource.author || "Josh Lowe",
            status: "Published", // Default to published for migrated content
            datePublished: resource.datePublished
              ? new Date(resource.datePublished)
              : new Date(),
            readingTime,
          },
        });

        console.log(`  ✓ Migrated: ${resource.title}`);
        migrated++;
      } catch (createError) {
        // Skip duplicates (if slug already exists)
        if (createError.code === "P2002") {
          console.log(
            `  ⚠️  Skipped duplicate: ${resource.title} (slug already exists)`,
          );
          skipped++;
        } else {
          console.error(
            `  ❌ Error migrating: ${resource.title}`,
            createError.message,
          );
          errors++;
        }
      }
    }

    console.log(`\n✅ Migration complete:`);
    console.log(`   - Migrated: ${migrated}`);
    console.log(`   - Skipped (duplicates): ${skipped}`);
    console.log(`   - Errors: ${errors}`);
  } catch (error) {
    console.error("❌ Error during migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateResourcesToPosts()
  .then(() => {
    console.log("\n✅ Migration script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration script failed:", error);
    process.exit(1);
  });
