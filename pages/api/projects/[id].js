import clientPromise from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db("jloweai");

    const { id } = req.query;

    if (!ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }

    const collection = db.collection("projects");
    const data = await collection.findOne({ _id: new ObjectId(id) });

    if (!data) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
}
