import { ImmArray, pipe } from '../utils/effect.js'

import type { BindValues } from '../connection.js'
import { objectEntries, sql } from '../misc.js'
import type * as Schema from '../schema.js'
import * as ClientTypes from './types.js'

export const findManyRows = <TColumns extends Schema.Columns>({
  columns,
  tableName,
  where,
  limit,
}: {
  tableName: string
  columns: TColumns
  where: ClientTypes.WhereValuesForColumns<TColumns>
  limit?: number
}): [string, BindValues] => {
  const whereSql = buildWhereSql({ where })
  const whereModifier = whereSql !== '' ? `WHERE ${whereSql}` : ''
  const limitModifier = limit ? `LIMIT ${limit}` : ''

  const whereBindValues = makeBindValues({ columns, values: where, variablePrefix: 'where_', skipNil: true })

  return [sql`SELECT * FROM ${tableName} ${whereModifier} ${limitModifier}`, whereBindValues]
}

export const countRows = <TColumns extends Schema.Columns>({
  columns,
  tableName,
  where,
}: {
  tableName: string
  columns: TColumns
  where: ClientTypes.WhereValuesForColumns<TColumns>
}): [string, BindValues] => {
  const whereSql = buildWhereSql({ where })
  const whereModifier = whereSql !== '' ? `WHERE ${whereSql}` : ''

  const whereBindValues = makeBindValues({ columns, values: where, variablePrefix: 'where_', skipNil: true })

  return [sql`SELECT count(1) FROM ${tableName} ${whereModifier}`, whereBindValues]
}

export const insertRow = <TColumns extends Schema.Columns>({
  tableName,
  columns,
  values,
  options = { orReplace: false },
}: {
  tableName: string
  columns: TColumns
  values: ClientTypes.DecodedValuesForColumnsAll<TColumns>
  options: { orReplace: boolean }
}): [string, BindValues] => {
  const keysStr = Object.keys(values).join(', ')
  const valuesStr = Object.keys(values)
    .map((_) => `$${_}`)
    .join(', ')

  return [
    sql`INSERT ${options.orReplace ? 'OR REPLACE' : ''} INTO ${tableName} (${keysStr}) VALUES (${valuesStr})`,
    makeBindValues({ columns, values }),
  ]
}

export const insertRows = <TColumns extends Schema.Columns>({
  columns,
  tableName,
  valuesArray,
}: {
  tableName: string
  columns: TColumns
  valuesArray: ClientTypes.DecodedValuesForColumnsAll<TColumns>[]
}): [string, BindValues] => {
  const keysStr = Object.keys(valuesArray[0]!).join(', ')

  // NOTE consider batching for large arrays (https://sqlite.org/forum/info/f832398c19d30a4a)
  const valuesStrs = valuesArray
    .map((values, itemIndex) =>
      Object.keys(values)
        .map((_) => `$item_${itemIndex}_${_}`)
        .join(', '),
    )
    .map((_) => `(${_})`)
    .join(', ')

  const bindValues = valuesArray.reduce(
    (acc, values, itemIndex) => ({
      ...acc,
      ...makeBindValues({ columns, values, variablePrefix: `item_${itemIndex}_` }),
    }),
    {},
  )

  return [sql`INSERT INTO ${tableName} (${keysStr}) VALUES ${valuesStrs}`, bindValues]
}

export const insertOrIgnoreRow = <TColumns extends Schema.Columns>({
  columns,
  tableName,
  values,
}: {
  tableName: string
  columns: TColumns
  values: ClientTypes.DecodedValuesForColumns<TColumns>
}): [string, BindValues] => {
  const keysStr = Object.keys(values).join(', ')
  const valuesStr = Object.keys(values)
    .map((_) => `$${_}`)
    .join(', ')

  const bindValues = makeBindValues({ columns, values })

  return [sql`INSERT OR IGNORE INTO ${tableName} (${keysStr}) VALUES (${valuesStr})`, bindValues]
}

export const updateRows = <TColumns extends Schema.Columns>({
  columns,
  tableName,
  updateValues,
  where,
}: {
  columns: TColumns
  tableName: string
  updateValues: Partial<ClientTypes.DecodedValuesForColumnsAll<TColumns>>
  where: ClientTypes.WhereValuesForColumns<TColumns>
}): [string, BindValues] => {
  const updateValueStr = Object.keys(updateValues)
    .map((columnName) => `${columnName} = $update_${columnName}`)
    .join(', ')

  const bindValues = {
    ...makeBindValues({ columns, values: updateValues, variablePrefix: 'update_' }),
    ...makeBindValues({ columns, values: where, variablePrefix: 'where_', skipNil: true }),
  }

  const whereSql = buildWhereSql({ where })
  const whereModifier = whereSql !== '' ? `WHERE ${whereSql}` : ''

  return [sql`UPDATE ${tableName} SET ${updateValueStr} ${whereModifier}`, bindValues]
}

