import db from "../../../lib/mongodb.js";
import About from "../../../models/About.js";

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
    const aboutData = await About.findOne({}).exec();
    res.json(aboutData);
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

    // Delete all existing records
    await About.deleteMany({});

    // Create a new about document
    const newAbout = new About({
      professionalSummary,
      technicalSkills,
      professionalExperience,
      leadershipExperience,
      education,
      technicalCertifications,
      hobbies,
    });

    // Save the new about document to the database
    const savedAbout = await newAbout.save();

    res.status(201).json(savedAbout);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
