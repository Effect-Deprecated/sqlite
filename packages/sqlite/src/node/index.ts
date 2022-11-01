import { identity, L, M, OT, pipe, T } from '../utils/effect.js'
import { Mutex } from 'async-mutex'
// NOTE `sqlite3` is still a CJS module
import Sqlite from 'sqlite3'

import * as Connection from '../connection.js'

export const makeSqliteConnection = <TDBName extends string>(dbName: TDBName, sqliteFilePath: string) =>
  L.fromManaged(Connection.makeTag(dbName))(
    pipe(
      makeClientManaged(sqliteFilePath),
      M.mapM((db) => T.succeed(getConnection(dbName, db))),
    ),
  )

const openDb = (sqliteFilePath: string) =>
  pipe(
    T.effectAsync<unknown, Connection.SqlClientError, Sqlite.Database>((cb) => {
      Sqlite.verbose()

      const db = new Sqlite.Database(sqliteFilePath, (error) => {
        if (error) {
          cb(T.fail(Connection.makeError({ error })))
        } else {
          cb(T.succeed(db))
        }
      })
    }),
    OT.withSpan('sql-client:openDb', { attributes: { sqliteFilePath } }),
  )

const closeDb = (db: Sqlite.Database) =>
  pipe(
    T.effectAsync<unknown, never, void>((cb) => {
      db.close((error) => {
        if (error) {
          cb(T.die(Connection.makeError({ error })))
        } else {
          cb(T.succeed(void 0))
        }
      })
    }),
    OT.withSpan('sql-client:closeDb'),
  )

const makeClientManaged = (sqliteFilePath: string) => pipe(openDb(sqliteFilePath), M.make(closeDb))

const getConnection = <TDBName extends string>(dbName: TDBName, db: Sqlite.Database) => {
  const execute = <TRet>(query: string, bindValues: Connection.BindValues) =>
    pipe(
      T.effectAsync<unknown, Connection.SqlClientError, TRet[]>((cb) => {
        const params = pipe(
          Object.entries(bindValues).map(([columnName, value]) => [`$${columnName}`, value]),
          Object.fromEntries,
        )

        db.all(query, params, (error, rows) => {
          if (error) {
            cb(T.fail(Connection.makeError({ error, query, bindValues })))
          } else {
            cb(T.succeed(rows as TRet[]))
          }
        })
      }),
      T.retryWhile((e) => e.error.code === 'SQLITE_BUSY'),
      T.tap((rows) => OT.addAttribute('rowsCount', rows.length)),
      OT.withSpan('sql-client:execute', {
        attributes: { 'sql.query': query, 'sql.bindValues': Connection.bindValuesToLogString(bindValues) },
      }),
    )

  const exportDb = T.die(new Error('exportDb not implemented for Node client'))

  const txnMutex = new Mutex()

  return identity<Connection.Connection<TDBName>>({ dbName, execute, exportDb, txnMutex })
}
