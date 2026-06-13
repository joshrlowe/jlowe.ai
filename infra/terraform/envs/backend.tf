terraform {
  # `key` defaults to dev so `terraform validate` sees a complete backend;
  # always re-init per env to set it explicitly:
  #   terraform init -reconfigure -backend-config=backend.<env>.hcl
  backend "s3" {
    bucket       = "jlowe-ai-terraform-state-509399626117"
    key          = "envs/dev/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}
