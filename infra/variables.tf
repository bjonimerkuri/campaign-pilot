variable "region" {
  type    = string
  default = "eu-central-1"
}

variable "project" {
  type    = string
  default = "campaign-copilot"
}

variable "environment" {
  type    = string
  default = "dev"
}

variable "openai_model" {
  type    = string
  default = "gpt-4o-mini"
}

variable "alert_email" {
  type    = string
  default = ""
}

variable "openai_api_key" {
  type      = string
  sensitive = true
}
