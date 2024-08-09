import db from "../../../lib/mongodb.js";
import Contact from "../../../models/Contact.js";

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
    const contacts = await Contact.findOne({}).exec();
    res.json(contacts);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const handlePostRequest = async (req, res) => {
  try {
    const {
      name,
      emailAddress,
      phoneNumber,
      socialMediaLinks,
      location,
      availability,
      additionalContactMethods,
    } = req.body;

    // Validate the data
    if (!name || !emailAddress || !location || !availability) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Delete all existing records
    await Contact.deleteMany({});

    // Create a new contact document
    const newContact = new Contact({
      name,
      emailAddress,
      phoneNumber,
      socialMediaLinks,
      location,
      availability,
      additionalContactMethods,
    });

    // Save the new contact document to the database
    const savedContact = await newContact.save();

    res.status(201).json(savedContact);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
