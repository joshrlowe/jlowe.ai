/**
 * Test script to verify Prisma connection and data
 */

import prisma from './lib/prisma.js';

async function testPrisma() {
  try {
    console.log('🔍 Testing Prisma connection...\n');

    // Test Welcome data
    console.log('📝 Testing Welcome data...');
    const welcome = await prisma.welcome.findFirst();
    console.log('Welcome data:', welcome ? '✅ Found' : '❌ Not found');
    if (welcome) {
      console.log('  - Name:', welcome.name);
      console.log('  - Brief Bio:', welcome.briefBio?.substring(0, 50) + '...');
    }
    console.log();

    // Test Contact data
    console.log('📞 Testing Contact data...');
    const contact = await prisma.contact.findFirst();
    console.log('Contact data:', contact ? '✅ Found' : '❌ Not found');
    if (contact) {
      console.log('  - Email:', contact.email);
      console.log('  - Social Media:', contact.socialMedia);
    }
    console.log();

    // Test About data
    console.log('👤 Testing About data...');
    const about = await prisma.about.findFirst({
      include: {
        technicalSkills: true,
        experiences: true,
        education: true,
        certifications: true,
        leadership: true,
      },
    });
    console.log('About data:', about ? '✅ Found' : '❌ Not found');
    if (about) {
      console.log('  - Professional Summary:', about.professionalSummary?.substring(0, 50) + '...');
      console.log('  - Technical Skills:', about.technicalSkills?.length || 0);
      console.log('  - Experiences:', about.experiences?.length || 0);
    }
    console.log();

    // Test Projects data
    console.log('💼 Testing Projects data...');
    const projects = await prisma.project.findMany({
      include: {
        team: true,
        techStack: true,
      },
    });
    console.log('Projects:', projects.length, 'found');
    if (projects.length > 0) {
      console.log('  - First project:', projects[0].title);
    }
    console.log();

    console.log('✅ All tests completed!');
  } catch (error) {
    console.error('❌ Error testing Prisma:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrisma();
