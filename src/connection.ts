import { errorToString } from './utils/index.js'
import type { OT, T } from './utils/effect.js'
import { tag, Tagged } from './utils/effect.js'
import type { Mutex } from 'async-mutex'

import { SqliteError } from './sqlite-error.js'

export type BindValues = {
  readonly [columnName: string]: any
}

export interface Connection<TDBName extends string> {
  dbName: TDBName

  execute<TRet = any>(query: string, bindValues: BindValues): T.Effect<OT.HasTracer, SqlClientError, TRet[]>

  exportDb: T.Effect<OT.HasTracer, SqlClientError, Uint8Array>

  /** A mutex that makes sure transcations on this connection don't overlap with each other  */
  txnMutex: Mutex
}

export const makeTag = <TDBName extends string>(dbName: TDBName) =>
  tag<Connection<TDBName>>(Symbol.for(`@myapp/sql-client/connection/${dbName}`))

export class SqlClientError extends Tagged('SqlClientError')<{
  readonly error: SqliteError.SqliteError
  readonly query?: string
  readonly bindValues?: BindValues
}> {
  toString = () =>
    `SqlClientError (${this.error.errno} ${this.error.code}): ${errorToString(this.error)}` +
    (this.query ? `\nSQL query:\n\n${this.query}` : '') +
    (this.bindValues ? `\Bind values:\n\n${bindValuesToLogString(this.bindValues)}` : '')
}

export const bindValuesToLogString = (bindValues: BindValues): string => {
  const MAX_ITEMS = 50
  const entries = Object.entries(bindValues)
  const skippedValueStr = entries.length > MAX_ITEMS ? ` (skipped ${entries.length - MAX_ITEMS} values)` : ''

  return (
    entries
      .slice(0, MAX_ITEMS)
      .map(([columnName, value]) => `${columnName}: ${truncateString(value.toString(), 200)}`)
      .join('\n') + skippedValueStr
  )
}

const truncateString = (str: string, maxLength: number) => {
  if (str.length <= maxLength) {
    return str
  }

  return str.slice(0, Math.max(0, maxLength - 3)) + '...'
}

export const makeError = ({
  error,
  query,
  bindValues,
}: {
  error: any
  query?: string
  bindValues?: BindValues
}): SqlClientError => {
  const isSqliteError = SqliteError.isSqliteError(error)
  if (!isSqliteError) {
    const genericError: SqliteError.SQLITE_ERROR = {
      code: 'SQLITE_ERROR',
      errno: 1,
      message: errorToString(error),
      name: 'Unknown error',
    }

    return new SqlClientError({ error: genericError, query, bindValues })
    // throw new Error(`makeError: error is not a SqliteError: ${errorToString(error)}`)
  }

  return new SqlClientError({ error, query, bindValues })
}
