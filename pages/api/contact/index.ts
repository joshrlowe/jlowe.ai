import prisma from "../../../lib/prisma";
import {
  createApiHandler,
  createGetLatestHandler,
} from "../../../lib/utils/apiRouteHandler";

const handleGetRequest = createGetLatestHandler(
  () =>
    prisma.contact.findFirst({
      orderBy: { createdAt: "desc" },
    }),
  "Contact data not found",
);

export default createApiHandler({
  GET: handleGetRequest,
});
