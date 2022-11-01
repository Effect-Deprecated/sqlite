import * as React from 'react'
import initSqlJs, {Database} from 'sql.js'

import {Client, Schema} from '@effect/sqlite'

export function useDb(name: string, url: URL) {
  const schema = React.useMemo(makeLazySchema({tables: {}}), [])
  const client = React.useMemo(makeLazyClient(name, schema), [name, schema])
  const [status, setStatus] = React.useState<'loading' | 'ready'>('loading')
  const db = React.useRef<Database | null>(null)

  React.useEffect(() => {
    run(name, url, client)
      .then((database) => {
        db.current = database
        setStatus('ready')
      })
      .catch(console.warn)
  }, [])

  return {name, status, db: db.current, client}
}

async function run(name: string, url: URL, client: Client.Client<string, Schema.Schema>) {
  const sql = await initSqlJs({
    locateFile: () => `/sql-wasm.wasm`,
  })

  const buffer = await fetch(url).then((res) => res.arrayBuffer())
  return new sql.Database(new Uint8Array(buffer))
}

const makeLazySchema = (schema: Schema.Schema) => () => Schema.defineSchema(schema)
const makeLazyClient = (name: string, schema: Schema.Schema) => () =>
  new Client.Client(name, schema)
