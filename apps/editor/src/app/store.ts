import {saveAs} from 'file-saver'
import {nanoid} from 'nanoid'
import createStore from 'zustand/vanilla'
import {subscribeWithSelector} from 'zustand/middleware'

import {queryTable, update, connect} from './api'
import type {
  Connection,
  Column,
  Table,
  Row,
  Message,
  SqliteDatabase,
  SqliteConnection,
  SqliteSchema,
  SqliteClient,
} from './types'

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

  viewJson: boolean
  viewSettings: boolean
  viewTable: boolean

  message: Message | null

  viewJsonSwitch: () => void
  viewSettingsEnable: () => void
  viewSettingsDisable: () => void
  viewTableSwitch: () => void

  createEmpty: () => void
  createFromFileList: (fileList: File[]) => void
  connect: (id: string, force?: boolean) => void
  copy: (id: string) => void
  reconnect: () => void
  remove: (id: string) => void
  update: (params: Partial<Connection> & {id: string}) => void
  download: () => void

  tableOpen: (tableName: string) => void
  tableClose: () => void
  tableRefresh: () => void
  tableUpdateRow: (rowIndex: number, values: Record<string, any>) => void
}

const getFileName = (name: string) => name.split(`.`)[0] || name

const neededFirstConn = (
  selectedConnection: string | null,
  connections: Connection[],
) => !selectedConnection && connections.length === 0

export const store = createStore(
  subscribeWithSelector<Store>((set, get) => ({
    db: null,
    client: null,
    schema: null,
    connectionLayer: null,

    connections: [],
    selectedConnection: null,

    tables: [],
    selectedTable: null,
    rows: [],
    cols: [],

    viewJson: false,
    viewSettings: false,
    viewTable: true,

    message: null,

    viewJsonSwitch: () => set((state) => ({viewJson: !state.viewJson})),

    viewSettingsEnable: () => set(() => ({viewSettings: true})),
    viewSettingsDisable: () => set(() => ({viewSettings: false})),

    viewTableSwitch: () => set((state) => ({viewTable: !state.viewTable})),

    createEmpty() {
      const {connections, selectedConnection, connect} = get()
      const id = nanoid()

      set(({connections}) => ({
        connections: connections.concat({
          id,
          name: `empty`,
          type: `empty`,
        }),
      }))

      if (neededFirstConn(selectedConnection, connections)) {
        connect(id)
      }
    },

    createFromFileList(fileList) {
      const {connections, selectedConnection, connect} = get()

      const newConnectionsList: Connection[] = fileList.map((file) => ({
        id: nanoid(),
        type: `local`,
        name: getFileName(file.name),
        file,
      }))

      set(({connections}) => ({
        connections: connections.concat(newConnectionsList),
      }))

      if (
        neededFirstConn(selectedConnection, connections) &&
        newConnectionsList[0]
      ) {
        connect(newConnectionsList[0].id)
      }
    },

    async connect(id, force = false) {
      const fnName = `connect`
      const {
        connections,
        tableOpen,
        tableClose,
        selectedTable,
        selectedConnection,
      } = get()
      const currentConnection = connections.find((v) => v.id === id)

      if (currentConnection) {
        const name = currentConnection.name

        const connInfo =
          alreadyConnected(currentConnection) && !force
            ? currentConnection
            : await connect(currentConnection)

        const {db, client, schema, connectionLayer, tables} = connInfo

        set({
          db,
          client,
          schema,
          connectionLayer,
          tables: tables as Table[],
          selectedConnection: id,
          message: successMessage(fnName, [name]),
          connections: connections.map((conn) =>
            conn.id === id
              ? {
                  ...currentConnection,
                  db,
                  client,
                  schema,
                  connectionLayer,
                  tables,
                }
              : conn,
          ),
        })

        if (selectedTable) {
          if (selectedConnection !== id) {
            if (tables) {
              const sameTableName = tables.find((v) => v.name === selectedTable)
              if (sameTableName) {
                tableOpen(selectedTable)
              } else if (tables[0]) {
                tableOpen(tables[0].name)
              } else {
                tableClose()
              }
            }
          } else {
            tableOpen(selectedTable)
          }
        } else {
          if (tables && tables[0]) {
            tableOpen(tables[0].name)
          }
        }
      } else {
        set(() => ({
          message: errorMessage(fnName, [id], `No such connection`),
        }))
      }
    },

    reconnect() {
      const {connect, selectedConnection} = get()
      if (selectedConnection) {
        connect(selectedConnection, true)
      }
    },

    download() {
      const {db, connections, selectedConnection} = get()
      const currentConn = connections.find((v) => v.id === selectedConnection)
      if (currentConn && db) {
        const blob = new Blob([db.export()], {type: `application/vnd.sqlite3`})
        saveAs(blob, `${currentConn.name}.sqlite`)
      }
    },

    copy(id: string) {
      const {connections} = get()
      const currentConn = connections.find((v) => v.id === id)
      if (currentConn) {
        set(() => ({
          connections: connections.concat({
            ...currentConn,
            db: undefined,
            client: undefined,
            schema: undefined,
            connectionLayer: undefined,
            tables: undefined,
            id: nanoid(),
          }),
        }))
      }
    },

    update(params) {
      set(({connections}) => ({
        connections: connections.map((conn) =>
          conn.id === params.id ? Object.assign(conn, params) : conn,
        ),
      }))
    },

    remove(id: string) {
      set(({connections}) => ({
        connections: connections.filter((conn) => conn.id !== id),
      }))
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

function alreadyConnected(conn: Connection) {
  return Boolean(
    conn.db &&
      conn.client &&
      conn.connectionLayer &&
      conn.schema &&
      conn.tables,
  )
}

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

const getPrimaryKeys = (cols: Column[]) =>
  cols.filter((v) => v.pk).map((v) => v.name)
