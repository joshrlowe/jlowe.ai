/**
 * MongoDB to PostgreSQL Migration Script
 *
 * This script migrates data from MongoDB to PostgreSQL using Prisma.
 *
 * Usage:
 *   node scripts/migrate-mongodb-to-postgres.js
 *
 * Prerequisites:
 *   1. Set up PostgreSQL database and update DATABASE_URL in .env
 *   2. Run: npx prisma migrate dev --name init
 *   3. Ensure MongoDB connection is still available (MONGODB_URI in .env)
 */

import mongoose from 'mongoose';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Import MongoDB models
import Welcome from '../models/Welcome.js';
import About from '../models/About.js';
import Project from '../models/Project.js';
import Contact from '../models/Contact.js';
import Resources from '../models/Resources.js';

dotenv.config();

const prisma = new PrismaClient();

/**
 * Connect to MongoDB
 */
async function connectMongoDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jloweai';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');
}

/**
 * Migrate Welcome data (singleton)
 */
async function migrateWelcome() {
  console.log('\n📝 Migrating Welcome data...');

  const welcomeData = await Welcome.findOne();

  if (!welcomeData) {
    console.log('⚠️  No Welcome data found in MongoDB');
    return;
  }

  await prisma.welcome.upsert({
    where: { id: 'welcome-singleton' },
    update: {
      name: welcomeData.name,
      briefBio: welcomeData.briefBio,
      callToAction: welcomeData.callToAction || null,
    },
    create: {
      id: 'welcome-singleton',
      name: welcomeData.name,
      briefBio: welcomeData.briefBio,
      callToAction: welcomeData.callToAction || null,
    },
  });

  console.log('✅ Welcome data migrated');
}

/**
 * Migrate About data (singleton with normalized relations)
 */
async function migrateAbout() {
  console.log('\n📝 Migrating About data...');

  const aboutData = await About.findOne();

  if (!aboutData) {
    console.log('⚠️  No About data found in MongoDB');
    return;
  }

  // Create or update About record
  const about = await prisma.about.upsert({
    where: { id: 'about-singleton' },
    update: {
      professionalSummary: aboutData.professionalSummary,
      hobbies: aboutData.hobbies || [],
    },
    create: {
      id: 'about-singleton',
      professionalSummary: aboutData.professionalSummary,
      hobbies: aboutData.hobbies || [],
    },
  });

  // Clear existing relations
  await prisma.technicalSkill.deleteMany({ where: { aboutId: about.id } });
  await prisma.professionalExperience.deleteMany({ where: { aboutId: about.id } });
  await prisma.education.deleteMany({ where: { aboutId: about.id } });
  await prisma.certification.deleteMany({ where: { aboutId: about.id } });
  await prisma.leadershipExperience.deleteMany({ where: { aboutId: about.id } });

  // Migrate Technical Skills
  if (aboutData.technicalSkills && aboutData.technicalSkills.length > 0) {
    for (const skill of aboutData.technicalSkills) {
      const createdSkill = await prisma.technicalSkill.create({
        data: {
          aboutId: about.id,
          category: skill.category || null,
          skillName: skill.skillName,
          expertiseLevel: skill.expertiseLevel,
        },
      });

      // Migrate skill projects
      if (skill.projects && skill.projects.length > 0) {
        await prisma.skillProject.createMany({
          data: skill.projects.map((proj) => ({
            skillId: createdSkill.id,
            name: proj.name,
            repositoryLink: proj.repositoryLink,
          })),
        });
      }
    }
    console.log(`✅ Migrated ${aboutData.technicalSkills.length} technical skills`);
  }

  // Migrate Professional Experience
  if (aboutData.professionalExperience && aboutData.professionalExperience.length > 0) {
    await prisma.professionalExperience.createMany({
      data: aboutData.professionalExperience.map((exp) => ({
        aboutId: about.id,
        company: exp.company,
        role: exp.role,
        description: exp.description || null,
        achievements: exp.achievements || [],
        startDate: exp.startDate,
        endDate: exp.endDate || null,
      })),
    });
    console.log(`✅ Migrated ${aboutData.professionalExperience.length} professional experiences`);
  }

  // Migrate Education
  if (aboutData.education && aboutData.education.length > 0) {
    await prisma.education.createMany({
      data: aboutData.education.map((edu) => ({
        aboutId: about.id,
        institution: edu.institution,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        relevantCoursework: edu.relevantCoursework || [],
        startDate: edu.startDate,
        endDate: edu.endDate || null,
      })),
    });
    console.log(`✅ Migrated ${aboutData.education.length} education records`);
  }

  // Migrate Certifications
  if (aboutData.technicalCertifications && aboutData.technicalCertifications.length > 0) {
    await prisma.certification.createMany({
      data: aboutData.technicalCertifications.map((cert) => ({
        aboutId: about.id,
        organization: cert.organization,
        name: cert.name,
        issueDate: cert.issueDate,
        expirationDate: cert.expirationDate || null,
        credentialUrl: cert.credentialUrl || null,
      })),
    });
    console.log(`✅ Migrated ${aboutData.technicalCertifications.length} certifications`);
  }

  // Migrate Leadership Experience
  if (aboutData.leadershipExperience && aboutData.leadershipExperience.length > 0) {
    await prisma.leadershipExperience.createMany({
      data: aboutData.leadershipExperience.map((lead) => ({
        aboutId: about.id,
        organization: lead.organization,
        role: lead.role,
        achievements: lead.achievements || [],
        startDate: lead.startDate,
        endDate: lead.endDate || null,
      })),
    });
    console.log(`✅ Migrated ${aboutData.leadershipExperience.length} leadership experiences`);
  }

  console.log('✅ About data and all relations migrated');
}

