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
      email: { type: String, match: /.+\@.+\..+/ },
    },
  ],
  description: String,
  techStack: techStackSchema,
  repositoryLink: String,
  startDate: {
    type: Date,
    required: true,
  },
  releaseDate: Date,
  status: {
    type: String,
    enum: [
      "Planned",
      "In Progress",
      "In Development",
      "In Testing",
      "Completed",
      "In Production",
      "Maintenance",
      "On Hold",
      "Deprecated",
      "Sunsetted",
    ],
  },
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
