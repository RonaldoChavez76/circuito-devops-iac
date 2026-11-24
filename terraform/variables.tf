variable "environment" {
  description = "Entorno de despliegue (local, staging, prod)"
  type        = string
  default     = "prod"
}

variable "network_name" {
  description = "Nombre de la red Docker para el circuito DevOps y observabilidad"
  type        = string
  default     = "devops-observability-net"
}

variable "backend_port" {
  description = "Puerto expuesto del microservicio Backend"
  type        = number
  default     = 8081
}

variable "frontend_port" {
  description = "Puerto expuesto del microservicio Frontend (evita colisión con Jenkins 8080)"
  type        = number
  default     = 8082
}

variable "prometheus_port" {
  description = "Puerto expuesto para Prometheus"
  type        = number
  default     = 9090
}

variable "grafana_port" {
  description = "Puerto expuesto para Grafana"
  type        = number
  default     = 3000
}

variable "db_name" {
  description = "Nombre de la base de datos operativa"
  type        = string
  default     = "dbgestor"
}

variable "db_user" {
  description = "Usuario de acceso a MariaDB"
  type        = string
  default     = "root"
  sensitive   = true
}

variable "db_password" {
  description = "Contraseña de MariaDB (inyectada vía TF_VAR_db_password)"
  type        = string
  default     = ""
  sensitive   = true
}

