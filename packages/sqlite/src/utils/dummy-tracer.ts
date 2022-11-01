// import type * as otelMetrics from '@opentelemetry/api-metrics'

import { NoopTracer } from './NoopTracer.js'
import { L, OT, T } from './effect.js'

//
// Dummy Tracer
//

const DummyTracing = () =>
  OT.Tracer.has({
    [OT.TracerSymbol]: OT.TracerSymbol,
    tracer: new NoopTracer(),
  } as any)

export const DummyTracingLive = L.fromRawFunction(() => DummyTracing())

export const provideOtelTracer = () => T.provide(DummyTracing())

// const NoopMeter = () =>
//   ({
//     createHistogram: () => ({ record: () => {} }),
//     createCounter: () => ({ add: () => {} }),
//     createUpDownCounter: () => ({ add: () => {} }),
//   } as unknown as otelMetrics.Meter)

// const DummyMeter = () =>
//   OT.Meter.has({
//     [OT.MeterSymbol]: OT.MeterSymbol,
//     meter: NoopMeter(),
//   })

// export const DummyMeterLive = L.fromRawFunction(() => DummyMeter())

// export const provideOtelMeter = () => T.provide(DummyMeter())
