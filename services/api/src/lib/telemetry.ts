import { createLogger } from './logger';

const log = createLogger('telemetry');

let sdkStarted = false;

export async function initTelemetry(): Promise<void> {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  if (!endpoint) {
    log.info('OpenTelemetry disabled (OTEL_EXPORTER_OTLP_ENDPOINT not set)');
    return;
  }

  if (sdkStarted) return;

  try {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node');
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
    const { Resource } = await import('@opentelemetry/resources');
    const { SEMRESATTRS_SERVICE_NAME } = await import('@opentelemetry/semantic-conventions');

    const sdk = new NodeSDK({
      resource: new Resource({ [SEMRESATTRS_SERVICE_NAME]: 'claudygod-api' }),
      traceExporter: new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }),
      instrumentations: [getNodeAutoInstrumentations({ '@opentelemetry/instrumentation-fs': { enabled: false } })],
    });

    sdk.start();
    sdkStarted = true;

    process.on('SIGTERM', () => {
      sdk.shutdown().catch((err: unknown) => {
        log.warn('OpenTelemetry shutdown error', { err });
      });
    });

    log.info('OpenTelemetry initialized', { endpoint });
  } catch (err) {
    log.warn('OpenTelemetry packages not available — tracing disabled', { err });
  }
}
