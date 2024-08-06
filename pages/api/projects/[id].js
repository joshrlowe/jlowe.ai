import db from "../../../lib/mongodb.js";
import Project from "../../../models/Project.js";
import mongoose from "mongoose";

export default async (req, res) => {
  try {
    const id = req.query.id;
    await db;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await Project.findById(id).exec();

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
