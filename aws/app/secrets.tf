#
# ECS and Lambda app secrets
#
resource "aws_secretsmanager_secret" "notify_api_key" {
  name                    = "notify_api_key"
  recovery_window_in_days = 0

  tags = {
    (var.billing_tag_key) = var.billing_tag_value
    Terraform             = true
  }
}

resource "aws_secretsmanager_secret_version" "notify_api_key" {
  secret_id     = aws_secretsmanager_secret.notify_api_key.id
  secret_string = var.notify_api_key
}

resource "aws_secretsmanager_secret" "freshdesk_api_key" {
  name                    = "freshdesk_api_key"
  recovery_window_in_days = 0

  tags = {
    (var.billing_tag_key) = var.billing_tag_value
    Terraform             = true
  }
}

resource "aws_secretsmanager_secret_version" "freshdesk_api_key" {
  secret_id     = aws_secretsmanager_secret.freshdesk_api_key.id
  secret_string = var.freshdesk_api_key
}

resource "aws_secretsmanager_secret" "token_secret" {
  name                    = "token_secret"
  recovery_window_in_days = 0

  tags = {
    (var.billing_tag_key) = var.billing_tag_value
    Terraform             = true
  }
}

resource "aws_secretsmanager_secret_version" "token_secret" {
  secret_id     = aws_secretsmanager_secret.token_secret.id
  secret_string = var.ecs_secret_token_secret
}

resource "aws_secretsmanager_secret" "recaptcha_secret" {
  name                    = "recaptcha_secret"
  recovery_window_in_days = 0

  tags = {
    (var.billing_tag_key) = var.billing_tag_value
    Terraform             = true
  }
}

resource "aws_secretsmanager_secret_version" "recaptcha_secret" {
  secret_id     = aws_secretsmanager_secret.recaptcha_secret.id
  secret_string = var.recaptcha_secret
}

resource "aws_secretsmanager_secret" "gc_notify_callback_bearer_token" {
  name                    = "gc_notify_callback_bearer_token"
  recovery_window_in_days = 0

  tags = {
    (var.billing_tag_key) = var.billing_tag_value
    Terraform             = true
  }
}

resource "aws_secretsmanager_secret_version" "gc_notify_callback_bearer_token" {
  secret_id     = aws_secretsmanager_secret.gc_notify_callback_bearer_token.id
  secret_string = var.gc_notify_callback_bearer_token
}
