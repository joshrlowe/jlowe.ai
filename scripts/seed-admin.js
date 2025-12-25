import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "❌ ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required"
    );
    process.exit(1);
  }

  // Check if admin user already exists
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log("✅ Admin user already exists with email:", email);
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create admin user
  const admin = await prisma.adminUser.create({
    data: {
      email,
      passwordHash,
      role: "admin",
    },
  });

  console.log("✅ Admin user created successfully!");
  console.log("   Email:", admin.email);
  console.log("   ID:", admin.id);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding admin user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

