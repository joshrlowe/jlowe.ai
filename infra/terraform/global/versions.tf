terraform {
  # Pin the minor: state written by 1.15 must not be touched by older cores.
  # Comfortably satisfies the >= 1.10 floor that `use_lockfile` requires.
  required_version = "~> 1.15.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = {
      Project   = "jlowe-ai"
      ManagedBy = "terraform"
      Stack     = "global"
    }
  }
}
