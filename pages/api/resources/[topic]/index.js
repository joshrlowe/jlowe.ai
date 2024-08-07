import db from "../../../../lib/mongodb.js";
import Resources from "../../../../models/Resources.js";

export default async (req, res) => {
  await db;

  switch (req.method) {
    case "GET":
      await handleGetRequest(req, res);
      break;
    default:
      res.status(405).json({ message: "Method Not Allowed" });
      break;
  }
};

const handleGetRequest = async (req, res) => {
  try {
    const { topic } = req.query;
    const resources = await Resources.find({ topic: topic }).exec();
    res.json(resources);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
