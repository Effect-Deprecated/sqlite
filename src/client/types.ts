import type { Prettify } from '../misc.js'
import type * as Schema from '../schema.js'

export type DecodedValuesForTableAll<TSchema extends Schema.Schema, TTableName extends keyof TSchema['tables']> = {
  [K in keyof GetColumns<TSchema, TTableName>]: GetColumn<TSchema, TTableName, K>['type'] extends Schema.FieldType<
    any,
    any,
    infer TDecoded
  >
    ? TDecoded
    : never
}

export type DecodedValuesForTablePretty<
  TSchema extends Schema.Schema,
  TTableName extends keyof TSchema['tables'],
> = Prettify<DecodedValuesForTable<TSchema, TTableName>>

export type DecodedValuesForTable<TSchema extends Schema.Schema, TTableName extends keyof TSchema['tables']> = Partial<
  Pick<DecodedValuesForTableAll<TSchema, TTableName>, GetNullableColumnNamesForTable<TSchema, TTableName>>
> &
  Omit<DecodedValuesForTableAll<TSchema, TTableName>, GetNullableColumnNamesForTable<TSchema, TTableName>>

export type DecodedValuesForTableOrNull<
  TSchema extends Schema.Schema,
  TTableName extends keyof TSchema['tables'],
> = NullableObj<
  Pick<DecodedValuesForTableAll<TSchema, TTableName>, GetNullableColumnNamesForTable<TSchema, TTableName>>
> &
  Omit<DecodedValuesForTableAll<TSchema, TTableName>, GetNullableColumnNamesForTable<TSchema, TTableName>>

export type WhereValuesForTable<
  TSchema extends Schema.Schema,
  TTableName extends keyof TSchema['tables'],
> = PartialOrNull<{
  [K in keyof DecodedValuesForTableAll<TSchema, TTableName>]: WhereValueForDecoded<
    DecodedValuesForTableAll<TSchema, TTableName>[K]
  >
}>

export type WhereValueForDecoded<TDecoded> = TDecoded | { op: WhereOp; val: TDecoded } | { op: 'in'; val: TDecoded[] }
export type WhereOp = '>' | '<' | '='

export const isValidWhereOp = (op: string): op is WhereOp => {
  const validWhereOps = ['>', '<', '=']
  return validWhereOps.includes(op)
}

export type EncodedValuesForTableAll<TSchema extends Schema.Schema, TTableName extends keyof TSchema['tables']> = {
  [K in keyof GetColumns<TSchema, TTableName>]: GetColumn<TSchema, TTableName, K>['type'] extends Schema.FieldType<
    any,
    infer TEncoded,
    any
  >
    ? TEncoded
    : never
}

export type EncodedValuesForTable<TSchema extends Schema.Schema, TTableName extends keyof TSchema['tables']> = Partial<
  Pick<EncodedValuesForTableAll<TSchema, TTableName>, GetNullableColumnNamesForTable<TSchema, TTableName>>
> &
  Omit<EncodedValuesForTableAll<TSchema, TTableName>, GetNullableColumnNamesForTable<TSchema, TTableName>>

export type GetNullableColumnNamesForTable<
  TSchema extends Schema.Schema,
  TTableName extends keyof TSchema['tables'],
> = keyof {
  [K in keyof GetColumns<TSchema, TTableName> as GetColumn<TSchema, TTableName, K> extends Schema.ColumnDefinition<
    any,
    true
  >
    ? K
    : never]: {}
}

export type GetColumns<
  TSchema extends Schema.Schema,
  TTableName extends keyof TSchema['tables'],
> = TSchema['tables'][TTableName]['columns']

export type GetColumn<
  TSchema extends Schema.Schema,
  TTableName extends keyof TSchema['tables'],
  TColumnName extends keyof TSchema['tables'][TTableName]['columns'],
> = TSchema['tables'][TTableName]['columns'][TColumnName]

export type DecodedValuesForColumnsAll<TColumns extends Schema.Columns> = {
  [K in keyof TColumns]: TColumns[K]['type'] extends Schema.FieldType<any, any, infer TDecoded> ? TDecoded : never
}

export type DecodedValuesForColumns<TColumns extends Schema.Columns> = Partial<
  Pick<DecodedValuesForColumnsAll<TColumns>, GetNullableColumnNames<TColumns>>
> &
  Omit<DecodedValuesForColumnsAll<TColumns>, GetNullableColumnNames<TColumns>>

export type EncodedValuesForColumnsAll<TColumns extends Schema.Columns> = {
  [K in keyof TColumns]: TColumns[K]['type'] extends Schema.FieldType<any, any, infer TEncoded> ? TEncoded : never
}

export type EncodedValuesForColumns<TColumns extends Schema.Columns> = Partial<
  Pick<EncodedValuesForColumnsAll<TColumns>, GetNullableColumnNames<TColumns>>
> &
  Omit<EncodedValuesForColumnsAll<TColumns>, GetNullableColumnNames<TColumns>>

export type WhereValuesForColumns<TColumns extends Schema.Columns> = PartialOrNull<{
  [K in keyof EncodedValuesForColumns<TColumns>]: WhereValueForDecoded<EncodedValuesForColumnsAll<TColumns>[K]>
}>

export type GetNullableColumnNames<TColumns extends Schema.Columns> = keyof {
  [K in keyof TColumns as TColumns[K] extends Schema.ColumnDefinition<any, true> ? K : never]: {}
}

export type PartialOrNull<T> = { [P in keyof T]?: T[P] | null }

export type NullableObj<T> = { [P in keyof T]: T[P] | null }