/**
 * Migrate Projects
 */
async function migrateProjects() {
  console.log('\n📝 Migrating Projects...');

  const projects = await Project.find();

  if (projects.length === 0) {
    console.log('⚠️  No Projects found in MongoDB');
    return;
  }

  for (const proj of projects) {
    // Map status to enum value
    const statusMap = {
      'Planned': 'PLANNED',
      'In Progress': 'IN_PROGRESS',
      'In Development': 'IN_DEVELOPMENT',
      'In Testing': 'IN_TESTING',
      'Completed': 'COMPLETED',
      'In Production': 'IN_PRODUCTION',
      'Maintenance': 'MAINTENANCE',
      'On Hold': 'ON_HOLD',
      'Deprecated': 'DEPRECATED',
      'Sunsetted': 'SUNSETTED',
    };

    const status = statusMap[proj.status] || 'PLANNED';

    // Create project
    const createdProject = await prisma.project.create({
      data: {
        title: proj.title,
        description: proj.description || null,
        repositoryLink: proj.repositoryLink || null,
        status: status,
        startDate: proj.startDate,
        releaseDate: proj.releaseDate || null,
      },
    });

    // Migrate team members
    if (proj.team && proj.team.length > 0) {
      await prisma.teamMember.createMany({
        data: proj.team.map((member) => ({
          projectId: createdProject.id,
          name: member.name,
          email: member.email || null,
        })),
      });
    }

    // Migrate tech stack
    if (proj.techStack) {
      await prisma.techStack.create({
        data: {
          projectId: createdProject.id,
          fullStackFramework: proj.techStack.fullStackFramework || null,
          backendFramework: proj.techStack.backendFramework || null,
          frontendFramework: proj.techStack.frontendFramework || null,
          database: proj.techStack.database || null,
          languages: proj.techStack.languages || [],
          versionControl: proj.techStack.versionControl || null,
          operatingSystem: proj.techStack.operatingSystem || null,
          webServers: proj.techStack.webServers || [],
          apiIntegrations: proj.techStack.apiIntegrations || null,
          deploymentTools: proj.techStack.deploymentTools || null,
          additionalTools: proj.techStack.additionalTools || null,
        },
      });
    }
  }

  console.log(`✅ Migrated ${projects.length} projects`);
}

/**
 * Migrate Contact data (singleton)
 */
