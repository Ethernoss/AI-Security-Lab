# Terraform Lab

## Objective

Learn Infrastructure as Code by provisioning and managing local Docker infrastructure with Terraform.

## Resources

- Docker network
- Nginx Docker image
- Nginx container
- Published HTTP port

## Terraform lifecycle tested

- terraform init
- terraform fmt
- terraform validate
- terraform plan
- terraform apply
- terraform state
- infrastructure modification
- configuration drift
- drift recovery

## Drift test

The Docker container was manually modified/removed outside Terraform.

Terraform detected that the real infrastructure no longer matched the desired configuration and proposed the changes required to restore it.

## Result

The infrastructure was successfully restored using Terraform.

Final validation:

No changes. Infrastructure matches configuration.

## Security considerations

Terraform state contains detailed information about managed infrastructure and must be protected.

State files and sensitive tfvars are excluded from Git.

Infrastructure changes should be reviewed using terraform plan before terraform apply.
