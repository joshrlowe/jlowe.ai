import mongoose from "mongoose";
const Schema = mongoose.Schema;
import techStackSchema from "./TechStack.js";

const ProjectSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  team: [
    {
      name: { type: String, required: true },
      role: { type: String },
      email: { type: String, required: true, match: /.+\@.+\..+/ },
    },
  ],
  techStack: techStackSchema,
  repositoryLink: String,
  startDate: {
    type: Date,
    required: true,
  },
  releaseDate: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update the `updatedAt` field
ProjectSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Check if the model already exists before defining it
const Project =
  mongoose.models.Project ||
  mongoose.model("Project", ProjectSchema, "projects");

export default Project;
