import * as fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { OT } from '../utils/effect.js'
import { pipe, T } from '../utils/effect.js'
import { provideOtelTracer } from '../utils/dummy-tracer.js'
import { expect, test } from 'vitest'

import * as Client from '../client/index.js'
import { makeSqliteConnection } from '../node/index.js'
import * as Schema from '../schema.js'

test('node simple', async () => {
  const schema = Schema.defineSchema({ tables: {} })
  const client = new Client.Client('test-db', schema)

  const res = await pipe(
    client.executeRaw<number>('SELECT 1 as col'),
    T.provideSomeLayer(makeSqliteConnection('test-db', ':memory:')),
    runMain,
  )

  expect(res).toEqual([{ col: 1 }])
})

test('node create and find', async () => {
  const schema = Schema.defineSchema({
    tables: {
      events: {
        columns: {
          id: Schema.column({ type: Schema.text(), primaryKey: true }),
          createdAt: Schema.column({ type: Schema.datetime() }),
        },
      },
    },
  })

  const client = new Client.Client('test-db', schema)

  const res = await pipe(
    client.migrateIfNeeded(),
    T.chain(() => client.create('events', { id: 'some', createdAt: new Date('2020-01-01') })),
    T.chain(() => client.findMany('events', { id: 'some' })),
    T.provideSomeLayer(makeSqliteConnection('test-db', ':memory:')),
    runMain,
  )

  expect(res).toMatchInlineSnapshot(`
    [
      {
        "createdAt": 2020-01-01T00:00:00.000Z,
        "id": "some",
      },
    ]
  `)
})

test('node create and find json', async () => {
  const schema = Schema.defineSchema({
    tables: {
      events: {
        columns: {
          id: Schema.column({ type: Schema.text(), primaryKey: true }),
          someData: Schema.column({ type: Schema.json<{ a: 'a'; b: { b1: 'b1' } }>() }),
        },
      },
    },
  })

  const client = new Client.Client('test-db', schema)

  const res = await pipe(
    client.migrateIfNeeded(),
    T.chain(() => client.create('events', { id: 'some', someData: { a: 'a', b: { b1: 'b1' } } })),
    T.chain(() => client.findMany('events', { id: 'some' })),
    T.provideSomeLayer(makeSqliteConnection('test-db', ':memory:')),
    runMain,
  )

  expect(res).toMatchInlineSnapshot(`
    [
      {
        "id": "some",
        "someData": {
          "a": "a",
          "b": {
            "b1": "b1",
          },
        },
      },
    ]
  `)
})

test('node upsert', async () => {
  const schema = Schema.defineSchema({
    tables: {
      events: {
        columns: {
          id: Schema.column({ type: Schema.text(), primaryKey: true }),
          someValue: Schema.column({ type: Schema.integer() }),
        },
      },
    },
  })

  const client = new Client.Client('test-db', schema)

  await pipe(
    client.migrateIfNeeded(),
    T.chain(() =>
      client.upsert('events', {
        create: { id: 'static', someValue: 10 },
        update: { someValue: 42 },
        where: { id: 'static' },
      }),
    ),
    T.chain(() => client.find('events', { id: 'static' })),
    T.tap((row) =>
      T.succeedWith(() =>
        expect(row).toMatchInlineSnapshot(`
          Some {
            "_tag": "Some",
            "value": {
              "id": "static",
              "someValue": 10,
            },
          }
        `),
      ),
    ),
    T.chain(() =>
      client.upsert('events', {
        create: { id: 'static', someValue: 10 },
        update: { someValue: 42 },
        where: { id: 'static' },
      }),
    ),
    T.chain(() => client.find('events', { id: 'static' })),
    T.tap((row) =>
      T.succeedWith(() =>
        expect(row).toMatchInlineSnapshot(`
          Some {
            "_tag": "Some",
            "value": {
              "id": "static",
              "someValue": 42,
            },
          }
        `),
      ),
    ),
    T.provideSomeLayer(makeSqliteConnection('test-db', ':memory:')),
    runMain,
  )
})

test('node error', async () => {
  const schema = Schema.defineSchema({
    tables: {
      events: { columns: { id: Schema.column({ type: Schema.text(), primaryKey: true }) } },
    },
  })

  const client = new Client.Client('test-db', schema)

  const res = await pipe(
    client.findMany('events', { id: 'some' }),
    T.provideSomeLayer(makeSqliteConnection('test-db', ':memory:')),
    T.either,
    runMain,
  )

  expect(res).toMatchInlineSnapshot(`
    Left {
      "_tag": "Left",
      "left": SqlClientError {
        "_tag": "SqlClientError",
        "bindValues": {
          "where_id": "some",
        },
        "error": [Error: SQLITE_ERROR: no such table: events],
        "query": "SELECT * FROM events WHERE id = \$where_id ",
        "toString": [Function],
        Symbol(): {
          "bindValues": {
            "where_id": "some",
          },
          "error": [Error: SQLITE_ERROR: no such table: events],
          "query": "SELECT * FROM events WHERE id = \$where_id ",
        },
        Symbol(): [
          "bindValues",
          "error",
          "query",
        ],
      },
    }
  `)
})

test('node create and find - parallel', async () => {
  const schema = Schema.defineSchema({
    tables: {
      events: { columns: { id: Schema.column({ type: Schema.text(), primaryKey: true }) } },
    },
  })

  const clientA = new Client.Client('test-db-a', schema)
  const clientB = new Client.Client('test-db-b', schema)

  const res = await pipe(
    clientA.migrateIfNeeded(),
    T.chain(() => clientB.migrateIfNeeded()),
    T.chain(() => clientA.create('events', { id: '10' })),
    T.chain(() => clientB.create('events', { id: '42' })),
    T.chain(() =>
      T.structPar({
        a: clientA.findMany('events', {}),
        b: clientB.findMany('events', {}),
      }),
    ),
    T.provideSomeLayer(makeSqliteConnection('test-db-a', ':memory:')),
    T.provideSomeLayer(makeSqliteConnection('test-db-b', ':memory:')),
    runMain,
  )

  expect(res).toMatchInlineSnapshot(`
    {
      "a": [
        {
          "id": "10",
        },
      ],
      "b": [
        {
          "id": "42",
        },
      ],
    }
  `)
})

test('node should create db file', async () => {
  const testDirPath = fileURLToPath(new URL('.', import.meta.url))
  const testDbPath = path.join(testDirPath, 'fixtures', 'test-db.sqlite')

  fs.rmSync(testDbPath, { force: true })

  const schema = Schema.defineSchema({
    tables: {
      events: { columns: { id: Schema.column({ type: Schema.text(), primaryKey: true }) } },
    },
  })

  const client = new Client.Client('test-db', schema)

  await pipe(client.migrateIfNeeded(), T.provideSomeLayer(makeSqliteConnection('test-db', testDbPath)), runMain)

  expect(fs.existsSync(testDbPath)).toBe(true)
})

const runMain = <E, A>(eff: T.Effect<OT.HasTracer, E, A>): Promise<A> => pipe(eff, provideOtelTracer(), T.runPromise)
