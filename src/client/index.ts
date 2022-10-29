import type { Has, O } from '../utils/effect.js'
import { ImmArray, OT, pipe, T, tag } from '../utils/effect.js'

import * as Connection from '../connection.js'
import { objectEntries, sql } from '../misc.js'
import type * as Schema from '../schema.js'
import * as SqlQueries from './sql-queries.js'
import type * as ClientTypes from './types.js'

export * from './types.js'

export const makeTag = <TDBName extends string, TSchema extends Schema.Schema>(dbName: TDBName) =>
  tag<Client<TDBName, TSchema>>(Symbol.for(`@myapp/sql-client/client/${dbName}`))

export class Client<TDBName extends string, TSchema extends Schema.Schema> {
  constructor(readonly dbName: TDBName, readonly schema: TSchema) {}

  findMany = <TTableName extends keyof TSchema['tables'] & string>(
    tableName: TTableName,
    where: ClientTypes.WhereValuesForTable<TSchema, TTableName>,
    limit?: number,
  ): T.Effect<
    OT.HasTracer & Has<Connection.Connection<TDBName>>,
    Connection.SqlClientError,
    ImmArray.Array<ClientTypes.DecodedValuesForTableOrNull<TSchema, TTableName>>
  > =>
    pipe(
      this.executeRaw<ClientTypes.EncodedValuesForTable<TSchema, TTableName>>(
        ...SqlQueries.findManyRows({ columns: this.schema.tables[tableName]!.columns, tableName, where, limit }),
      ),
      T.map(ImmArray.map((_) => decodeRow(this.schema, tableName, _))),
    )

  find = <TTableName extends keyof TSchema['tables'] & string>(
    tableName: TTableName,
    where: ClientTypes.WhereValuesForTable<TSchema, TTableName>,
  ): T.Effect<
    OT.HasTracer & Has<Connection.Connection<TDBName>>,
    Connection.SqlClientError,
    O.Option<ClientTypes.DecodedValuesForTableOrNull<TSchema, TTableName>>
  > => pipe(this.findMany<TTableName>(tableName, where, 1), T.map(ImmArray.head))

  exists = <TTableName extends keyof TSchema['tables'] & string>(
    tableName: TTableName,
    where: ClientTypes.WhereValuesForTable<TSchema, TTableName>,
  ) =>
    pipe(
      // eslint-disable-next-line unicorn/no-array-method-this-argument
      this.find(tableName, where),
      T.map((_) => _._tag === 'Some'),
    )

  count = <TTableName extends keyof TSchema['tables'] & string>(
    tableName: TTableName,
    where: ClientTypes.WhereValuesForTable<TSchema, TTableName>,
  ) =>
    pipe(
      this.executeRaw<{ count: number }>(
        ...SqlQueries.countRows({ columns: this.schema.tables[tableName]!.columns, tableName, where }),
      ),
      T.map(ImmArray.headUnsafe),
      T.map((_) => _.count),
    )

  create = <TTableName extends keyof TSchema['tables'] & string>(
    tableName: TTableName,
    values: ClientTypes.DecodedValuesForTablePretty<TSchema, TTableName>,
    options?: { orReplace: boolean },
  ) =>
    this.executeRaw<void>(
      ...SqlQueries.insertRow({
        tableName,
        values,
        columns: this.schema.tables[tableName]!.columns,
        options: options ?? { orReplace: false },
      }),
    )

  createMany = <TTableName extends keyof TSchema['tables'] & string>(
    tableName: TTableName,
    valuesArray: ClientTypes.DecodedValuesForTablePretty<TSchema, TTableName>[],
  ) =>
    pipe(
      getValuesChunks(valuesArray),
      T.forEach((valuesChunk) =>
        this.executeRaw<void>(
          ...SqlQueries.insertRows({
            columns: this.schema.tables[tableName]!.columns,
            tableName,
            valuesArray: valuesChunk,
          }),
        ),
      ),
    )

  createOrIgnore = <TTableName extends keyof TSchema['tables'] & string>(
    tableName: TTableName,
    values: ClientTypes.DecodedValuesForTablePretty<TSchema, TTableName>,
  ) =>
    this.executeRaw<void>(
      ...SqlQueries.insertOrIgnoreRow({ columns: this.schema.tables[tableName]!.columns, tableName, values }),
    )

  update = <TTableName extends keyof TSchema['tables'] & string>(
    tableName: TTableName,
    {
      values,
      where,
    }: {
      values: Partial<ClientTypes.DecodedValuesForTableAll<TSchema, TTableName>>
      where: ClientTypes.WhereValuesForTable<TSchema, TTableName>
    },
  ) =>
    this.executeRaw<void>(
      ...SqlQueries.updateRows({
        columns: this.schema.tables[tableName]!.columns,
        tableName,
        updateValues: values,
        where,
      }),
    )

