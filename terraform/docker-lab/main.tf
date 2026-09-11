provider "docker" {}

resource "docker_network" "security_lab" {
  name = "security-lab-network"
}

resource "docker_image" "nginx" {
  name         = "nginx:alpine"
  keep_locally = false
}

resource "docker_container" "web" {
  name  = "security-lab-web"
  image = docker_image.nginx.image_id

  networks_advanced {
    name = docker_network.security_lab.name
  }

  ports {
    internal = 80
    external = 8081
  }

  restart = "unless-stopped"
}
