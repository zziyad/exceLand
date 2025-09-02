({
  sid: 'token',
  characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  length: 64,
  secret: '0vcXNZc57WhMvnFcsfpDtr2au7DgZ5J9lZFObtWqeD6KAD3k9XEgyQyoDHFFefaf',
  regenerate: 60 * 60 * 1000,
  expire: 2 * 60 * 60 * 1000,
  persistent: true,
  // Session TTL configuration (in seconds)
  accessTtl: 1 * 60,        // 15 minutes default
  refreshTtl: 7 * 24 * 60 * 60, // 7 days default
  limits: {
    ip: 20,
    user: 5,
  },
});
