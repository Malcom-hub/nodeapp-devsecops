const express = require('express');
const promClient = require('prom-client');

const app = express();
const register = promClient.register;

// Métriques système (CPU, mémoire…)
promClient.collectDefaultMetrics({ register });

// Compteur de requêtes HTTP
const httpTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total requêtes HTTP',
  labelNames: ['method', 'route', 'status'],
});

// Histogramme durée requêtes
const httpDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Durée des requêtes HTTP',
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1],
});

// Middleware
app.use((req, res, next) => {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    httpTotal.inc({
      method: req.method,
      route: req.path,
      status: res.statusCode,
    });
    end();
  });
  next();
});

// Routes
app.get('/', (req, res) =>
  res.json({ message: 'Hello DevSecOps!' })
);

app.get('/health', (req, res) =>
  res.json({ status: 'ok' })
);

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.listen(3000, () =>
  console.log('App démarrée sur le port 3000')
);