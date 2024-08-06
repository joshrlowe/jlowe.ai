const mongoose = require("mongoose");
const { Schema } = mongoose;
const techStackSchema = require("./TechStack");

const ProjectSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  team: [
    {
      name: { type: String, required: true },
      role: { type: String },
      email: { type: String },
    },
  ],
  techStack: {
    type: techStackSchema,
  },
  repositoryLink: {
    type: String,
  },
  startDate: {
    type: Date,
  },
  releaseDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: new Date(2000, 0, 1),
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

ProjectSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Project", ProjectSchema);
