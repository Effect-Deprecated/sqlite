import * as React from 'react'
import type {Database} from 'sql.js'
import {Client, Schema} from '@effect/sqlite'
import {makeSqliteConnectionFromDb} from '@effect/sqlite/browser'

import {provideOtelTracer} from '../utils/dummy-tracer.js'
import type {OT} from '../utils/effect.js'
import {pipe, T} from '../utils/effect.js'

export function useQuery(params: {
  name: string
  db: Database | null
  status: 'loading' | 'ready'
  client: Client.Client<string, Schema.Schema>
  queryString: string
}) {
  const {name, db, status, client, queryString} = params
  const [rows, setRows] = React.useState<unknown[]>([])

  React.useEffect(() => {
    if (status === 'ready' && db) {
      pipe(
        client.executeRaw(queryString),
        T.provideSomeLayer(makeSqliteConnectionFromDb(name, db)),
        runMain,
      )
        .then(setRows)
        .catch(console.log)
    }
  }, [db, status])

  return {rows}
}

const runMain = <E, A>(eff: T.Effect<OT.HasTracer, E, A>): Promise<A> =>
  pipe(eff, provideOtelTracer(), T.runPromise)
