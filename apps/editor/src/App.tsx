import {useQuery, useDb} from '@effect/sqlite-react'

const databaseName = `main`

export default function App() {
  const fromDb = useDb(databaseName, new URL(`/1.sqlite`, document.location.origin))
  const {rows} = useQuery({
    ...fromDb,
    queryString: `SELECT * FROM users`,
  })

  return rows.map(mapRows)
}

const mapRows = (row: unknown, key: number) => <div key={key}>{JSON.stringify(row)}</div>
