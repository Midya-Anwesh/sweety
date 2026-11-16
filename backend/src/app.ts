import "reflect-metadata";
import express from "express";
import type { RequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { useExpressServer } from "routing-controllers";
import { env } from "./config/env";
import { authorizationChecker } from "./common/auth/authorization-checker";
import { currentUserChecker } from "./common/auth/current-user-checker";
import { errorHandler } from "./common/middleware/error-handler.middleware";
import { AuthController } from "./modules/auth/auth.controller";
import { ReadingsController } from "./modules/readings/readings.controller";
import { ReportsController } from "./modules/reports/reports.controller";

export const app = express();
app.disable("x-powered-by");
app.set("trust proxy", env.TRUST_PROXY_HOPS);
app.use(helmet());
app.use(cors({ origin: env.CORS_ALLOWED_ORIGINS }));

app.get("/api/healthz", (_request, response) =>
  response.json({ status: "ok", service: "Sweety API" }),
);
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  // Independent limiters remain active in production; tests exercise many signups.
  skip: () => env.NODE_ENV === "test",
  message: {
    message:
      "Too many authentication requests. Please try again in 15 minutes.",
  },
});
// express-rate-limit supports Express 4 and 5; its declarations can resolve
// Express 5's types in a mixed-version workspace. This bridges only that boundary.
app.use("/api/auth", authLimiter as unknown as RequestHandler);

useExpressServer(app, {
  routePrefix: "/api",
  controllers: [AuthController, ReadingsController, ReportsController],
  authorizationChecker,
  currentUserChecker,
  defaultErrorHandler: false,
  classTransformer: true,
  validation: {
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
  },
});

app.use((_request, response) => {
  response.status(404).json({ message: "Route not found." });
});
app.use(errorHandler);
