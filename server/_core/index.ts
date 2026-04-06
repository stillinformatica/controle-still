import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function getCliPortArg(): number | null {
  const portFlagIndex = process.argv.findIndex(arg => arg === "--port");
  if (portFlagIndex === -1) return null;

  const portValue = process.argv[portFlagIndex + 1];
  const parsedPort = Number.parseInt(portValue ?? "", 10);

  return Number.isFinite(parsedPort) ? parsedPort : null;
}

function getServerPort(): number {
  const envPort = Number.parseInt(process.env.PORT ?? "", 10);
  if (Number.isFinite(envPort)) return envPort;

  const cliPort = getCliPortArg();
  if (cliPort !== null) return cliPort;

  return 3000;
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = getServerPort();

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });

  server.on("error", error => {
    console.error(`Failed to start server on port ${port}:`, error);
    process.exit(1);
  });
}

startServer().catch(console.error);
