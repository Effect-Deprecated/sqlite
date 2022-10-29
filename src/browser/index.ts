import { identity, L, M, OT, pipe, T } from '../utils/effect.js'
import { Mutex } from 'async-mutex'
import type * as SqliteWasm from 'sql.js'
import initSqlJs from 'sql.js'

import * as Connection from '../connection.js'

export type DbOptions = {
  initialData?: Uint8Array
  locateFile?: () => string
}

export const makeSqliteConnection = <TDBName extends string>(dbName: TDBName, options: DbOptions) =>
  L.fromManaged(Connection.makeTag(dbName))(
    pipe(
      makeClientManaged(options),
      M.mapM((db) => T.succeed(getConnection(dbName, db))),
    ),
  )

export const makeSqliteConnectionFromDb = <TDBName extends string>(dbName: TDBName, db: SqliteWasm.Database) =>
  L.fromEffect(Connection.makeTag(dbName))(T.succeed(getConnection(dbName, db)))

const openDb = (options: DbOptions) =>
  pipe(
    T.tryPromise(() =>
      initSqlJs({
        // Required to load the wasm binary asynchronously. Of course, you can host it wherever you want
        // You can omit locateFile completely when running in node
        locateFile: options.locateFile ?? (() => `/sql-wasm.wasm`),
      }),
    ),
    T.map((_) => new _.Database(options.initialData)),
    T.orDie,
    OT.withSpan('sql-client:openDb', { attributes: {} }),
  )

const closeDb = (db: SqliteWasm.Database) =>
  pipe(
    T.succeedWith(() => db.close()),
    OT.withSpan('sql-client:closeDb'),
  )

const makeClientManaged = (options: DbOptions) => pipe(openDb(options), M.make(closeDb))

export const getConnection = <TDBName extends string>(dbName: TDBName, db: SqliteWasm.Database) => {
  const execute = <TRet>(query: string, bindValues: Connection.BindValues) =>
    pipe(
      T.tryCatch(
        () => {
          const params = pipe(
            Object.entries(bindValues).map(([columnName, value]) => [`$${columnName}`, value]),
            Object.fromEntries,
          )

          const stmt = db.prepare(query, params)
          const result: TRet[] = []

          while (stmt.step()) {
            result.push(stmt.getAsObject() as unknown as TRet)
          }

          return result
        },
        (error) => Connection.makeError({ error, query, bindValues }),
      ),
      T.retryWhile((e) => e.error.code === 'SQLITE_BUSY'),
      T.tap((rows) => OT.addAttribute('rowsCount', rows.length)),
      OT.withSpan('sql-client:execute', {
        attributes: { 'sql.query': query, 'sql.bindValues': Connection.bindValuesToLogString(bindValues) },
      }),
    )

  const exportDb = T.tryCatch(
    () => db.export(),
    (error) => Connection.makeError({ error }),
  )

  const txnMutex = new Mutex()

  return identity<Connection.Connection<TDBName>>({ dbName, execute, exportDb, txnMutex })
}