export const upsertRow = <TColumns extends Schema.Columns>({
  tableName,
  columns,
  createValues,
  updateValues,
  where,
}: {
  tableName: string
  columns: TColumns
  createValues: ClientTypes.DecodedValuesForColumns<TColumns>
  updateValues: Partial<ClientTypes.DecodedValuesForColumnsAll<TColumns>>
  // TODO where VALUES are actually not used here. Maybe adjust API?
  where: ClientTypes.WhereValuesForColumns<TColumns>
}): [string, BindValues] => {
  const keysStr = Object.keys(createValues).join(', ')

  const createValuesStr = Object.keys(createValues)
    .map((_) => `$create_${_}`)
    .join(', ')

  const conflictStr = Object.keys(where).join(', ')

  const updateValueStr = Object.keys(updateValues)
    .map((columnName) => `${columnName} = $update_${columnName}`)
    .join(', ')

  const bindValues = {
    ...makeBindValues({ columns, values: createValues, variablePrefix: 'create_' }),
    ...makeBindValues({ columns, values: updateValues, variablePrefix: 'update_' }),
  }

  return [
    sql`
      INSERT INTO ${tableName} (${keysStr})
       VALUES (${createValuesStr})
       ON CONFLICT (${conflictStr}) DO UPDATE SET ${updateValueStr}
    `,
    bindValues,
  ]
}

export const createTable = <TTableDef extends Schema.TableDefinition>({
  table,
  tableName,
}: {
  table: TTableDef
  tableName: string
}): string => {
  const createTableStr = pipe(
    table.columns,
    objectEntries,
    ImmArray.map(([columnName, columnDef]) => {
      const nullModifier = columnDef.nullable === true ? '' : 'NOT NULL'
      const primaryKeyModifier = columnDef.primaryKey ? 'PRIMARY KEY' : ''
      const defaultModifier = columnDef.default === undefined ? '' : `DEFAULT ${columnDef.default}`
      return sql`${columnName} ${columnDef.type.columnType} ${nullModifier} ${primaryKeyModifier} ${defaultModifier}`
    }),
    ImmArray.join(', '),
  )

  return sql`CREATE TABLE ${tableName} (${createTableStr});`
}

export const makeBindValues = <TColumns extends Schema.Columns, TKeys extends string>({
  columns,
  values,
  variablePrefix = '',
  skipNil,
}: {
  columns: TColumns
  values: Record<TKeys, any>
  variablePrefix?: string
  skipNil?: boolean
}): Record<string, any> => {
  const codecMap = pipe(
    columns,
    objectEntries,
    ImmArray.map(([columnName, columnDef]) => [
      columnName,
      (value: any) =>
        columnDef.nullable === true && (value === null || value === undefined)
          ? null
          : columnDef.type.codec.encode(value),
    ]),
    Object.fromEntries,
  )

  return pipe(
    Object.entries(values)
      // NOTE null/undefined values are handled via explicit SQL syntax and don't need to be provided as bind values
      .filter(([, value]) => skipNil !== true || (value !== null && value !== undefined))
      .flatMap(([columnName, value]: [string, any]) => {
        // remap complex where-values with `op`
        if (typeof value === 'object' && value !== null && 'op' in value) {
          switch (value.op) {
            case 'in': {
              return value.val.map((value: any, i: number) => [
                `${variablePrefix}${columnName}_${i}`,
                codecMap[columnName]!(value),
              ])
            }
            case '=':
            case '>':
            case '<': {
              return [[`${variablePrefix}${columnName}`, codecMap[columnName]!(value.val)]]
            }
            default: {
              throw new Error(`Unknown op: ${value.op}`)
            }
          }
        } else {
          return [[`${variablePrefix}${columnName}`, codecMap[columnName]!(value)]]
        }
      }),
    Object.fromEntries,
  )
}

const buildWhereSql = <TColumns extends Schema.Columns>({
  where,
}: {
  where: ClientTypes.WhereValuesForColumns<TColumns>
}) => {
  const getWhereOp = (columnName: string, value: ClientTypes.WhereValueForDecoded<any>) => {
    if (value === null) {
      return `IS NULL`
    } else if (typeof value === 'object' && typeof value.op === 'string' && ClientTypes.isValidWhereOp(value.op)) {
      return `${value.op} $where_${columnName}`
    } else if (typeof value === 'object' && typeof value.op === 'string' && value.op === 'in') {
      return `in (${value.val.map((_: any, i: number) => `$where_${columnName}_${i}`).join(', ')})`
    } else {
      return `= $where_${columnName}`
    }
  }

  return pipe(
    where,
    objectEntries,
    ImmArray.map(([columnName, value]) => `${columnName} ${getWhereOp(columnName, value)}`),
    ImmArray.join(' AND '),
  )
}
