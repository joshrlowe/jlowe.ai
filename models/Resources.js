import mongoose from "mongoose";
const Schema = mongoose.Schema;

const ResourcesSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  contentType: {
    type: String,
    enum: ["Article", "Video"],
    required: true,
  },
  url: {
    type: String,
  },
  content: {
    type: String, // This will store the markdown content of the articles directly
  },
  tags: [String],
  datePublished: {
    type: Date,
    default: Date.now,
  },
  author: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
});

const Resources =
  mongoose.models.Resources || mongoose.model("Resources", ResourcesSchema);

export default Resources;
