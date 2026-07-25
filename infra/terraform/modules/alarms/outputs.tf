output "ops_sns_topic_arn" {
  description = "ARN of the ops SNS topic, or null when no ops_alert_emails were provided."
  value       = length(aws_sns_topic.ops) > 0 ? aws_sns_topic.ops[0].arn : null
}

output "alarm_names" {
  description = "Names of all created CloudWatch alarms."
  value = concat(
    [
      aws_cloudwatch_metric_alarm.lambda_errors.alarm_name,
      aws_cloudwatch_metric_alarm.lambda_throttles.alarm_name,
      aws_cloudwatch_metric_alarm.cloudfront_5xx.alarm_name,
    ],
    aws_cloudwatch_metric_alarm.lambda_duration_p99[*].alarm_name,
    aws_cloudwatch_metric_alarm.lambda_concurrency[*].alarm_name,
  )
}