async function migrateContact() {
  console.log('\n📝 Migrating Contact data...');

  const contactData = await Contact.findOne();

  if (!contactData) {
    console.log('⚠️  No Contact data found in MongoDB');
    return;
  }

  await prisma.contact.upsert({
    where: { id: 'contact-singleton' },
    update: {
      name: contactData.name || null,
      email: contactData.emailAddress,
      phoneNumber: contactData.phoneNumber || null,
      socialMedia: contactData.socialMediaLinks || null,
      city: contactData.location?.city || null,
      state: contactData.location?.state || null,
      country: contactData.location?.country || null,
      workingHours: contactData.availability?.workingHours || null,
      preferredContactTimes: contactData.availability?.preferredContactTimes || null,
      availabilityNotes: contactData.availability?.additionalInstructions || null,
      additionalMethods: contactData.additionalContactMethods || null,
    },
    create: {
      id: 'contact-singleton',
      name: contactData.name || null,
      email: contactData.emailAddress,
      phoneNumber: contactData.phoneNumber || null,
      socialMedia: contactData.socialMediaLinks || null,
      city: contactData.location?.city || null,
      state: contactData.location?.state || null,
      country: contactData.location?.country || null,
      workingHours: contactData.availability?.workingHours || null,
      preferredContactTimes: contactData.availability?.preferredContactTimes || null,
      availabilityNotes: contactData.availability?.additionalInstructions || null,
      additionalMethods: contactData.additionalContactMethods || null,
    },
  });

  console.log('✅ Contact data migrated');
}

/**
 * Migrate Resources to BlogPosts (requires admin user)
 */
async function migrateResources() {
  console.log('\n📝 Migrating Resources to Blog Posts...');

  const resources = await Resources.find();

  if (resources.length === 0) {
    console.log('⚠️  No Resources found in MongoDB');
    return;
  }

  // Get or create an admin user for blog posts
  let adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!adminUser) {
    console.log('⚠️  No admin user found. Creating a default admin user...');
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@jlowe.ai',
        name: 'Josh Lowe',
        password: 'CHANGE_THIS_PASSWORD', // User should change this immediately
        role: 'ADMIN',
        emailVerified: new Date(),
      },
    });
    console.log('✅ Created default admin user (email: admin@jlowe.ai)');
    console.log('⚠️  IMPORTANT: Change the admin password immediately!');
  }

  for (const resource of resources) {
    // Create or get tags
    const tagRecords = [];
    if (resource.tags && resource.tags.length > 0) {
      for (const tagName of resource.tags) {
        const tag = await prisma.tag.upsert({
          where: { slug: tagName.toLowerCase().replace(/\s+/g, '-') },
          update: {},
          create: {
            name: tagName,
            slug: tagName.toLowerCase().replace(/\s+/g, '-'),
          },
        });
        tagRecords.push(tag);
      }
    }

    // Map content type
    const contentType = resource.contentType === 'Video' ? 'VIDEO' : 'ARTICLE';

    // Create blog post
    await prisma.blogPost.create({
      data: {
        title: resource.title,
        slug: resource.slug,
        description: resource.description,
        content: resource.content || null,
        contentType: contentType,
        url: resource.url || null,
        authorId: adminUser.id,
        topic: resource.topic,
        status: 'PUBLISHED',
        publishedAt: resource.datePublished,
        tags: {
          connect: tagRecords.map((tag) => ({ id: tag.id })),
        },
      },
    });
  }

  console.log(`✅ Migrated ${resources.length} resources to blog posts`);
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting MongoDB to PostgreSQL migration...\n');

  try {
    await connectMongoDB();

    await migrateWelcome();
    await migrateAbout();
    await migrateProjects();
    await migrateContact();
    await migrateResources();

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Verify the migrated data in PostgreSQL');
    console.log('   2. Update API routes to use Prisma instead of Mongoose');
    console.log('   3. Test all pages to ensure data loads correctly');
    console.log('   4. If admin user was created, change the default password');
    console.log('   5. Once verified, you can remove the MongoDB models and connection');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    await prisma.$disconnect();
    console.log('\n🔌 Disconnected from databases');
  }
}

// Run migration
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
