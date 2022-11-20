import {Client, Schema} from '@effect/sqlite'
import type {Database} from 'sql.js'
import {makeSqliteConnectionFromDb} from '@effect/sqlite/browser'

export type SqliteConnection = ReturnType<typeof makeSqliteConnectionFromDb>
export type SqliteClient = Client.Client<string, Schema.Schema>
export type SqliteDatabase = Database
export type SqliteSchema = Schema.Schema

export type Connection = {
  id: string
  name: string
  type: `remote` | `local` | `empty`
  url?: string
  file?: File
  db?: SqliteDatabase
  client?: SqliteClient
  schema?: SqliteSchema
  connectionLayer?: SqliteConnection
  tables?: Table[]
}

export type Table = {
  name: string
}

export type Row = Record<string, unknown>

export type Column = {
  cid: number
  name: string
  type: string
  notnull: number
  pk: number
  dflt_value: null
}

export type MessageType = `error` | `success`

export type Message = {
  type: MessageType
  value: string
}
