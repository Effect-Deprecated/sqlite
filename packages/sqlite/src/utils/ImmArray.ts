import { Array as A, pipe } from '@effect-ts/core'

import * as O from './Option.js'

export * from '@effect-ts/core/Collections/Immutable/Array'

export const headUnsafe = <A>(array: A.Array<A>): A => pipe(array, A.head, O.getUnsafe)

export const lastUnsafe = <A>(array: A.Array<A>): A => pipe(array, A.last, O.getUnsafe)

export const isArray = Array.isArray
