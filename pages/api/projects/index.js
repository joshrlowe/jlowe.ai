import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db("jloweai");

    const collection = db.collection("projects");
    const data = await collection.find({}).toArray();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
}
