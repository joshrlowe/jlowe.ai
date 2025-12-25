import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("Testing Prisma connection...");

    // Check for DATABASE_URL or PRISMA_DATABASE_URL
    const dbUrl = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL;
    if (!dbUrl) {
      console.error(
        "❌ DATABASE_URL or PRISMA_DATABASE_URL must be set in environment variables",
      );
      process.exit(1);
    }

    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "NOT SET");
    console.log(
      "PRISMA_DATABASE_URL:",
      process.env.PRISMA_DATABASE_URL ? "Set" : "NOT SET",
    );
    console.log(
      "Using:",
      dbUrl === process.env.DATABASE_URL
        ? "DATABASE_URL"
        : "PRISMA_DATABASE_URL",
    );

    // Test the connection
    await prisma.$connect();
    console.log("✅ Successfully connected to database!");

    // Test a simple query (note: Prisma Accelerate URLs may not support raw queries)
    try {
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      console.log("✅ Database query test successful:", result);
    } catch (queryError) {
      // Prisma Accelerate URLs might not support raw queries, that's okay
      if (dbUrl.includes("accelerate.prisma-data.net")) {
        console.log(
          "⚠️  Raw queries not supported with Prisma Accelerate, but connection works",
        );
      } else {
        throw queryError;
      }
    }

    console.log("\n✅ Connection test passed! Prisma is ready to use.");
  } catch (error) {
    console.error("❌ Connection test failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
