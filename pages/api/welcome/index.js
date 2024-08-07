import db from "../../../lib/mongodb.js";
import Welcome from "../../../models/Welcome.js";

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
    const welcomeData = await Welcome.findOne({}).exec();
    res.json(welcomeData);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const handlePostRequest = async (req, res) => {
  try {
    const { name, briefBio, callToAction } = req.body;

    // Validate request body data
    if (!name || !briefBio || !callToAction) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Delete all existing records
    // There should only be one record in the welcome collection at all times
    await Welcome.deleteMany({});

    // Create a new welcome document to add to the collection
    const newWelcome = new Welcome({
      name,
      briefBio,
      callToAction,
    });

    // Save the new welcome document to the database
    const savedWelcome = await newWelcome.save();

    res.status(201).json(savedWelcome);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
