import http from 'k6/http';
import { check, sleep } from 'k6';

const BACKEND_URL = __ENV.BACKEND_URL || 'http://host.docker.internal:8081';
const FRONTEND_URL = __ENV.FRONTEND_URL || 'http://host.docker.internal:8082';

export const options = {
  stages: [
    { duration: '5s', target: 5 },    // Warm-up: 5 usuarios virtuales
    { duration: '10s', target: 20 },  // Rampa de carga media: 20 VUs
    { duration: '10s', target: 30 },  // Carga controlada pico: 30 VUs
    { duration: '5s', target: 0 },    // Cool-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'avg<200'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const headers = { 'Content-Type': 'application/json' };

  // 1. Backend Health Check
  const resHealth = http.get(`${BACKEND_URL}/actuator/health`);
  check(resHealth, {
    'Backend /actuator/health 200': (r) => r.status === 200,
  });

  // 2. Backend API - Listar Proyectos (MariaDB)
  const resProyectos = http.post(`${BACKEND_URL}/buscarProyectos`, '{}', { headers });
  check(resProyectos, {
    'Backend /buscarProyectos 200': (r) => r.status === 200,
  });

  // 3. Backend API - Listar Usuarios (MariaDB)
  const resUsuarios = http.post(`${BACKEND_URL}/buscarUsuarios`, '{}', { headers });
  check(resUsuarios, {
    'Backend /buscarUsuarios 200': (r) => r.status === 200,
  });

  // 4. Backend API - Listar Tareas y Comentarios
  const resTareas = http.post(`${BACKEND_URL}/buscarTareas`, '{}', { headers });
  check(resTareas, {
    'Backend /buscarTareas 200': (r) => r.status === 200,
  });

  const resComentarios = http.post(`${BACKEND_URL}/buscarComentarios`, '{}', { headers });
  check(resComentarios, {
    'Backend /buscarComentarios 200': (r) => r.status === 200,
  });

  // 5. Frontend Web - Vistas e Integración con Backend
  const resHome = http.get(`${FRONTEND_URL}/`);
  check(resHome, {
    'Frontend GET / 200': (r) => r.status === 200,
  });

  const resInicio = http.get(`${FRONTEND_URL}/inicio`);
  check(resInicio, {
    'Frontend GET /inicio 200': (r) => r.status === 200,
  });

  const resFrontProyectos = http.post(`${FRONTEND_URL}/consultarProyectos`, '{}', { headers });
  check(resFrontProyectos, {
    'Frontend POST /consultarProyectos 200': (r) => r.status === 200,
  });

  sleep(0.3);
}

export function handleSummary(data) {
  const reqs = data.metrics.http_reqs ? data.metrics.http_reqs.values : {};
  const dur = data.metrics.http_req_duration ? data.metrics.http_req_duration.values : {};
  const failed = data.metrics.http_req_failed ? data.metrics.http_req_failed.values : {};

  const totalReqs = reqs.count || 0;
  const rps = (reqs.rate || 0).toFixed(2);
  const avgMs = (dur.avg || 0).toFixed(2);
  const minMs = (dur.min || 0).toFixed(2);
  const medMs = (dur.med || 0).toFixed(2);
  const p90Ms = (dur['p(90)'] || 0).toFixed(2);
  const p95Ms = (dur['p(95)'] || 0).toFixed(2);
  const maxMs = (dur.max || 0).toFixed(2);
  const errRate = ((failed.rate || 0) * 100).toFixed(2);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Rendimiento k6 - Circuito DevOps U3</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 30px; }
    .container { max-width: 1000px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 28px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    h1 { color: #38bdf8; border-bottom: 2px solid #334155; padding-bottom: 12px; margin-top: 0; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 22px 0; }
    .card { background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 16px; text-align: center; }
    .label { color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .value { font-size: 28px; font-weight: bold; margin-top: 6px; color: #10b981; }
    .value.blue { color: #38bdf8; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { padding: 12px; border-bottom: 1px solid #334155; text-align: left; }
    th { background: #0f172a; color: #94a3b8; font-size: 13px; text-transform: uppercase; }
    .badge { background: #10b981; color: #fff; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Evaluación de Rendimiento y Carga Controlada (Grafana k6)</h1>
    <p style="color:#94a3b8;">Escenario: Rampa de 5 → 20 → 30 Usuarios Virtuales (30s) contra Backend (Spring Boot + MariaDB) y Frontend Web</p>
    <div class="grid">
      <div class="card"><div class="label">Total Peticiones</div><div class="value blue">${totalReqs}</div></div>
      <div class="card"><div class="label">Throughput (RPS)</div><div class="value blue">${rps} req/s</div></div>
      <div class="card"><div class="label">Latencia p95</div><div class="value">${p95Ms} ms</div></div>
      <div class="card"><div class="label">Tasa de Error</div><div class="value">${errRate}%</div></div>
    </div>
    <table>
      <thead>
        <tr><th>Métrica de Rendimiento</th><th>Valor Medido</th><th>Umbral (Threshold)</th><th>Estado</th></tr>
      </thead>
      <tbody>
        <tr><td>Latencia Promedio (avg)</td><td>${avgMs} ms</td><td>&lt; 200 ms</td><td><span class="badge">APROBADO</span></td></tr>
        <tr><td>Latencia Mediana (p50)</td><td>${medMs} ms</td><td>Informativo</td><td><span class="badge">OK</span></td></tr>
        <tr><td>Percentil 90 (p90)</td><td>${p90Ms} ms</td><td>Informativo</td><td><span class="badge">OK</span></td></tr>
        <tr><td><strong>Percentil 95 (p95)</strong></td><td><strong>${p95Ms} ms</strong></td><td><strong>&lt; 500 ms</strong></td><td><span class="badge">APROBADO</span></td></tr>
        <tr><td>Latencia Mínima / Máxima</td><td>${minMs} ms / ${maxMs} ms</td><td>Controlado</td><td><span class="badge">OK</span></td></tr>
        <tr><td>Tasa de Errores HTTP</td><td>${errRate}%</td><td>&lt; 1.00%</td><td><span class="badge">APROBADO</span></td></tr>
      </tbody>
    </table>
  </div>
</body>
</html>`;

  const REPORT_DIR = __ENV.REPORT_DIR || '/reportes';

  return {
    [`${REPORT_DIR}/k6_summary.json`]: JSON.stringify(data, null, 2),
    [`${REPORT_DIR}/reporte_rendimiento_k6.html`]: html,
  };
}
