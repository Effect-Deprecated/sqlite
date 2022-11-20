import cx from 'classnames'
import * as React from 'react'

import connectionIcon from '@iconify/icons-mdi/connection'
import tableIcon from '@iconify/icons-mdi/table'
import {Icon} from '@iconify/react'
import {useConnections, useTables} from 'app/use-store'
import {Connection, Table} from 'app/types'

export function SectionSidebar(props: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cx('flex gap-2', props.className)}>
      <BlockMenuSidebar />
      {props.children}
    </div>
  )
}

function BlockMenuSidebar() {
  return (
    <ul className="menu bg-base-200 rounded-box menu-compact w-56 p-2">
      <BlockMenuConnections />
      <BlockMenuTables />
      <BlockMenuQueries />
    </ul>
  )
}

function BlockMenuConnections() {
  const fromConnections = useConnections()

  return (
    <>
      <li className="menu-title">
        <span className="flex gap-2">
          <Icon icon={connectionIcon} />
          Connections
        </span>
      </li>
      {fromConnections.connections.map((conn) => (
        <ConnectionMenuItem
          key={conn.name}
          active={fromConnections.selectedConnection === conn.name}
          connection={conn}
          onClick={fromConnections.run.connect}
        />
      ))}
    </>
  )
}

function ConnectionMenuItem(props: {
  active?: boolean
  connection: Connection
  onClick?: (connectionName: string) => void
}) {
  const {name} = props.connection

  return (
    <li className={cx({bordered: props.active})}>
      <a href="#" onClick={() => props.onClick?.(name)}>
        {name}
      </a>
    </li>
  )
}

function BlockMenuTables() {
  const fromTables = useTables()

  return (
    <>
      <li className="menu-title">
        <span className="flex gap-2">
          <Icon icon={tableIcon} />
          Tables
        </span>
      </li>
      {fromTables.tables.map((table) => (
        <TableMenuItem
          key={table.name}
          active={fromTables.selectedTable === table.name}
          table={table}
          onClick={fromTables.run.tableOpen}
        />
      ))}
    </>
  )
}

function TableMenuItem(props: {
  active?: boolean
  table: Table
  onClick?: (tableName: string) => void
}) {
  const {name} = props.table

  return (
    <li className={cx({bordered: props.active})}>
      <a href="#" onClick={() => props.onClick?.(name)}>
        {name}
      </a>
    </li>
  )
}

function BlockMenuQueries() {
  return (
    <>
      <li className="menu-title">
        <span>Queries</span>
      </li>
      <li>
        <a>users all</a>
      </li>
      <li>
        <a>users first row</a>
      </li>
    </>
  )
}
