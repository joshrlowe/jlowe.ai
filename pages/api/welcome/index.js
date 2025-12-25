import prisma from "../../../lib/prisma.js";
import { createApiHandler, createGetLatestHandler, createUpsertHandler } from "../../../lib/utils/apiRouteHandler.js";
import { validateRequiredFields } from "../../../lib/utils/validators.js";

// Refactored: Extract Method - Common GET pattern extracted to reusable handler
const handleGetRequest = createGetLatestHandler(
  () => prisma.welcome.findFirst({
    orderBy: { createdAt: "desc" },
  }),
  "Welcome data not found"
);

// Refactored: Extract Method - Common POST pattern extracted to reusable handler
const handlePostRequest = createUpsertHandler(
  () => prisma.welcome.deleteMany({}),
  (body) => prisma.welcome.create({
    data: {
      name: body.name,
      briefBio: body.briefBio,
      callToAction: body.callToAction || null,
    },
  }),
  (body) => validateRequiredFields(body, ["name", "briefBio", "callToAction"])
);

// Refactored: Extract Method - Method routing extracted to reusable handler
export default createApiHandler({
  GET: handleGetRequest,
  POST: handlePostRequest,
});
