import type { Has, OT } from '../utils/effect.js'
import { pipe, T } from '../utils/effect.js'
import { provideOtelTracer } from '../utils/dummy-tracer.js'
import { expect, test } from 'vitest'

import * as Client from '../client/index.js'
import type * as Connection from '../connection.js'
import * as Schema from '../schema.js'
import { makeTestConnection } from './test-connection.js'

test('client', async () => {
  const schema = Schema.defineSchema({
    tables: {
      events: {
        columns: {
          id: Schema.column({ type: Schema.text(), primaryKey: true }),
          createdAt: Schema.column({ type: Schema.datetime() }),
          data: Schema.column({ type: Schema.json<SomeDeepType>() }),
        },
      },
    },
  })

  const client = new Client.Client('test-db', schema)

  const [sqlStr] = await runQueries(
    client.create('events', {
      id: 'some-id',
      createdAt: new Date('2020-01-01'),
      data: {
        type: 'SomeTag',
        other: {},
        nested: { type: 'SomeTag', other: {} },
      },
    }),
  )

  expect(sqlStr).toMatchInlineSnapshot(
    `
      [
        "INSERT  INTO events (id, createdAt, data) VALUES ($id, $createdAt, $data)",
        {
          "createdAt": 1577836800000,
          "data": "{\\"type\\":\\"SomeTag\\",\\"other\\":{},\\"nested\\":{\\"type\\":\\"SomeTag\\",\\"other\\":{}}}",
          "id": "some-id",
        },
      ]
    `,
  )
})

test('client nullable', async () => {
  const schema = Schema.defineSchema({
    tables: {
      events: {
        columns: {
          id: Schema.column({ type: Schema.text(), primaryKey: true }),
          // TODO try to remove `as const` as this seems to be a regression in TS 4.7
          createdAt: Schema.column({ type: Schema.datetime(), nullable: true as const }),
          data: Schema.column({ type: Schema.json<SomeDeepType>() }),
        },
      },
    },
  })

  const client = new Client.Client('test-db', schema)

  const [sqlStr] = await runQueries(
    client.create('events', {
      id: 'some-id',
      data: {
        type: 'SomeTag',
        other: {},
        nested: { type: 'SomeTag', other: {} },
      },
    }),
  )

  expect(sqlStr).toMatchInlineSnapshot(
    `
      [
        "INSERT  INTO events (id, data) VALUES ($id, $data)",
        {
          "data": "{\\"type\\":\\"SomeTag\\",\\"other\\":{},\\"nested\\":{\\"type\\":\\"SomeTag\\",\\"other\\":{}}}",
          "id": "some-id",
        },
      ]
    `,
  )
})

test('client nullable - explicit null', async () => {
  const schema = Schema.defineSchema({
    tables: {
      events: {
        columns: {
          id: Schema.column({ type: Schema.text(), primaryKey: true }),
          // TODO try to remove `as const` as this seems to be a regression in TS 4.7
          createdAt: Schema.column({ type: Schema.datetime(), nullable: true as const }),
          data: Schema.column({ type: Schema.json<SomeDeepType>() }),
        },
      },
    },
  })

  const client = new Client.Client('test-db', schema)

  const [sqlStr] = await runQueries(
    client.create('events', {
      id: 'some-id',
      createdAt: undefined,
      data: {
        type: 'SomeTag',
        other: {},
        nested: { type: 'SomeTag', other: {} },
      },
    }),
  )

  expect(sqlStr).toMatchInlineSnapshot(
    `
      [
        "INSERT  INTO events (id, createdAt, data) VALUES ($id, $createdAt, $data)",
        {
          "createdAt": null,
          "data": "{\\"type\\":\\"SomeTag\\",\\"other\\":{},\\"nested\\":{\\"type\\":\\"SomeTag\\",\\"other\\":{}}}",
          "id": "some-id",
        },
      ]
    `,
  )
})

test('client - where `>`', async () => {
  const schema = Schema.defineSchema({
    tables: {
      events: {
        columns: {
          id: Schema.column({ type: Schema.text(), primaryKey: true }),
        },
      },
    },
  })

  const client = new Client.Client('test-db', schema)

  const [res] = await runQueries(
    client.findMany('events', {
      id: { op: '>', val: '0' },
    }),
  )

  expect(res![0]).toMatchInlineSnapshot('"SELECT * FROM events WHERE id > $where_id "')

  expect(res![1]).toMatchInlineSnapshot(`
    {
      "where_id": "0",
    }
  `)
})

test('client - where in', async () => {
  const schema = Schema.defineSchema({
    tables: {
      events: {
        columns: {
          id: Schema.column({ type: Schema.text(), primaryKey: true }),
        },
      },
    },
  })

  const client = new Client.Client('test-db', schema)

  const [res] = await runQueries(
    client.findMany('events', {
      id: { op: 'in', val: ['some-id', 'some-other-id'] },
    }),
  )

  expect(res![0]).toMatchInlineSnapshot('"SELECT * FROM events WHERE id in ($where_id_0, $where_id_1) "')

  expect(res![1]).toMatchInlineSnapshot(`
    {
      "where_id_0": "some-id",
      "where_id_1": "some-other-id",
    }
  `)
})

type SomeDeepType = {
  type: 'SomeTag'
  nested?: SomeDeepType
  other: Record<string, number>
}

const runQueries = async <E>(eff: T.Effect<OT.HasTracer & Has<Connection.Connection<'test-db'>>, E, unknown>) => {
  const sqlQueries: [string, Connection.BindValues][] = []
  await pipe(eff, provideOtelTracer(), T.provideSomeLayer(makeTestConnection('test-db', sqlQueries)), T.runPromise)
  return sqlQueries
}
