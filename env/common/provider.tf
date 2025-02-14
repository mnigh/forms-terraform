
terraform {
  required_version = "1.4.2"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "3.76.1"
    }
    random = {
      source  = "hashicorp/random"
      version = "=3.4.3"
    }
  }
}

provider "aws" {
  region              = var.region
  allowed_account_ids = [var.account_id]
}

provider "aws" {
  alias               = "us-east-1"
  region              = "us-east-1"
  allowed_account_ids = [var.account_id]
}
