import mongoose from "mongoose";
const Schema = mongoose.Schema;

const AboutSchema = new Schema({
  professionalSummary: {
    type: String,
    required: true,
  },
  technicalSkills: [
    {
      category: String,
      skillName: {
        type: String,
        required: true,
      },
      expertiseLevel: {
        type: Number,
        required: true,
      },
      projects: [
        {
          name: {
            type: String,
            required: true,
          },
          repositoryLink: {
            type: String,
            required: true,
          },
        },
      ],
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
    },
  ],
  education: [
    {
      institution: String,
      degree: String,
      fieldOfStudy: String,
      relevantCoursework: [String],
      startDate: Date,
      endDate: Date,
    },
  ],
  technicalCertifications: [
    {
      organization: String,
      name: String,
      issueDate: Date,
      expirationDate: Date,
      credentialUrl: String,
    },
  ],
  leadershipExperience: [
    {
      organization: String,
      role: String,
      startDate: Date,
      endDate: Date,
      achievements: [String],
    },
  ],
  hobbies: [String],
});

const About =
  mongoose.models.About || mongoose.model("About", AboutSchema, "about");

export default About;
