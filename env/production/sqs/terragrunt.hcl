terraform {
  source = "git::https://github.com/cds-snc/forms-terraform//aws/sqs?ref=${get_env("TARGET_VERSION")}"
}

include {
  path = find_in_parent_folders()
}
