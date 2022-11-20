import initSqlJs, {Database} from 'sql.js'

import {Client, Schema} from '@effect/sqlite'
import {makeSqliteConnectionFromDb} from '@effect/sqlite/browser'

import {provideOtelTracer} from 'utils/dummy-tracer.js'
import type {OT} from 'utils/effect.js'
import {pipe, T} from 'utils/effect.js'

import {Column, Connection, Table} from './types'

export type SqliteConnection = ReturnType<typeof makeSqliteConnectionFromDb>
export type SqliteClient = Client.Client<string, Schema.Schema>
export type SqliteDatabase = Database
export type SqliteSchema = Schema.Schema

const getBaseUrl = () => document.location.origin

const bufferFromFile = (file: File): Promise<ArrayBuffer> =>
  new Promise((rs, rj) => {
    const r = new FileReader()
    r.onload = function () {
      if (r.result instanceof ArrayBuffer) {
        rs(r.result)
      } else {
        rj(new Error(`Cannot return Uint8Array`))
      }
    }
    r.readAsArrayBuffer(file)
  })

export async function connectFile(
  name: string,
  file: File,
  schemaSource: Schema.Schema = {tables: {}},
) {
  const schema = Schema.defineSchema(schemaSource)
  const client = new Client.Client(name, schema)

  const sql = await initSqlJs({
    locateFile: () => `/sql-wasm.wasm`,
  })

  const buffer = await bufferFromFile(file)
  const db = new sql.Database(new Uint8Array(buffer))
  const connectionLayer = makeSqliteConnectionFromDb(name, db)

  const tables = await executeRaw(client, connectionLayer, plainQueryTables)

  const schemaExtractedSource = await extractSchema(
    client,
    connectionLayer,
    tables as Table[],
  )

  const schemaExtracted = Schema.defineSchema(schemaExtractedSource)

  return {
    db,
    client: new Client.Client(name, schemaExtracted),
    schema: schemaExtracted,
    connectionLayer,
    tables,
  }
}

export async function connectUrl(
  name: string,
  url: URL,
  schemaSource: Schema.Schema = {tables: {}},
) {
  const schema = Schema.defineSchema(schemaSource)
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

  const schemaExtractedSource = await extractSchema(
    client,
    connectionLayer,
    tables as Table[],
  )

  const schemaExtracted = Schema.defineSchema(schemaExtractedSource)

  return {
    db,
    client: new Client.Client(name, schemaExtracted),
    schema: schemaExtracted,
    connectionLayer,
    tables,
  }
}

export async function connect(conn: Connection) {
  if (conn.type === `remote` && conn.url) {
    const url = new URL(conn.url, getBaseUrl())
    return connectUrl(conn.name, url)
  }

  if (conn.type === `local` && conn.file) {
    return connectFile(conn.name, conn.file)
  }

  throw new Error(`Connection failed`)
}

async function extractSchema(
  client: Client.Client<string, Schema.Schema>,
  connectionLayer: ReturnType<typeof makeSqliteConnectionFromDb>,
  tables: Table[],
) {
  const tablesNames = tables.map((v) => v.name)
  const tablesList = await Promise.all(
    tablesNames.map(extractTableSchema(client, connectionLayer)),
  )

  return {tables: tablesList.reduce((r, v) => Object.assign(r, v), {})}
}

const getType = (rawType: string) => {
  const type = rawType.split(`(`)[0]
  switch (type) {
    case 'INTEGER':
      return Schema.integer()
    case 'JSON':
      return Schema.json()
    case 'BLOB':
      return Schema.blob()
    case 'real':
      return Schema.real()
    default:
      return Schema.text()
  }
}

const extractTableSchema =
  (
    client: Client.Client<string, Schema.Schema>,
    connectionLayer: ReturnType<typeof makeSqliteConnectionFromDb>,
  ) =>
  async (tableName: string) => {
    const cols = (await executeRaw(
      client,
      connectionLayer,
      makeQueryTableCols(tableName),
    )) as Column[]

    const columns = cols.reduce<Schema.Columns>((r, v) => {
      r[v.name] = Schema.column({
        type: getType(v.type) as any,
        primaryKey: Boolean(v.pk),
        nullable: !Boolean(v.notnull),
      })
      return r
    }, {})

    return {
      [tableName]: {columns},
    }
  }

const plainQueryTables = `SELECT * FROM sqlite_schema WHERE type ='table' AND name NOT LIKE 'sqlite_%'`
const makeQueryTableCols = (tableName: string) =>
  `PRAGMA table_info(${tableName})`
const makeQueryTableAll = (tableName: string) => `SELECT * FROM ${tableName}`

export async function queryTable(
  client: Client.Client<string, Schema.Schema>,
  connectionLayer: ReturnType<typeof makeSqliteConnectionFromDb>,
  tableName: string,
) {
  const cols = await executeRaw(
    client,
    connectionLayer,
    makeQueryTableCols(tableName),
  )
  const rows = await executeRaw(
    client,
    connectionLayer,
    makeQueryTableAll(tableName),
  )

  return {
    cols,
    rows,
  }
}

export async function update(
  client: Client.Client<string, Schema.Schema>,
  connectionLayer: ReturnType<typeof makeSqliteConnectionFromDb>,
  tableName: string,
  {
    values,
    where,
  }: {
    values: Record<string, unknown>
    where: Record<string, unknown>
  },
) {
  return pipe(
    client.update(tableName, {values, where}),
    T.provideSomeLayer(connectionLayer),
    runMain,
  )
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
