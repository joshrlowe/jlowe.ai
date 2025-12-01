import prisma from "../../../lib/prisma.js";

export default async (req, res) => {
  switch (req.method) {
    case "GET":
      await handleGetRequest(req, res);
      break;
    case "POST":
      await handlePostRequest(req, res);
      break;
    default:
      res.status(405).json({ message: "Method Not Allowed" });
      break;
  }
};

const handleGetRequest = async (req, res) => {
  try {
    const aboutData = await prisma.about.findFirst({
      include: {
        technicalSkills: {
          include: {
            projects: true,
          },
        },
        experiences: true,
        education: true,
        certifications: true,
        leadership: true,
      },
    });

    // Transform the data to match the old MongoDB structure for compatibility
    if (aboutData) {
      const transformed = {
        ...aboutData,
        professionalExperience: aboutData.experiences,
        technicalCertifications: aboutData.certifications,
        leadershipExperience: aboutData.leadership,
      };
      delete transformed.experiences;
      delete transformed.certifications;
      delete transformed.leadership;
      res.json(transformed);
    } else {
      res.json(null);
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const handlePostRequest = async (req, res) => {
  try {
    const {
      professionalSummary,
      technicalSkills,
      professionalExperience,
      leadershipExperience,
      education,
      technicalCertifications,
      hobbies,
    } = req.body;

    // Validate the data
    if (
      !professionalSummary ||
      !Array.isArray(technicalSkills) ||
      !Array.isArray(professionalExperience) ||
      !Array.isArray(leadershipExperience) ||
      !Array.isArray(education) ||
      !Array.isArray(technicalCertifications) ||
      !Array.isArray(hobbies)
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Delete all existing records and their relations
    await prisma.about.deleteMany();

    // Create a new about document with all relations
    const savedAbout = await prisma.about.create({
      data: {
        professionalSummary,
        hobbies,
        technicalSkills: {
          create: technicalSkills.map((skill) => ({
            category: skill.category,
            skillName: skill.skillName,
            expertiseLevel: skill.expertiseLevel,
            projects: {
              create: skill.projects || [],
            },
          })),
        },
        experiences: {
          create: professionalExperience.map((exp) => ({
            company: exp.company,
            role: exp.role,
            description: exp.description,
            achievements: exp.achievements || [],
            startDate: new Date(exp.startDate),
            endDate: exp.endDate ? new Date(exp.endDate) : null,
          })),
        },
        education: {
          create: education.map((edu) => ({
            institution: edu.institution,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy,
            relevantCoursework: edu.relevantCoursework || [],
            startDate: new Date(edu.startDate),
            endDate: edu.endDate ? new Date(edu.endDate) : null,
          })),
        },
        certifications: {
          create: technicalCertifications.map((cert) => ({
            organization: cert.organization,
            name: cert.name,
            issueDate: new Date(cert.issueDate),
            expirationDate: cert.expirationDate
              ? new Date(cert.expirationDate)
              : null,
            credentialUrl: cert.credentialUrl,
          })),
        },
        leadership: {
          create: leadershipExperience.map((lead) => ({
            organization: lead.organization,
            role: lead.role,
            achievements: lead.achievements || [],
            startDate: new Date(lead.startDate),
            endDate: lead.endDate ? new Date(lead.endDate) : null,
          })),
        },
      },
      include: {
        technicalSkills: {
          include: {
            projects: true,
          },
        },
        experiences: true,
        education: true,
        certifications: true,
        leadership: true,
      },
    });

    res.status(201).json(savedAbout);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
