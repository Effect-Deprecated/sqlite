export const defineSchema = <S extends Schema>(schema: S) => schema

export type Schema = {
  tables: { [key: string]: TableDefinition }
  // actions: { [key: string]: ActionDefinition }
}

export type ActionDefinition = {
  statement: string | ((args: any) => string)
  bindValues?: (args: any) => any
}

export type ColumnDefinition<TFieldType extends FieldType<FieldColumnType, any, any>, TNullable extends boolean> = {
  readonly type: TFieldType
  readonly default?: GetFieldTypeEncoded<TFieldType>
  /** @default false */
  readonly nullable?: TNullable
  readonly primaryKey?: boolean
}

// export const column = <TColumn extends ColumnDefinition<any>>(_: TColumn) => _
export const column = <TType extends FieldColumnType, TEncoded, TDecoded, TNullable extends boolean>(
  _: ColumnDefinition<FieldType<TType, TEncoded, TDecoded>, TNullable>,
) => _

export type FieldType<TColumnType extends FieldColumnType, TEncoded, TDecoded> = {
  columnType: TColumnType
  codec: Codec<TEncoded, TDecoded>
}

export type FieldColumnType = 'text' | 'integer' | 'real' | 'json' | 'blob'

type GetFieldTypeEncoded<TFieldType extends FieldType<any, any, any>> = TFieldType extends FieldType<
  any,
  infer TEncoded,
  any
>
  ? TEncoded
  : never

export type FieldTypeJson<TDecoded> = FieldType<'json', string, TDecoded>
export type FieldTypeText = FieldType<'text', string, string>
export type FieldTypeInteger = FieldType<'integer', number, number>
export type FieldTypeReal = FieldType<'real', number, number>
export type FieldTypeBlob<TDecoded> = FieldType<'blob', Uint8Array, TDecoded>

/** Number corresponds with MS since epoch */
export type FieldTypeDateTime = FieldType<'integer', number, Date>
export type FieldTypeBoolean = FieldType<'integer', number, boolean>

export const json = <T>(): FieldTypeJson<T> => ({
  columnType: 'json',
  codec: new Codec<string, T>(JSON.parse, JSON.stringify),
})

export const text = (): FieldTypeText => ({
  columnType: 'text',
  codec: new Codec<string, string>(identity, identity),
})

export const integer = (): FieldTypeInteger => ({
  columnType: 'integer',
  codec: new Codec<number, number>(identity, identity),
})

export const real = (): FieldTypeReal => ({
  columnType: 'real',
  codec: new Codec<number, number>(identity, identity),
})

export const blob = (): FieldTypeBlob<Uint8Array> => ({
  columnType: 'blob',
  codec: new Codec<Uint8Array, Uint8Array>(identity, identity),
})

export const blobWithCodec = <TDecoded>(codec: Codec<Uint8Array, TDecoded>): FieldTypeBlob<TDecoded> => ({
  columnType: 'blob',
  codec,
})

export const datetime = (): FieldTypeDateTime => ({
  columnType: 'integer',
  codec: new Codec<number, Date>(
    (_) => new Date(_),
    (_) => _.getTime(),
  ),
})

export const boolean = (): FieldTypeBoolean => ({
  columnType: 'integer',
  codec: new Codec<number, boolean>(Boolean, (_) => (_ ? 1 : 0)),
})

const identity = <T>(x: T): T => x

export class Codec<Encoded, Decoded> {
  constructor(public decode: (value: Encoded) => Decoded, public encode: (value: Decoded) => Encoded) {}
}

export type Encoder<TDecoded, TEncoded> = (value: TDecoded) => TEncoded
export type Decoder<TDecoded, TEncoded> = (value: TEncoded) => TDecoded

export type TableDefinition = {
  columns: Columns
  indexes?: Index[]
}

export type Columns = Record<string, ColumnDefinition<FieldType<FieldColumnType, any, any>, boolean>>

export type Index = {
  name: string
  columns: string[]
  /** @default false */
  isUnique?: boolean
}

// export type DBConnection

export type TableTypes<TSchema extends Schema, TTableName extends keyof TSchema['tables']> = {
  [K in keyof TSchema['tables'][TTableName]['columns']]: TSchema['tables'][TTableName]['columns'][K]['type']['columnType']
}
