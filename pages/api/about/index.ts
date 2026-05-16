import prisma from "../../../lib/prisma";
import {
  createApiHandler,
  createGetLatestHandler,
} from "../../../lib/utils/apiRouteHandler";

const handleGetRequest = createGetLatestHandler(
  () =>
    prisma.about.findFirst({
      orderBy: { createdAt: "desc" },
    }),
  "About data not found",
);

export default createApiHandler({
  GET: handleGetRequest,
});
