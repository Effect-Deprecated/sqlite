import * as React from 'react'
import create from 'zustand'

import {store} from './store'
import {Message} from './types'

export const useStore = create(store)

export const useConnections = () =>
  useStore((state) => ({
    connections: state.connections,
    selectedConnection: state.selectedConnection,
    run: {
      download: state.download,
      connect: state.connect,
      reconnect: state.reconnect,
    },
  }))

export const useTables = () =>
  useStore((state) => ({
    tables: state.tables,
    selectedTable: state.selectedTable,
    rows: state.rows,
    cols: state.cols,
    jsonView: state.jsonView,
    tableView: state.tableView,
    run: {
      jsonViewSwitch: state.jsonViewSwitch,
      tableViewSwitch: state.tableViewSwitch,
      tableOpen: state.tableOpen,
      tableClose: state.tableClose,
      tableRefresh: state.tableRefresh,
      tableUpdateRow: state.tableUpdateRow,
    },
  }))

type MessageFn = (message: Message) => void

export const subscribeMessage = (cb: MessageFn) =>
  useStore.subscribe(
    (state) => state.message,
    (message) => {
      if (message && message.type && message.value) {
        cb(message)
      }
    },
  )

export function useMessage(onMessage: MessageFn) {
  React.useEffect(() => {
    if (onMessage) {
      const unsubscribe = subscribeMessage(onMessage)
      return () => unsubscribe()
    }
  }, [onMessage])
}
