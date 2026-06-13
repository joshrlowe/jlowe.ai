# modules/chat — skeleton (later phase)
#
# Deploys the @velocity/chat Lambda (services/chat) as the Bedrock-backed
# digital-twin backend.
#
# Planned resources:
#   - aws_lambda_function (or Function URL) for the bundled handler
#   - aws_iam_role + policy: bedrock:InvokeModel (least privilege)
#   - aws_apigatewayv2_* OR aws_lambda_function_url
#   - log group + retention
#
# Planned variables: environment, bedrock_model_id, cors_origins
# Planned outputs:    endpoint_url, function_arn
#
# TODO(chat-phase): implement.
