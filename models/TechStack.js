import mongoose from "mongoose";
const { Schema } = mongoose;

const techStackSchema = new Schema({
  fullStackFramework: {
    type: String,
    enum: ["Next.js"],
  },
  backendFramework: {
    type: String,
    enum: [
      "Flask",
      "Django",
      "Express.js",
      "Spring",
      "Rails",
      "Laravel",
      "ASP.NET",
      "Other",
    ],
  },
  frontendFramework: {
    type: String,
    enum: [
      "React.js",
      "Angular.js",
      "Vue.js",
      "Svelte",
      "Ember",
      "Backbone",
      "Other",
    ],
  },
  database: {
    type: String,
    enum: [
      "SQLite",
      "PostgreSQL",
      "MySQL",
      "MongoDB",
      "Oracle",
      "SQL Server",
      "Other",
    ],
  },
  languages: [String],
  versionControl: {
    type: String,
    enum: ["Git", "SVN", "Mercurial", "Other"],
  },
  apiIntegrations: [
    {
      name: { type: String },
      url: { type: String },
    },
  ],
  operatingSystem: {
    type: String,
    enum: ["Ubuntu", "CentOS", "Debian", "Windows", "macOS", "Linux", "Other"],
  },
  webServers: [String],
  deploymentTools: [
    {
      name: { type: String },
      description: { type: String },
    },
  ],
  additionalTools: [
    {
      name: { type: String },
      description: { type: String },
    },
  ],
});

techStackSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default techStackSchema;
