import mongoose from "mongoose";
const Schema = mongoose.Schema;

const ContactSchema = new Schema({
  name: {
    type: String,
  },
  emailAddress: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
  },
  socialMediaLinks: {
    linkedIn: String,
    github: String,
    other: [String],
  },
  location: {
    city: String,
    region: String,
    mapEmbedLink: String, // URL to an embedded Google Map
  },
  availability: {
    workingHours: String,
    preferredContactTimes: String,
    additionalInstructions: String,
  },
  additionalContactMethods: [
    {
      method: String,
      handle: String,
    },
  ],
  callToAction: {
    type: String,
    required: true,
  },
  professionalPhoto: {
    type: String, // URL to the photo
  },
});

const Contact =
  mongoose.models.Contact ||
  mongoose.model("Contact", ContactSchema, "contact");

export default Contact;
