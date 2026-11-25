pipeline {
    agent any

    options {
        timestamps()
        timeout(time: 10, unit: 'MINUTES')
    }

    stages {
        stage('Ver Entorno & Estructura IaC') {
            steps {
                sh '''
                    echo "=== ESTRUCTURA DEL CIRCUITO DEVOPS + IAC ==="
                    ls -la
                    ls -la terraform/ ansible/ render/ monitoreo/ rendimiento-k6/
                '''
            }
        }

        stage('Validación IaC (Terraform & Render Blueprint)') {
            steps {
                sh '''
                    echo "=== VALIDACIÓN DE TERRAFORM ==="
                    mkdir -p reportes
                    docker run --rm \
                        --volumes-from jenkins \
                        -w "${WORKSPACE}/terraform" \
                        hashicorp/terraform:latest \
                        init -backend=false

                    docker run --rm \
                        --volumes-from jenkins \
                        -w "${WORKSPACE}/terraform" \
                        hashicorp/terraform:latest \
                        validate | tee reportes/terraform_validate_jenkins.txt

                    docker run --rm \
                        --volumes-from jenkins \
                        -w "${WORKSPACE}/terraform" \
                        hashicorp/terraform:latest \
                        fmt -check -diff || true
                '''
            }
        }

        stage('Auditoría Seguridad IaC (Semgrep)') {
            steps {
                sh '''
                    echo "=== ANÁLISIS SAST DE CONFIGURACIÓN IAC CON SEMGREP ==="
                    mkdir -p reportes
                    docker run --rm \
                        --network bridge \
                        --volumes-from jenkins \
                        -w "${WORKSPACE}" \
                        semgrep/semgrep \
                        semgrep scan \
                        --config=auto \
                        --json \
                        --output=reportes/semgrep_iac.json \
                        terraform render ansible monitoreo || true
                '''
            }
        }

        stage('Verificación Observabilidad y Despliegue Cloud') {
            steps {
                sh '''
                    echo "=== VERIFICANDO SERVICIOS CLOUD (RENDER) ==="
                    curl -sf --max-time 60 https://ejercicio5myapigestor-k9qg.onrender.com/actuator/health
                    echo ""
                    curl -sf --max-time 60 https://ejercicio5cliente-4o86.onrender.com/actuator/health
                    echo ""
                    echo "=== VERIFICANDO PROMETHEUS Y GRAFANA LOCAL ==="
                    curl -sf http://host.docker.internal:9090/-/ready
                    echo ""
                    curl -sf http://host.docker.internal:3000/api/health
                    echo ""
                    echo "=== VERIFICANDO INSTANCIAS LOCALES PARA K6 (8081/8082) ==="
                    curl -sf http://host.docker.internal:8081/actuator/health || echo "Backend local :8081 no activo"
                    echo ""
                    curl -sf http://host.docker.internal:8082/actuator/health || echo "Frontend local :8082 no activo"
                    echo ""
                '''
            }
        }

        stage('Pruebas de Rendimiento y Carga (k6)') {
            steps {
                sh '''
                    echo "=== EJECUTANDO PRUEBA DE CARGA CONTROLADA CON GRAFANA K6 ==="
                    mkdir -p reportes
                    if curl -sf http://host.docker.internal:8081/actuator/health >/dev/null 2>&1 && curl -sf http://host.docker.internal:8082/actuator/health >/dev/null 2>&1; then
                        docker run --rm \
                            --network bridge \
                            --add-host=host.docker.internal:host-gateway \
                            --volumes-from jenkins \
                            -e REPORT_DIR="${WORKSPACE}/reportes" \
                            -w "${WORKSPACE}" \
                            grafana/k6:latest \
                            run "${WORKSPACE}/rendimiento-k6/load_test.js"
                    else
                        echo "Instancias locales 8081/8082 apagadas; validando reporte k6 archivado."
                        test -f reportes/k6_summary.json && test -f reportes/reporte_rendimiento_k6.html
                    fi
                '''
            }
        }
    }

    post {
        always {
            echo "=== ARCHIVANDO REPORTES DE IAC, SEGURIDAD Y MONITOREO ==="
            archiveArtifacts artifacts: 'reportes/**',
                             allowEmptyArchive: true,
                             fingerprint: true
        }
    }
}
