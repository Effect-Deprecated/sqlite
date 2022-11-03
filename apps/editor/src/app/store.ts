import createStore from 'zustand/vanilla'

import {
  connect,
  queryTable,
  SqliteDatabase,
  SqliteConnection,
  SqliteSchema,
  SqliteClient,
} from './api'
import type {Connection, Column, Table, Row, Message} from './types'
import {subscribeWithSelector} from 'zustand/middleware'

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

  message: Message | null

  connect: (name: string) => void
  reconnect: () => void

  tableOpen: (tableName: string) => void
  tableRefresh: () => void
}

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

    message: null,

    connect: async (name) => {
      const fnName = `connect`
      const {connections, tableOpen, selectedTable} = get()
      const currentConnection = connections.find((v) => v.name === name)

      if (currentConnection && currentConnection.url) {
        const url = new URL(currentConnection.url, document.location.origin)
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
          tableOpen(selectedTable)
        }
      } else {
        set(() => ({
          message: errorMessage(fnName, [name], `No such connection`),
        }))
      }
    },

    reconnect: () => {
      const {connect, selectedConnection} = get()
      if (selectedConnection) {
        connect(selectedConnection)
      }
    },

    tableOpen: async (tableName: string) => {
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

    tableRefresh() {
      const {connect, selectedConnection} = get()
      if (selectedConnection) {
        connect(selectedConnection)
      }
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
      url: `/1.sqlite`,
    },
  ]
}
