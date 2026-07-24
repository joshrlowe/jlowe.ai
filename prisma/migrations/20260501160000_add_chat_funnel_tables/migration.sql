CREATE TABLE "chat_sessions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "qualified" BOOLEAN NOT NULL DEFAULT false,
    "bookingOffered" BOOLEAN NOT NULL DEFAULT false,
    "topIntent" TEXT,
    "capturedEmail" TEXT,
    "capturedName" TEXT,
    "langfuseTraceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "emailedToOwner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chat_sessions_sessionId_key" ON "chat_sessions"("sessionId");
CREATE INDEX "chat_sessions_qualified_createdAt_idx" ON "chat_sessions"("qualified", "createdAt");
CREATE INDEX "chat_sessions_emailedToOwner_qualified_createdAt_idx"
    ON "chat_sessions"("emailedToOwner", "qualified", "createdAt");

CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "intent" TEXT,
    "toolCalls" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "chat_messages_sessionId_createdAt_idx" ON "chat_messages"("sessionId", "createdAt");

ALTER TABLE "chat_messages"
    ADD CONSTRAINT "chat_messages_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "chat_sessions"("sessionId")
    ON DELETE CASCADE ON UPDATE CASCADE;
