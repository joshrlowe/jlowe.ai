import db from "../../../lib/mongodb.js";
import Resources from "../../../models/Resources.js";

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
    const topics = await Resources.distinct("topic").exec();
    res.json(topics);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const handlePostRequest = async (req, res) => {
  try {
    const {
      title,
      description,
      contentType,
      url,
      content,
      tags,
      datePublished,
      author,
      topic,
      slug,
    } = req.body;

    // Validate the data
    if (
      !title ||
      !description ||
      !contentType ||
      !author ||
      !topic ||
      !slug ||
      (contentType === "Article" && !content) ||
      (contentType === "Video" && !url)
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create a new resource
    const newResource = new Resources({
      title,
      description,
      contentType,
      url,
      content,
      tags,
      datePublished,
      author,
      topic: topic.toLowerCase(),
      slug,
    });

    // Save the resource to the database
    const savedResource = await newResource.save();

    res.status(201).json(savedResource);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
