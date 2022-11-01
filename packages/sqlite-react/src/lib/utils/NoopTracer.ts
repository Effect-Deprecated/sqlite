/* eslint-disable prefer-arrow/prefer-arrow-functions */
import type * as otel from '@opentelemetry/api'

const noopSpan = {
  setAttribute: () => null,
  setAttributes: () => null,
  addEvent: () => null,
  setStatus: () => null,
  updateName: () => null,
  recordException: () => null,
  end: () => null,
  spanContext: () => {
    return { traceId: 'noop-trace-id', spanId: 'noop-span-id' }
  },
} as unknown as otel.Span

export const makeNoopTracer = () => {
  return new NoopTracer() as unknown as otel.Tracer
}

export class NoopTracer {
  startSpan = () => noopSpan

  startActiveSpan<F extends (span: otel.Span) => ReturnType<F>>(name: string, fn: F): ReturnType<F>
  startActiveSpan<F extends (span: otel.Span) => ReturnType<F>>(
    name: string,
    opts: otel.SpanOptions,
    fn: F,
  ): ReturnType<F>
  startActiveSpan<F extends (span: otel.Span) => ReturnType<F>>(
    name: string,
    opts: otel.SpanOptions,
    ctx: otel.Context,
    fn: F,
  ): ReturnType<F>
  startActiveSpan<F extends (span: otel.Span) => ReturnType<F>>(
    name: string,
    arg2?: F | otel.SpanOptions,
    arg3?: F | otel.Context,
    arg4?: F,
  ): ReturnType<F> | undefined {
    let _opts: otel.SpanOptions | undefined
    let _ctx: otel.Context | undefined
    let fn: F

    if (arguments.length < 2) {
      return
    } else if (arguments.length === 2) {
      fn = arg2 as F
    } else if (arguments.length === 3) {
      _opts = arg2 as otel.SpanOptions | undefined
      fn = arg3 as F
    } else {
      _opts = arg2 as otel.SpanOptions | undefined
      _ctx = arg3 as otel.Context | undefined
      fn = arg4 as F
    }

    return fn(noopSpan)
  }
}
