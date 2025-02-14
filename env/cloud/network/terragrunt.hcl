terraform {
  source = "../../../aws//network"
}

dependencies {
  paths = ["../kms"]
}

dependency "kms" {
  config_path = "../kms"

  mock_outputs_allowed_terraform_commands = ["init", "fmt", "validate", "plan", "show"]
  mock_outputs = {
    kms_key_cloudwatch_arn = ""
  }
}

inputs = {
  kms_key_cloudwatch_arn = dependency.kms.outputs.kms_key_cloudwatch_arn
  vpc_cidr_block         = "172.16.0.0/16"
  vpc_name               = "forms"
}

include {
  path = find_in_parent_folders()
}
