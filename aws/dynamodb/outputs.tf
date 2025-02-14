output "dynamodb_relability_queue_arn" {
  description = "Reliability queue DynamodDB table ARN"
  value       = aws_dynamodb_table.reliability_queue.arn
}

output "dynamodb_vault_arn" {
  description = "Vault DynamodDB table ARN"
  value       = aws_dynamodb_table.vault.arn
}

output "dynamodb_vault_table_name" {
  description = "Vault DynamodDB table name"
  value       = aws_dynamodb_table.vault.name
}

output "dynamodb_audit_logs_arn" {
  description = "Audit Logs table ARN"
  value       = aws_dynamodb_table.audit_logs.arn
}

output "dynamodb_audit_logs_table_name" {
  description = "Audit Logs table name"
  value       = aws_dynamodb_table.audit_logs.name
}