output "web_url" {
  description = "URL of the Terraform-managed web service"
  value       = "http://localhost:8081"
}

output "container_name" {
  value = docker_container.web.name
}

output "network_name" {
  value = docker_network.security_lab.name
}
