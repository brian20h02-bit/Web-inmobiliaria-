import app from './app';

// ── Startup validation ────────────────────────────────────────────────────────
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET env var is required in production. Exiting.')
    process.exit(1)
  } else {
    console.warn('⚠️  JWT_SECRET not set — using insecure default. DO NOT deploy without setting it.')
  }
}

const PORT = process.env.PORT || 3001;

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
