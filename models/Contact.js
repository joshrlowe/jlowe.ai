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
    X: String,
    github: String,
    other: [String],
  },
  location: {
    city: String,
    state: String,
    country: String,
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
});

const Contact =
  mongoose.models.Contact ||
  mongoose.model("Contact", ContactSchema, "contact");

export default Contact;
