# Circuito DevOps con IaC y Despliegue Cloud

Repositorio de Infraestructura como Codigo (IaC), observabilidad, pruebas de carga y pipeline CI/CD correspondiente a la Evaluacion Final de la Unidad III (*Proceso de liberacion y monitoreo*) de la asignatura **Gestion del Proceso de Desarrollo de Software**.

* **Estudiante:** Santiago Ronaldo Chavez Pinon
* **Numero de Control:** 1223100851
* **Grupo:** GIDS6103-E
* **Institucion:** Universidad Tecnologica del Norte de Guanajuato (UTNG)

---

## Servicios Desplegados en Render Cloud

* **Frontend Web (`Ejercicio5Cliente`):** https://ejercicio5cliente-4o86.onrender.com
* **Backend API REST (`Ejercicio5MyAPIGestor`):** https://ejercicio5myapigestor-k9qg.onrender.com
* **Health Checks:** `/actuator/health` en ambos servicios
* **Metricas Prometheus:** `/actuator/prometheus` en ambos servicios

### Repositorios de Microservicios Vinculados

* **Backend:** https://github.com/RonaldoChavez76/Ejercicio5MyAPIGestor
* **Frontend:** https://github.com/RonaldoChavez76/Ejercicio5Cliente

---

## Estructura del Repositorio

```text
circuito-devops-iac/
├── render/
│   └── render.yaml                     # Blueprint declarativo para Render Cloud
├── terraform/
│   ├── versions.tf                     # Proveedor Docker (kreuzwerker/docker ~> 3.0.2)
│   ├── variables.tf                    # Parametros y variables sensibles (TF_VAR_*)
│   ├── main.tf                         # Red y contenedores Prometheus + Grafana
│   ├── outputs.tf                      # Salidas de endpoints aprovisionados
│   └── .terraform.lock.hcl             # Archivo de bloqueo de dependencias
├── ansible/
│   ├── inventory.ini                   # Inventario local y hosts Render Cloud
│   └── playbook.yml                    # Validacion de servicios y endpoints Actuator
├── monitoreo/
│   ├── docker-compose.monitoring.yml   # Orquestacion local de Prometheus + Grafana
│   ├── prometheus/
│   │   ├── prometheus.yml              # Scrape cada 5s a Backend (:8081) y Frontend (:8082)
│   │   └── alert_rules.yml             # Reglas de alerta (caida, latencia p95, 5xx, JVM)
│   └── grafana/provisioning/           # Datasource y Dashboard aprovisionados como codigo
├── rendimiento-k6/
│   └── load_test.js                    # Prueba de carga controlada con umbrales (p95 < 500 ms)
├── reportes/                           # Evidencias exportadas (Terraform, Semgrep IaC, k6)
├── Jenkinsfile                         # Cuarto pipeline CI/CD (CircuitoDevOps-IaC)
├── config.xml                          # Definicion del job en Jenkins
├── .gitignore
└── README.md
```

---

## Configuracion Segura e Instrucciones de Reproduccion

Ninguna contrasena, token o llave privada se almacena en este repositorio. Todas las credenciales requeridas se inyectan mediante variables de entorno en tiempo de ejecucion:

* `SPRING_DATASOURCE_PASSWORD`: generada automaticamente en Render (`generateValue: true`) o definida localmente en entorno.
* `TF_VAR_db_password`: variable sensible requerida por Terraform para la base de datos.

### 1. Validacion de Terraform

```bash
docker run --rm -v "$(pwd)/terraform:/work" -w /work hashicorp/terraform:latest init -backend=false
docker run --rm -v "$(pwd)/terraform:/work" -w /work hashicorp/terraform:latest fmt -check
docker run --rm -v "$(pwd)/terraform:/work" -w /work hashicorp/terraform:latest validate
```

### 2. Levantamiento de Observabilidad (Prometheus + Grafana)

```bash
docker compose -f monitoreo/docker-compose.monitoring.yml up -d
```

* Prometheus: `http://localhost:9090`
* Grafana: `http://localhost:3000`

### 3. Ejecucion de Prueba de Carga Controlada (Grafana k6)

```bash
docker run --rm --add-host=host.docker.internal:host-gateway \
  -v "$(pwd)/rendimiento-k6:/scripts" \
  -v "$(pwd)/reportes:/reportes" \
  grafana/k6:latest run /scripts/load_test.js
```

### 4. Verificacion Automatizada con Ansible

```bash
ansible-playbook -i ansible/inventory.ini ansible/playbook.yml
```
