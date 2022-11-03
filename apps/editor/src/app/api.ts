import initSqlJs, {Database} from 'sql.js'

import {Client, Schema} from '@effect/sqlite'
import {makeSqliteConnectionFromDb} from '@effect/sqlite/browser'

import {provideOtelTracer} from 'utils/dummy-tracer.js'
import type {OT} from 'utils/effect.js'
import {pipe, T} from 'utils/effect.js'

export type SqliteConnection = ReturnType<typeof makeSqliteConnectionFromDb>
export type SqliteClient = Client.Client<string, Schema.Schema>
export type SqliteDatabase = Database
export type SqliteSchema = Schema.Schema

export async function connect(name: string, url: URL) {
  const schema = Schema.defineSchema({tables: {}})
  const client = new Client.Client(name, schema)

  const sql = await initSqlJs({
    locateFile: () => `/sql-wasm.wasm`,
  })

  const r = await fetch(url)

  if (!r.ok) {
    throw new Error(r.statusText)
  }

  const buffer = await r.arrayBuffer()
  const db = new sql.Database(new Uint8Array(buffer))
  const connectionLayer = makeSqliteConnectionFromDb(name, db)

  const tables = await executeRaw(client, connectionLayer, plainQueryTables)

  return {
    db,
    client,
    schema,
    connectionLayer,
    tables,
  }
}

const plainQueryTables = `SELECT * FROM sqlite_schema WHERE type ='table' AND name NOT LIKE 'sqlite_%'`
const makeQueryTableCols = (tableName: string) =>
  `PRAGMA table_info(${tableName})`
const makeQueryTableAll = (tableName: string) => `SELECT * FROM ${tableName}`

// async function run(name: string, url: URL) {
//   const schema = Schema.defineSchema({tables: {}})
//   const client = new Client.Client(name, schema)

//   const sql = await initSqlJs({
//     locateFile: () => `/sql-wasm.wasm`,
//   })

//   const r = await fetch(url)

//   if (!r.ok) {
//     throw new Error(r.statusText)
//   }

//   const buffer = await r.arrayBuffer()
//   const db = new sql.Database(new Uint8Array(buffer))
//   const connectionLayer = makeSqliteConnectionFromDb(name, db)

//   const tables = await executeRaw(client, connectionLayer, plainQueryTables)

//   return {
//     db,
//     client,
//     schema,
//     connectionLayer,
//     tables,
//   }
// }

export async function queryTable(
  client: Client.Client<string, Schema.Schema>,
  connection: ReturnType<typeof makeSqliteConnectionFromDb>,
  tableName: string,
) {
  const cols = await executeRaw(
    client,
    connection,
    makeQueryTableCols(tableName),
  )
  const rows = await executeRaw(
    client,
    connection,
    makeQueryTableAll(tableName),
  )

  return {
    cols,
    rows,
  }
}

async function executeRaw(
  client: Client.Client<string, Schema.Schema>,
  connectionLayer: ReturnType<typeof makeSqliteConnectionFromDb>,
  queryString: string,
) {
  return pipe(
    client.executeRaw(queryString),
    T.provideSomeLayer(connectionLayer),
    runMain,
  )
}

const runMain = <E, A>(eff: T.Effect<OT.HasTracer, E, A>): Promise<A> =>
  pipe(eff, provideOtelTracer(), T.runPromise)
