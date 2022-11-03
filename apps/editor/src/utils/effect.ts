export * as OT from '@effect-ts/otel'

export { pipe, flow, identity, not } from '@effect-ts/core/Function'
export { Tagged, Case } from '@effect-ts/core/Case'
export { tag, service, mergeEnvironments } from '@effect-ts/core/Has'
export type { Has, Tag } from '@effect-ts/core/Has'
export { pretty } from '@effect-ts/core/Effect/Cause'
export { matchTag_, matchTag, intersect } from '@effect-ts/core/Utils'

export * as Branded from '@effect-ts/core/Branded'

export * as Effect from '@effect-ts/core/Effect'
export * as T from '@effect-ts/core/Effect'
export * as O from '@effect-ts/core/Option'
export * as L from '@effect-ts/core/Effect/Layer'
export * as M from '@effect-ts/core/Effect/Managed'
export * as ImmArray from './ImmArray.js'
