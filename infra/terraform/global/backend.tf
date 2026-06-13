terraform {
  backend "s3" {
    bucket       = "jlowe-ai-terraform-state-509399626117"
    key          = "global/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true # native S3 locking (Terraform >= 1.10); no DynamoDB
  }
}
