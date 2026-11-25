locals {
  monitoring_dir = var.host_monitoring_dir != "" ? var.host_monitoring_dir : abspath("${path.module}/../monitoreo")
}

resource "docker_network" "devops_net" {
  name = var.network_name
}

resource "docker_image" "prometheus_img" {
  name         = "prom/prometheus:v2.55.1"
  keep_locally = true
}

resource "docker_image" "grafana_img" {
  name         = "grafana/grafana:11.3.0"
  keep_locally = true
}

resource "docker_container" "prometheus" {
  name         = "devops-prometheus"
  image        = docker_image.prometheus_img.image_id
  restart      = "unless-stopped"
  network_mode = "bridge"

  networks_advanced {
    name    = docker_network.devops_net.name
    aliases = ["prometheus"]
  }

  ports {
    internal = 9090
    external = var.prometheus_port
  }

  command = [
    "--config.file=/etc/prometheus/prometheus.yml",
    "--storage.tsdb.path=/prometheus",
    "--web.enable-lifecycle"
  ]

  mounts {
    target    = "/etc/prometheus/prometheus.yml"
    source    = "${local.monitoring_dir}/prometheus/prometheus.yml"
    type      = "bind"
    read_only = true
  }

  mounts {
    target    = "/etc/prometheus/alert_rules.yml"
    source    = "${local.monitoring_dir}/prometheus/alert_rules.yml"
    type      = "bind"
    read_only = true
  }

  host {
    host = "host.docker.internal"
    ip   = "host-gateway"
  }

  labels {
    label = "proyecto"
    value = "circuito-devops-unidad3"
  }
}

resource "docker_container" "grafana" {
  name         = "devops-grafana"
  image        = docker_image.grafana_img.image_id
  restart      = "unless-stopped"
  network_mode = "bridge"

  depends_on = [docker_container.prometheus]

  networks_advanced {
    name = docker_network.devops_net.name
  }

  ports {
    internal = 3000
    external = var.grafana_port
  }

  env = [
    "GF_AUTH_ANONYMOUS_ENABLED=true",
    "GF_AUTH_ANONYMOUS_ORG_ROLE=Admin",
    "GF_USERS_ALLOW_SIGN_UP=false"
  ]

  mounts {
    target    = "/etc/grafana/provisioning"
    source    = "${local.monitoring_dir}/grafana/provisioning"
    type      = "bind"
    read_only = true
  }

  host {
    host = "host.docker.internal"
    ip   = "host-gateway"
  }

  labels {
    label = "proyecto"
    value = "circuito-devops-unidad3"
  }
}
