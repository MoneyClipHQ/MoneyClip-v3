import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Session configuration - must be before JSON parsing
app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

app.use(express.json({ limit: '50mb' })); // Increase limit for large disclosure text
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Validate required environment variables for object storage
function validateEnvironmentVariables() {
  const requiredEnvVars = [
    'PRIVATE_OBJECT_DIR',
    'PUBLIC_OBJECT_SEARCH_PATHS'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('💡 Please set up object storage in the Object Storage tool pane to configure these variables.');
    process.exit(1);
  }
  
  // Validate PUBLIC_OBJECT_SEARCH_PATHS format
  const searchPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS!.split(',');
  const invalidPaths = searchPaths.filter(path => !path.trim() || !path.startsWith('/'));
  
  if (invalidPaths.length > 0) {
    console.error(`❌ Invalid PUBLIC_OBJECT_SEARCH_PATHS format. All paths must start with '/': ${invalidPaths.join(', ')}`);
    process.exit(1);
  }
  
  console.log(`✅ Object storage environment variables validated successfully`);
  console.log(`   PRIVATE_OBJECT_DIR: ${process.env.PRIVATE_OBJECT_DIR}`);
  console.log(`   PUBLIC_OBJECT_SEARCH_PATHS: ${process.env.PUBLIC_OBJECT_SEARCH_PATHS}`);
}

(async () => {
  // Validate environment variables before starting server
  validateEnvironmentVariables();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
