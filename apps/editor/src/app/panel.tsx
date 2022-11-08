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
  (
    value: string,
    _path: string,
    options: {initial: boolean; fromPanel: boolean},
  ) => {
    if (!options.initial && options.fromPanel && value !== `none`) {
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
        download: fromConn.run.download,
        '|': () => {},
        reconnect: fromConn.run.reconnect,
      }),
      '  ': buttonGroup({
        '+ url': () => {},
        '+ upload': () => {},
        '+ empty': () => {},
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
  const {jsonView, tableView} = fromTables
  const options = React.useMemo(
    () => reduceOptions(fromTables.tables),
    [fromTables.tables],
  )
  const current = fromTables.selectedTable || options.none

  const [, set] = useControls(
    `table`,
    () => ({
      current: {
        options,
        onChange: (tableName, _path, {initial, fromPanel}) => {
          if (!initial && fromPanel) {
            if (tableName === `none`) {
              fromTables.run.tableClose()
            } else {
              fromTables.run.tableOpen(tableName)
            }
          }
        },
      },
      ' ': buttonGroup({
        refresh: () => fromTables.run.tableRefresh(),
      }),
      jsonView: {
        value: jsonView,
        onChange: (_, __, {initial, fromPanel}) => {
          if (!initial && fromPanel) {
            fromTables.run.jsonViewSwitch()
          }
        },
        transient: true,
      },
      tableView: {
        value: tableView,
        onChange: (_, __, {initial, fromPanel}) => {
          if (!initial && fromPanel) {
            fromTables.run.tableViewSwitch()
          }
        },
        transient: false,
      },
    }),
    [options],
  )

  React.useEffect(() => set({current}), [current])
  React.useEffect(() => set({jsonView}), [jsonView])
  React.useEffect(() => set({tableView}), [tableView])
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
