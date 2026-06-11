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
    const load = (mod: string) => import(/* webpackIgnore: true */ mod);

    const [sdkMod, instrMod, exporterMod, resourceMod, semconvMod] = await Promise.all([
      load('@opentelemetry/sdk-node'),
      load('@opentelemetry/auto-instrumentations-node'),
      load('@opentelemetry/exporter-trace-otlp-http'),
      load('@opentelemetry/resources'),
      load('@opentelemetry/semantic-conventions'),
    ]) as [
      { NodeSDK: new (o: Record<string, unknown>) => { start(): void; shutdown(): Promise<void> } },
      { getNodeAutoInstrumentations(o?: Record<string, unknown>): unknown[] },
      { OTLPTraceExporter: new (o?: Record<string, unknown>) => unknown },
      { Resource: new (o: Record<string, unknown>) => unknown },
      { SEMRESATTRS_SERVICE_NAME: string },
    ];

    const { NodeSDK } = sdkMod;
    const { getNodeAutoInstrumentations } = instrMod;
    const { OTLPTraceExporter } = exporterMod;
    const { Resource } = resourceMod;
    const { SEMRESATTRS_SERVICE_NAME } = semconvMod;

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
