import {saveAs} from 'file-saver'
import createStore from 'zustand/vanilla'
import {subscribeWithSelector} from 'zustand/middleware'

import {
  connect,
  queryTable,
  SqliteDatabase,
  SqliteConnection,
  SqliteSchema,
  SqliteClient,
  update,
} from './api'
import type {Connection, Column, Table, Row, Message} from './types'

type Store = {
  db: SqliteDatabase | null
  client: SqliteClient | null
  schema: SqliteSchema | null
  connectionLayer: SqliteConnection | null

  connections: Connection[]
  selectedConnection: string | null

  tables: Table[]
  selectedTable: string | null
  rows: Row[]
  cols: Column[]

  jsonView: boolean

  tableView: boolean

  message: Message | null

  jsonViewSwitch: () => void
  tableViewSwitch: () => void

  connect: (name: string) => void
  reconnect: () => void
  download: () => void

  tableOpen: (tableName: string) => void
  tableClose: () => void
  tableRefresh: () => void
  tableUpdateRow: (rowIndex: number, values: Record<string, any>) => void
}

const getBaseUrl = () => document.location.origin

export const store = createStore(
  subscribeWithSelector<Store>((set, get) => ({
    db: null,
    client: null,
    schema: null,
    connectionLayer: null,

    connections: mockConnections(),
    selectedConnection: null,

    tables: [],
    selectedTable: null,
    rows: [],
    cols: [],

    jsonView: false,
    tableView: true,

    message: null,

    jsonViewSwitch: () => set((state) => ({jsonView: !state.jsonView})),
    tableViewSwitch: () => set((state) => ({tableView: !state.tableView})),

    async connect(name) {
      const fnName = `connect`
      const {
        connections,
        tableOpen,
        tableClose,
        selectedTable,
        selectedConnection,
      } = get()
      const currentConnection = connections.find((v) => v.name === name)

      if (currentConnection && currentConnection.url) {
        const url = new URL(currentConnection.url, getBaseUrl())
        const {db, client, schema, connectionLayer, tables} = await connect(
          currentConnection.name,
          url,
        )
        set({
          db,
          client,
          schema,
          connectionLayer,
          tables: tables as Table[],
          selectedConnection: name,
          message: successMessage(fnName, [name]),
        })

        if (selectedTable) {
          if (selectedConnection !== name) {
            tableClose()
          } else {
            tableOpen(selectedTable)
          }
        }
      } else {
        set(() => ({
          message: errorMessage(fnName, [name], `No such connection`),
        }))
      }
    },

    reconnect() {
      const {connect, selectedConnection} = get()
      if (selectedConnection) {
        connect(selectedConnection)
      }
    },

    download() {
      const {db} = get()
      if (db) {
        const blob = new Blob([db.export()], {type: `application/vnd.sqlite3`})
        saveAs(blob, `db.sqlite`)
      }
    },

    async tableOpen(tableName: string) {
      const fnName = `chooseTable`

      try {
        const {tables, client, connectionLayer} = get()
        const currentTable = tables.find((v) => v.name === tableName)

        if (currentTable && client && connectionLayer) {
          const {rows, cols} = await queryTable(
            client,
            connectionLayer,
            tableName,
          )
          set(() => ({
            selectedTable: tableName,
            rows: rows as Row[],
            cols: cols as Column[],
            message: successMessage(fnName, [tableName]),
          }))
        } else {
          set(() => ({
            message: errorMessage(fnName, [tableName], ``),
          }))
        }
      } catch (error: any) {
        set(() => ({
          message: errorMessage(fnName, [tableName], error?.message),
        }))
      }
    },

    async tableUpdateRow(rowIndex, values) {
      const {rows, cols, client, connectionLayer, selectedTable} = get()
      const pks = getPrimaryKeys(cols)
      const row = rows[rowIndex]
      if (client && connectionLayer && selectedTable && row) {
        const where = pks.reduce<Record<string, any>>(
          (r, key) => ((r[key] = row[key]), r),
          {},
        )

        await update(client, connectionLayer, selectedTable, {
          where,
          values,
        })

        set({
          rows: rows.map((v, index) =>
            rowIndex === index ? Object.assign(v, values) : v,
          ),
        })
      }
    },

    tableRefresh() {
      const {connect, selectedConnection} = get()
      if (selectedConnection) {
        connect(selectedConnection)
      }
    },

    tableClose() {
      set({
        selectedTable: null,
        cols: [],
        rows: [],
      })
    },
  })),
)

const successMessage = (
  label: string,
  args: unknown[],
  result?: string,
): Message => ({
  type: `success`,
  value: `${label}(${args.join(', ')})` + (result ? ` => ${result}` : ``),
})

const errorMessage = (
  label: string,
  args: string[],
  error: string = `unknown`,
): Message => ({
  type: `error`,
  value: `${label}(${args.join(', ')})` + (error ? ` => ${error}` : ``),
})

function mockConnections(): Connection[] {
  return [
    {
      name: `primary`,
      type: `remote`,
      url: `/1.sqlite`,
    },
    {
      name: `secondary`,
      type: `remote`,
      url: `/2.sqlite`,
    },
    {
      name: `downloaded`,
      type: `remote`,
      url: `/db.sqlite`,
    },
  ]
}

const getPrimaryKeys = (cols: Column[]) =>
  cols.filter((v) => v.pk).map((v) => v.name)
