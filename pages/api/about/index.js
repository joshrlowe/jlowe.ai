import prisma from "../../../lib/prisma.js";
import {
  createApiHandler,
  createGetLatestHandler,
  createUpsertHandler,
} from "../../../lib/utils/apiRouteHandler.js";
import {
  validateRequiredFields,
  validateArrayFields,
  combineValidations,
} from "../../../lib/utils/validators.js";

// Refactored: Extract Method - Common GET pattern extracted to reusable handler
const handleGetRequest = createGetLatestHandler(
  () =>
    prisma.about.findFirst({
      orderBy: { createdAt: "desc" },
    }),
  "About data not found",
);

// Refactored: Extract Method - Validation logic extracted to function
function validateAboutData(body) {
  const requiredFieldsValidation = validateRequiredFields(body, [
    "professionalSummary",
  ]);
  const arrayFieldsValidation = validateArrayFields(body, [
    "technicalSkills",
    "professionalExperience",
    "leadershipExperience",
    "education",
    "technicalCertifications",
    "hobbies",
  ]);

  return combineValidations(requiredFieldsValidation, arrayFieldsValidation);
}

// Refactored: Extract Method - Common POST pattern extracted to reusable handler
const handlePostRequest = createUpsertHandler(
  () => prisma.about.deleteMany({}),
  (body) =>
    prisma.about.create({
      data: {
        professionalSummary: body.professionalSummary,
        technicalSkills: body.technicalSkills,
        professionalExperience: body.professionalExperience,
        education: body.education,
        technicalCertifications: body.technicalCertifications,
        leadershipExperience: body.leadershipExperience,
        hobbies: body.hobbies,
      },
    }),
  validateAboutData,
);

// Refactored: Extract Method - Method routing extracted to reusable handler
export default createApiHandler({
  GET: handleGetRequest,
  POST: handlePostRequest,
});
