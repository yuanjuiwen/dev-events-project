import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";

const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

export const posthogLoggerProvider =
  posthogToken && posthogHost
    ? new LoggerProvider({
        resource: resourceFromAttributes({ "service.name": "project1" }),
        processors: [
          new BatchLogRecordProcessor({
            exporter: new OTLPLogExporter({
              url: `${posthogHost}/i/v1/logs`,
              headers: {
                Authorization: `Bearer ${posthogToken}`,
                "Content-Type": "application/json",
              },
            }),
          }),
        ],
      })
    : undefined;

export const posthogLogger = posthogLoggerProvider?.getLogger("posthog-wizard");

export function register() {
  if (!posthogLoggerProvider && process.env.NODE_ENV !== "production") {
    const missingVariable = posthogToken
      ? "NEXT_PUBLIC_POSTHOG_HOST"
      : "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN";

    console.warn(
      `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
    );
  }
}
