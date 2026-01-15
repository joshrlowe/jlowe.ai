import prisma from "../../../lib/prisma.js";
import {
  createApiHandler,
  createGetLatestHandler,
  createUpsertHandler,
} from "../../../lib/utils/apiRouteHandler.js";
import { validateRequiredFields } from "../../../lib/utils/validators.js";

// Refactored: Extract Method - Common GET pattern extracted to reusable handler
const handleGetRequest = createGetLatestHandler(
  () =>
    prisma.contact.findFirst({
      orderBy: { createdAt: "desc" },
    }),
  "Contact data not found",
);

// Refactored: Extract Method - Common POST pattern extracted to reusable handler
const handlePostRequest = createUpsertHandler(
  () => prisma.contact.deleteMany({}),
  (body) =>
    prisma.contact.create({
      data: {
        name: body.name,
        emailAddress: body.emailAddress,
        phoneNumber: body.phoneNumber || null,
        socialMediaLinks: body.socialMediaLinks || null,
        location: body.location || null,
        availability: body.availability || null,
        additionalContactMethods: body.additionalContactMethods || null,
        heroWords: body.heroWords || ["Amazing", "Innovative", "Momentous"],
      },
    }),
  (body) =>
    validateRequiredFields(body, [
      "name",
      "emailAddress",
      "location",
      "availability",
    ]),
);

// Refactored: Extract Method - Method routing extracted to reusable handler
export default createApiHandler({
  GET: handleGetRequest,
  POST: handlePostRequest,
});
