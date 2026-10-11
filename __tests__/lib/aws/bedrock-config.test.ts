/**
 * Tests for lib/aws/bedrock-config
 */

jest.mock("@vercel/oidc-aws-credentials-provider", () => ({
  awsCredentialsProvider: jest.fn(() => "oidc-provider"),
}));

import { awsCredentialsProvider } from "@vercel/oidc-aws-credentials-provider";
import { bedrockClientConfig, hasAwsCredentials } from "@/lib/aws/bedrock-config";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.AWS_ROLE_ARN;
  delete process.env.AWS_ACCESS_KEY_ID;
  delete process.env.AWS_SECRET_ACCESS_KEY;
  delete process.env.AWS_REGION;
  jest.mocked(awsCredentialsProvider).mockClear();
});

afterAll(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("bedrockClientConfig", () => {
  it("uses Vercel OIDC credentials for the configured role when AWS_ROLE_ARN is set", () => {
    process.env.AWS_ROLE_ARN = "arn:aws:iam::123456789012:role/jlowe-ai-vercel-v1";
    process.env.AWS_REGION = "us-east-1";

    expect(bedrockClientConfig()).toEqual({ region: "us-east-1", credentials: "oidc-provider" });
    expect(awsCredentialsProvider).toHaveBeenCalledWith({
      roleArn: "arn:aws:iam::123456789012:role/jlowe-ai-vercel-v1",
    });
  });

  it("leaves credentials to the SDK default chain when AWS_ROLE_ARN is unset", () => {
    expect(bedrockClientConfig()).toEqual({ region: "us-east-1" });
    expect(awsCredentialsProvider).not.toHaveBeenCalled();
  });

  it("honours an explicit AWS_REGION", () => {
    process.env.AWS_REGION = "us-west-2";
    expect(bedrockClientConfig().region).toBe("us-west-2");
  });
});

describe("hasAwsCredentials", () => {
  it("is true with only a role ARN", () => {
    process.env.AWS_ROLE_ARN = "arn:aws:iam::123456789012:role/r";
    expect(hasAwsCredentials()).toBe(true);
  });

  it("is true with a static key pair", () => {
    process.env.AWS_ACCESS_KEY_ID = "id";
    process.env.AWS_SECRET_ACCESS_KEY = "secret";
    expect(hasAwsCredentials()).toBe(true);
  });

  it("is false with half a key pair and no role", () => {
    process.env.AWS_ACCESS_KEY_ID = "id";
    expect(hasAwsCredentials()).toBe(false);
  });
});
