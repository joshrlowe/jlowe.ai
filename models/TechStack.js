const mongoose = require("mongoose");
const { Schema } = mongoose;

const techStackSchema = new Schema({
  backendFramework: {
    type: String,
    enum: [
      "Flask",
      "Django",
      "Express",
      "Spring",
      "Rails",
      "Laravel",
      "ASP.NET",
      "Other",
    ],
  },
  frontendFramework: {
    type: String,
    enum: ["React", "Angular", "Vue", "Svelte", "Ember", "Backbone", "Other"],
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
    enum: ["Ubuntu", "CentOS", "Debian", "Windows", "macOS", "Other"],
  },
  webServer: {
    type: String,
    enum: ["NGINX", "Apache", "IIS", "Caddy", "Other"],
  },
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

techStackSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = techStackSchema;
