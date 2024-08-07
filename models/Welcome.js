import mongoose from "mongoose";
const Schema = mongoose.Schema;

const WelcomeSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  briefBio: {
    type: String,
    required: true,
  },
  callToAction: {
    type: String,
  },
});

const Welcome =
  mongoose.models.Welcome || mongoose.model("Welcome", WelcomeSchema);

export default Welcome;
