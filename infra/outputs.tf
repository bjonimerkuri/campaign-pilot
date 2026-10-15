output "api_url" {
  value = aws_apigatewayv2_api.http.api_endpoint
}

output "table_name" {
  value = aws_dynamodb_table.main.name
}

output "alerts_topic_arn" {
  value = aws_sns_topic.alerts.arn
}
