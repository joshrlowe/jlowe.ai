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
    const welcomeData = await prisma.welcome.findFirst();
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
    if (!name || !briefBio) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Delete all existing records
    // There should only be one record in the welcome collection at all times
    await prisma.welcome.deleteMany();

    // Create a new welcome document
    const savedWelcome = await prisma.welcome.create({
      data: {
        name,
        briefBio,
        callToAction: callToAction || null,
      },
    });

    res.status(201).json(savedWelcome);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
