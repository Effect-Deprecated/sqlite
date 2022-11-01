import {identity, L, T} from '../utils/effect.js'
import {Mutex} from 'async-mutex'

import * as Connection from '../connection.js'

export const makeTestConnection = <TDBName extends string>(
  dbName: TDBName,
  sqlQueries: [string, Connection.BindValues][],
) => L.fromEffect(Connection.makeTag(dbName))(T.succeed(getConnection(dbName, sqlQueries)))

const getConnection = <TDBName extends string>(
  dbName: TDBName,
  sqlQueries: [string, Connection.BindValues][],
) => {
  const execute = <TRet>(query: string, bindValues: Connection.BindValues) =>
    T.succeedWith(() => {
      sqlQueries.push([query, bindValues])
      return [] as TRet[]
    })

  const exportDb = T.succeedWith(() => new Uint8Array(0))

  const txnMutex = new Mutex()

  return identity<Connection.Connection<TDBName>>({execute, dbName, exportDb, txnMutex})
}
