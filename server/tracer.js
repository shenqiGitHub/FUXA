const opentelemetry = require('@opentelemetry/api');
const { Resource } = require('@opentelemetry/resources');
const {
    SEMRESATTRS_SERVICE_NAME,
    SEMRESATTRS_SERVICE_VERSION,
} = require('@opentelemetry/semantic-conventions');
const { WebTracerProvider } = require('@opentelemetry/sdk-trace-web');
const {
    ConsoleSpanExporter,
    BatchSpanProcessor,
} = require('@opentelemetry/sdk-trace-base');

const resource = Resource.default().merge(
    new Resource({
        [SEMRESATTRS_SERVICE_NAME]: 'service-name-here',
        [SEMRESATTRS_SERVICE_VERSION]: '0.1.0',
    }),
);

const provider = new WebTracerProvider({
    resource: resource,
});
const exporter = new ConsoleSpanExporter();
const processor = new BatchSpanProcessor(exporter);
provider.addSpanProcessor(processor);

// provider.register();
