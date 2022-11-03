export type Connection = {
  name: string
  type: `remote` | `local`
  url?: string
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
