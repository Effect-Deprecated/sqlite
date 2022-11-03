import {Leva, useControls, buttonGroup} from 'leva'
import * as React from 'react'

import {useConnections, useTables, useMessage} from './use-store'
import {Message, Connection, Table} from './types'

const reduceOptions = (list: (Connection | Table)[]) =>
  list.reduce<Record<string, string>>((r, v) => ((r[v.name] = v.name), r), {
    none: `none`,
  })

const makeOnChange =
  (fn: (value: string) => void) =>
  (value: string, _path: string, options: {fromPanel: boolean}) => {
    if (options.fromPanel && value !== `none`) {
      fn(value)
    }
  }

function useConnectionsControls() {
  const fromConn = useConnections()
  const options = React.useMemo(
    () => reduceOptions(fromConn.connections),
    [fromConn.connections],
  )
  const current = fromConn.selectedConnection || options.none

  const [, set] = useControls(
    `connections`,
    () => ({
      current: {
        options,
        onChange: makeOnChange(fromConn.run.connect),
      },
      ' ': buttonGroup({
        reconnect: fromConn.run.reconnect,
      }),
    }),
    [options],
  )

  React.useEffect(() => {
    set({current})
  }, [current])
}

function useTablesControls() {
  const fromTables = useTables()
  const options = reduceOptions(fromTables.tables)
  const current = fromTables.selectedTable || options.none

  const [, set] = useControls(
    `table`,
    () => ({
      current: {
        options,
        onChange: makeOnChange(fromTables.run.tableOpen),
      },
      ' ': buttonGroup({
        refresh: () => fromTables.run.tableRefresh(),
      }),
    }),
    [options],
  )

  React.useEffect(() => {
    set({current})
  }, [current])
}

export function PanelProvider(props: {
  children: React.ReactNode
  onError?: (message: Message) => void
  onSuccess?: (message: Message) => void
}) {
  useConnectionsControls()
  useTablesControls()

  useMessage(
    React.useCallback(
      (message) => {
        if (message) {
          if (message.type === `error`) {
            props.onError?.(message)
          } else {
            props.onSuccess?.(message)
          }
        }
      },
      [props.onError, props.onSuccess],
    ),
  )

  const [{position}, set] = useControls(`general`, () => ({
    position: {x: 0, y: 70},
  }))

  return (
    <>
      {props.children}
      <Leva
        titleBar={{position, onDrag: (point: any) => set({position: point})}}
      />
    </>
  )
}