  upsert = <TTableName extends keyof TSchema['tables'] & string>(
    tableName: TTableName,
    {
      create,
      update,
      where,
    }: {
      create: ClientTypes.DecodedValuesForTable<TSchema, TTableName>
      update: Partial<ClientTypes.DecodedValuesForTableAll<TSchema, TTableName>>
      where: ClientTypes.WhereValuesForTable<TSchema, TTableName>
    },
  ) =>
    this.executeRaw<void>(
      ...SqlQueries.upsertRow({
        tableName,
        columns: this.schema.tables[tableName]!.columns,
        createValues: create as TODO, // TODO investigate why types don't match
        updateValues: update,
        where,
      }),
    )

  transaction = <R, E, A>(effect: T.Effect<R & Has<Connection.Connection<TDBName>>, E, A>) => {
    // TODO: we use a mutex library to ensure transactions don't overlap;
    // in the future find an effect-native way to do this
    return T.bracketExit_(
      pipe(
        T.accessServiceM(Connection.makeTag('app-db'))((connection) =>
          T.tryPromise(() => connection.txnMutex.acquire()),
        ),
        T.tap(() => this.executeRaw(sql`BEGIN TRANSACTION`)),
      ),
      () => effect,
      (release, ex) =>
        pipe(
          ex._tag === 'Failure' ? this.executeRaw(sql`ROLLBACK`) : this.executeRaw(sql`COMMIT`),
          T.zipRight(T.succeedWith(() => release())),
        ),
    )
  }

  executeRaw = <TRes>(sqlStr: string, bindValues: Connection.BindValues = {}) =>
    T.accessServiceM(Connection.makeTag(this.dbName))((connection) => connection.execute<TRes>(sqlStr, bindValues))

  decodeRow = <TTableName extends keyof TSchema['tables'] & string>(
    tableName: TTableName,
    row: ClientTypes.EncodedValuesForTable<TSchema, TTableName>,
  ) => decodeRow(this.schema, tableName, row)

  migrateIfNeeded = () => {
    // eslint-disable-next-line
    const self = this

    return pipe(
      T.gen(function* ($) {
        const existingTables = yield* $(
          self.executeRaw<{ name: string }>(sql`SELECT name FROM sqlite_master WHERE type='table'`),
        )

        if (existingTables.length === Object.keys(self.schema.tables).length) return

        if (existingTables.length > 0) {
          const dropAllTablesStr = existingTables.map(({ name: tableName }) => sql`DROP TABLE ${tableName}`).join('; ')
          yield* $(self.executeRaw(dropAllTablesStr))
        }

        const createAllTableStrs = Object.keys(self.schema.tables).map((tableName) =>
          SqlQueries.createTable({ table: self.schema.tables[tableName]!, tableName }),
        )

        yield* $(T.forEach_(createAllTableStrs, (str) => self.executeRaw(str)))
      }),
      OT.withSpan('migrateIfNeeded'),
    )
  }
}

const decodeRow = <TSchema extends Schema.Schema, TTableName extends keyof TSchema['tables'] & string>(
  schema: TSchema,
  tableName: TTableName,
  row: ClientTypes.EncodedValuesForTable<TSchema, TTableName>,
): ClientTypes.DecodedValuesForTableOrNull<TSchema, TTableName> => {
  const columns = schema.tables[tableName]!.columns
  const codecMap = makeCodecMap(columns)

  return pipe(
    objectEntries(row),
    ImmArray.map(([columnName, value]) => [columnName, codecMap[columnName]!.decode(value)]),
    Object.fromEntries,
  )
}

const makeCodecMap = <TColumns extends Schema.Columns>(
  columns: TColumns,
): Record<keyof TColumns, Schema.Codec<any, any>> =>
  pipe(
    columns,
    objectEntries,
    ImmArray.map(([columnName, columnDef]) => [columnName, columnDef.type.codec]),
    Object.fromEntries,
  )

const getValuesChunks = <TColumns extends Schema.Columns>(
  values: ClientTypes.DecodedValuesForColumnsAll<TColumns>[],
): readonly ClientTypes.DecodedValuesForColumnsAll<TColumns>[][] => {
  const numberOfVariablesPerValue = Object.keys(values[0]!).length
  const totalVariablesCount = values.length * numberOfVariablesPerValue

  // https://www.sqlite.org/limits.html
  const SQLITE_MAX_VARIABLE_NUMBER = 999

  const numberOfChunks = Math.ceil(totalVariablesCount / SQLITE_MAX_VARIABLE_NUMBER)

  const numberOfValuesPerChunk = Math.ceil(values.length / numberOfChunks)

  return pipe(
    ImmArray.range(0, numberOfChunks - 1),
    ImmArray.map((chunkIndex) =>
      values.slice(chunkIndex * numberOfValuesPerChunk, (chunkIndex + 1) * numberOfValuesPerChunk),
    ),
  )
}
