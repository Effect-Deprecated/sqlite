import {Leva, useControls, levaStore, button, buttonGroup} from 'leva'
import * as React from 'react'
import initSqlJs, {Database} from 'sql.js'

import {Client, Schema} from '@effect/sqlite'
import {makeSqliteConnectionFromDb} from '@effect/sqlite/browser'

import {provideOtelTracer} from 'utils/dummy-tracer.js'
import type {OT} from 'utils/effect.js'
import {pipe, T} from 'utils/effect.js'

import 'app/store'

type Connection = {
  name: string
  type: `remote` | `local`
  url?: string
}

type Table = {
  name: string
}

type Row = Record<string, unknown>

type RefState = {
  db: Database
  client: Client.Client<string, Schema.Schema>
  schema: Schema.Schema
  connection: ReturnType<typeof makeSqliteConnectionFromDb>
  tables: Table[]
}

function noop() {}

export const Context = React.createContext<{
  cols: ReadonlyArray<Column>
  connections: ReadonlyArray<Connection>
  connectionSelected: string | null
  rows: ReadonlyArray<Record<string, unknown>>
  tables: ReadonlyArray<Table>
  tableSelected: string | null
  run: {
    open: (connectionName: string) => void
    tableOpen: (tableName: string) => void
  }
}>({
  cols: [],
  connections: [],
  connectionSelected: null,
  rows: [],
  tables: [],
  tableSelected: null,
  run: {
    open: noop,
    tableOpen: noop,
  },
})

function mockConnections(): Connection[] {
  return [
    {
      name: `main`,
      type: `remote`,
      url: `/1.sqlite`,
    },
  ]
}

export type Message = {
  type: `connection` | `table`
  value: string
}

export type Column = {
  cid: number
  name: string
  type: string
  notnull: number
  pk: number
  dflt_value: null
}

const reduceOptions = (list: (Connection | Table)[]) =>
  list.reduce<Record<string, string>>((r, v) => ((r[v.name] = v.name), r), {
    none: ``,
  })

export function Provider(props: {
  children: React.ReactNode
  onError?: (message: Message) => void
  onSuccess?: (message: Message) => void
}) {
  const ref = React.useRef<RefState | null>(null)
  const [connections, setConnections] =
    React.useState<Connection[]>(mockConnections)
  const [tables, setTables] = React.useState<Table[]>([])
  const [cols, setCols] = React.useState<Column[]>([])
  const [rows, setRows] = React.useState<Row[]>([])

  function open(connectionName: string) {
    const currentConnection = connections.find((v) => v.name === connectionName)

    if (currentConnection && currentConnection.url) {
      const url = new URL(currentConnection.url, document.location.origin)
      run(currentConnection.name, url)
        .then((refState) => {
          ref.current = refState
          setTables(refState.tables)
          props.onSuccess?.({
            type: `connection`,
            value: `open("${connectionName}")`,
          })
        })
        .catch((error: Error) =>
          props.onError?.({
            type: `connection`,
            value: `open | ${error.message}`,
          }),
        )
    }
  }

  const [connState, setConnState] = useControls(
    `connection`,
    () => ({
      current: {options: reduceOptions(connections), onChange: open},
      ' ': buttonGroup({
        refresh: (get) => open(get(`connection.current`)),
      }),
    }),
    [connections],
  )

  // FIX: bug with onChange in useControls infer wrong types
  const {current: connectionSelected} = connState as any

  function tableOpen(tableName: string) {
    if (tableName) {
      queryTable(ref.current, tableName)
        .then(({rows, cols}) => {
          setCols(cols)
          setRows(rows)
          props.onSuccess?.({type: `table`, value: `tableOpen("${tableName}")`})
        })
        .catch((error) =>
          props.onError?.({
            type: `connection`,
            value: `tableOpen | ${error.message}`,
          }),
        )
    }
  }

  const [tableState, setTableState] = useControls(
    `table`,
    () => ({
      current: {
        options: reduceOptions(tables),
        onChange: (_value, _name, {get}) => {
          tableOpen(get(`table.current`))
        },
      },
      ' ': buttonGroup({
        refresh: (get) => {
          tableOpen(get(`table.current`))
        },
      }),
    }),
    [tables],
  )

  // FIX: bug with onChange in useControls infer wrong types
  const {name: tableSelected} = tableState as any

  const [{position}, set] = useControls(`general`, () => ({
    position: {x: 0, y: 70},
  }))

  return (
    <Context.Provider
      value={{
        rows,
        cols,
        connections,
        connectionSelected,
        tables,
        tableSelected,
        run: {open, tableOpen},
      }}
    >
      {props.children}
      <Leva
        titleBar={{position, onDrag: (point: any) => set({position: point})}}
      />
    </Context.Provider>
  )
}

const plainQueryTables = `SELECT * FROM sqlite_schema WHERE type ='table' AND name NOT LIKE 'sqlite_%'`
const makeQueryTableCols = (tableName: string) =>
  `PRAGMA table_info(${tableName})`
const makeQueryTableAll = (tableName: string) => `SELECT * FROM ${tableName}`

async function run(name: string, url: URL) {
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
  const connection = makeSqliteConnectionFromDb(name, db)

  const tables = await executeRaw({client, connection}, plainQueryTables)

  return {
    db,
    client,
    schema,
    connection,
    tables,
  }
}

async function queryTable(
  params: {
    client: Client.Client<string, Schema.Schema>
    connection: ReturnType<typeof makeSqliteConnectionFromDb>
  } | null,
  tableName: string,
) {
  const cols = await executeRaw(params, makeQueryTableCols(tableName))
  const rows = await executeRaw(params, makeQueryTableAll(tableName))

  return {
    cols,
    rows,
  }
}

async function executeRaw(
  params: {
    client: Client.Client<string, Schema.Schema>
    connection: ReturnType<typeof makeSqliteConnectionFromDb>
  } | null,
  queryString: string,
) {
  const {connection, client} = params || {}
  if (connection && client) {
    return pipe(
      client.executeRaw(queryString),
      T.provideSomeLayer(connection),
      runMain,
    )
  }
  throw new Error(`Not connected`)
}

const runMain = <E, A>(eff: T.Effect<OT.HasTracer, E, A>): Promise<A> =>
  pipe(eff, provideOtelTracer(), T.runPromise)
