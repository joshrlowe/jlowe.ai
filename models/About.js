import mongoose from "mongoose";
const Schema = mongoose.Schema;

const AboutSchema = new Schema({
  professionalSummary: {
    type: String,
    required: true,
  },
  technicalSkills: [
    {
      type: String,
      required: true,
    },
  ],
  professionalExperience: [
    {
      company: String,
      role: String,
      description: String,
      startDate: Date,
      endDate: Date,
      achievements: [String],
      projectLinks: [String],
    },
  ],
  education: [
    {
      institution: String,
      degree: String,
      fieldOfStudy: String,
      startDate: Date,
      endDate: Date,
    },
  ],
  certifications: [
    {
      name: String,
      issuingOrganization: String,
      issueDate: Date,
      expirationDate: Date,
      credentialId: String,
      credentialUrl: String,
    },
  ],
  personalProjects: [
    {
      name: String,
      description: String,
      link: String,
      githubRepo: String,
    },
  ],
  contactInformation: {
    email: {
      type: String,
      required: true,
    },
    socialLinks: {
      linkedIn: String,
      github: String,
      twitter: String,
      other: [String],
    },
  },
  personalTouch: {
    interests: [String],
    volunteerWork: [
      {
        organization: String,
        role: String,
        description: String,
        startDate: Date,
        endDate: Date,
      },
    ],
  },
  professionalPhoto: {
    type: String,
    required: true,
  },
});

const About =
  mongoose.models.About || mongoose.model("About", AboutSchema, "about");

export default About;
