import db from "../../../lib/mongodb.js";
import Project from "../../../models/Project.js";

export default async (req, res) => {
  await db;

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
    const projects = await Project.find({}).sort({ startDate: -1 }).exec();
    res.json(projects);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const handlePostRequest = async (req, res) => {
  try {
    const { title, team, techStack, repositoryLink, startDate, releaseDate } =
      req.body;

    // Validate the data
    if (!title || !Array.isArray(team) || !repositoryLink || !startDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create a new project
    const newProject = new Project({
      title,
      team,
      techStack,
      repositoryLink,
      startDate: new Date(startDate),
      releaseDate: releaseDate ? new Date(releaseDate) : null,
    });

    // Save the project to the database
    const savedProject = await newProject.save();

    res.status(201).json(savedProject);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
