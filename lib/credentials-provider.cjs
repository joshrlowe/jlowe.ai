// CommonJS wrapper for CredentialsProvider to avoid webpack bundling issues
const credentialsModule = require("next-auth/providers/credentials");

// The module exports { default: function }, so extract it
const CredentialsProvider = credentialsModule.default || credentialsModule;

module.exports = CredentialsProvider;

