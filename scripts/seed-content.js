import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding site content...\n");

  // Seed Welcome data
  const existingWelcome = await prisma.welcome.findFirst();
  if (!existingWelcome) {
    const welcome = await prisma.welcome.create({
      data: {
        name: "Josh Lowe",
        briefBio:
          "Full Stack Developer passionate about building modern web applications with cutting-edge technologies. I specialize in React, Next.js, Node.js, and cloud infrastructure.",
        callToAction: "Full Stack Developer",
      },
    });
    console.log("✅ Welcome data created:", welcome.name);
  } else {
    console.log("ℹ️  Welcome data already exists, skipping...");
  }

  // Seed Contact data
  const existingContact = await prisma.contact.findFirst();
  if (!existingContact) {
    const contact = await prisma.contact.create({
      data: {
        name: "Josh Lowe",
        emailAddress: "joshlowe.cs@gmail.com",
        phoneNumber: "+1 (267) 644-8659",
        socialMediaLinks: {
          github: "https://github.com/joshlowe",
          linkedIn: "https://linkedin.com/in/joshlowe",
          X: "https://x.com/joshlowe",
        },
        location: {
          city: "Hatfield",
          state: "PA",
          country: "US",
        },
        availability: {
          workingHours: "Monday - Friday, 9 AM - 5 PM EST",
          preferredContactTimes: "Business hours",
          additionalInstructions: "Best reached via phone or LinkedIn message.",
        },
        additionalContactMethods: [],
      },
    });
    console.log("✅ Contact data created:", contact.emailAddress);
  } else {
    console.log("ℹ️  Contact data already exists, skipping...");
  }

  // Seed About data
  const existingAbout = await prisma.about.findFirst();
  if (!existingAbout) {
    const about = await prisma.about.create({
      data: {
        professionalSummary: `
          <p>I'm a Full Stack Developer with a passion for building scalable, user-friendly web applications. 
          With expertise in modern JavaScript frameworks and cloud technologies, I deliver end-to-end solutions 
          that solve real business problems.</p>
          <p>My approach combines technical excellence with a deep understanding of user needs, resulting in 
          applications that are both powerful and intuitive.</p>
        `.trim(),
        technicalSkills: [
          {
            category: "Frontend",
            skillName: "React",
            expertiseLevel: "Expert",
            projects: [],
          },
          {
            category: "Frontend",
            skillName: "Next.js",
            expertiseLevel: "Expert",
            projects: [],
          },
          {
            category: "Frontend",
            skillName: "TypeScript",
            expertiseLevel: "Advanced",
            projects: [],
          },
          {
            category: "Backend",
            skillName: "Node.js",
            expertiseLevel: "Expert",
            projects: [],
          },
          {
            category: "Backend",
            skillName: "Python",
            expertiseLevel: "Advanced",
            projects: [],
          },
          {
            category: "Database",
            skillName: "PostgreSQL",
            expertiseLevel: "Advanced",
            projects: [],
          },
          {
            category: "Database",
            skillName: "MongoDB",
            expertiseLevel: "Intermediate",
            projects: [],
          },
          {
            category: "DevOps",
            skillName: "Docker",
            expertiseLevel: "Intermediate",
            projects: [],
          },
          {
            category: "DevOps",
            skillName: "AWS",
            expertiseLevel: "Intermediate",
            projects: [],
          },
        ],
        professionalExperience: [
          {
            company: "Tech Company",
            role: "Full Stack Developer",
            description:
              "Building and maintaining web applications using React, Node.js, and PostgreSQL.",
            startDate: "2022-01-01",
            endDate: null,
            achievements: [
              "Led development of customer-facing portal",
              "Improved application performance by 40%",
              "Mentored junior developers",
            ],
          },
        ],
        education: [
          {
            institution: "University",
            degree: "Bachelor of Science",
            fieldOfStudy: "Computer Science",
            relevantCoursework: [
              "Data Structures",
              "Algorithms",
              "Database Systems",
              "Web Development",
            ],
            startDate: "2018-09-01",
            endDate: "2022-05-01",
          },
        ],
        technicalCertifications: [
          {
            organization: "AWS",
            name: "AWS Certified Developer - Associate",
            issueDate: "2023-01-15",
            expirationDate: "2026-01-15",
            credentialUrl: "https://aws.amazon.com/certification/",
          },
        ],
        leadershipExperience: [],
        hobbies: [
          "Open Source Development",
          "Tech Blogging",
          "Hiking",
          "Photography",
        ],
      },
    });
    console.log("✅ About data created");
  } else {
    console.log("ℹ️  About data already exists, skipping...");
  }

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding content:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
