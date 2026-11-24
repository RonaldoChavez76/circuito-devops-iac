output "backend_actuator_health" {
  description = "Endpoint de salud del Backend"
  value       = "http://localhost:${var.backend_port}/actuator/health"
}

output "frontend_url" {
  description = "URL del Frontend Web"
  value       = "http://localhost:${var.frontend_port}/"
}

output "prometheus_url" {
  description = "URL de Prometheus (métricas y alertas)"
  value       = "http://localhost:${var.prometheus_port}"
}

output "grafana_url" {
  description = "URL de Grafana (Dashboard de Observabilidad)"
  value       = "http://localhost:${var.grafana_port}"
}

