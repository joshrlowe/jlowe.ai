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
    const { topic, slug } = req.query;
    const resource = await Resources.findOne({ topic, slug }).exec();
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    res.json(resource);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
