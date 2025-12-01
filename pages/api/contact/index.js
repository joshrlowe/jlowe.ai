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
    const contactData = await prisma.contact.findFirst();

    // Transform data to match old MongoDB structure for compatibility
    if (contactData) {
      const transformed = {
        ...contactData,
        emailAddress: contactData.email,
        socialMediaLinks: contactData.socialMedia,
        location: {
          city: contactData.city,
          state: contactData.state,
          country: contactData.country,
        },
        availability: {
          workingHours: contactData.workingHours,
          preferredContactTimes: contactData.preferredContactTimes,
          additionalInstructions: contactData.availabilityNotes,
        },
        additionalContactMethods: contactData.additionalMethods,
      };

      // Remove the new field names
      delete transformed.email;
      delete transformed.socialMedia;
      delete transformed.city;
      delete transformed.state;
      delete transformed.country;
      delete transformed.workingHours;
      delete transformed.preferredContactTimes;
      delete transformed.availabilityNotes;
      delete transformed.additionalMethods;

      res.json(transformed);
    } else {
      res.json(null);
    }
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
    if (!emailAddress) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Delete all existing records
    await prisma.contact.deleteMany();

    // Create a new contact document
    const savedContact = await prisma.contact.create({
      data: {
        name: name || null,
        email: emailAddress,
        phoneNumber: phoneNumber || null,
        socialMedia: socialMediaLinks || null,
        city: location?.city || null,
        state: location?.state || null,
        country: location?.country || null,
        workingHours: availability?.workingHours || null,
        preferredContactTimes: availability?.preferredContactTimes || null,
        availabilityNotes: availability?.additionalInstructions || null,
        additionalMethods: additionalContactMethods || null,
      },
    });

    res.status(201).json(savedContact);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
