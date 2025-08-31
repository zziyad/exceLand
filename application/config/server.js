({
  host: '0.0.0.0',
  balancer: 8000,
  protocol: 'http',
  ports: [8001],
  nagle: false,
  timeouts: {
    bind: 2000,
    start: 30000,
    stop: 5000,
    request: 5000,
    watch: 1000,
  },
  queue: {
    concurrency: 1000,
    size: 2000,
    timeout: 3000,
  },
  scheduler: {
    concurrency: 10,
    size: 2000,
    timeout: 3000,
  },
  workers: {
    pool: 2,
    wait: 2000,
    timeout: 5000,
  },
  tls: {
    enabled: false,
    keyPath: '/etc/ssl/private/privkey.pem',
    certPath: '/etc/ssl/private/fullchain.pem',
    // caPath: '/etc/letsencrypt/live/example.com/chain.pem', // при необходимости
    // publicPort: 443, // если redirect делаем на 443
    redirectPort: 8000, // опционально: http-порт, который будет редиректить на https
    allowedOrigins: ['https://app.example.com'], // для CORS
  },
  cors: {
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://localhost:3000',
      'https://localhost:3001',
    ],
    allowCredentials: true,
    maxAge: 86400,
  },
});
