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
    const projects = await prisma.project.findMany({
      include: {
        team: true,
        techStack: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });
    res.json(projects);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const handlePostRequest = async (req, res) => {
  try {
    const {
      title,
      team,
      description,
      techStack,
      repositoryLink,
      startDate,
      releaseDate,
      status,
    } = req.body;

    // Validate the data
    if (!title || !Array.isArray(team) || !startDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Map status to enum value if needed
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
    const mappedStatus = statusMap[status] || status || 'PLANNED';

    // Create a new project with relations
    const savedProject = await prisma.project.create({
      data: {
        title,
        description,
        repositoryLink,
        status: mappedStatus,
        startDate: new Date(startDate),
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        team: {
          create: team.map((member) => ({
            name: member.name,
            email: member.email || null,
          })),
        },
        techStack: techStack
          ? {
              create: {
                fullStackFramework: techStack.fullStackFramework || null,
                backendFramework: techStack.backendFramework || null,
                frontendFramework: techStack.frontendFramework || null,
                database: techStack.database || null,
                languages: techStack.languages || [],
                versionControl: techStack.versionControl || null,
                operatingSystem: techStack.operatingSystem || null,
                webServers: techStack.webServers || [],
                apiIntegrations: techStack.apiIntegrations || null,
                deploymentTools: techStack.deploymentTools || null,
                additionalTools: techStack.additionalTools || null,
              },
            }
          : undefined,
      },
      include: {
        team: true,
        techStack: true,
      },
    });

    res.status(201).json(savedProject);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
