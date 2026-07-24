import prisma from "../../../lib/prisma";
import { createApiHandler, createGetLatestHandler } from "../../../lib/utils/apiRouteHandler";

const handleGetRequest = createGetLatestHandler(
  () =>
    prisma.welcome.findFirst({
      orderBy: { createdAt: "desc" },
    }),
  "Welcome data not found"
);

export default createApiHandler({
  GET: handleGetRequest,
});
