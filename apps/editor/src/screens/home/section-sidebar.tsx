import cx from 'classnames'
import * as React from 'react'

import connectionIcon from '@iconify/icons-mdi/connection'
import tableIcon from '@iconify/icons-mdi/table'
import {Icon, IconifyIcon} from '@iconify/react'
import {useConnections, useTables} from 'app/use-store'

import refreshIcon from '@iconify/icons-icon-park-outline/refresh'
import copyIcon from '@iconify/icons-icon-park-outline/copy'
import snapshotIcon from '@iconify/icons-icon-park-outline/copy-link'
import removeCircleOutline from '@iconify/icons-ion/remove-circle-outline'

export function SectionSidebar(props: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <aside className={cx('flex gap-2', props.className)}>
      <BlockMenuSidebar />
      {props.children}
    </aside>
  )
}

function BlockMenuSidebar() {
  return (
    <nav className="bg-base-200 space-y-4 rounded-xl p-4 text-sm">
      <BlockMenuConnections />
      <BlockMenuTables />
      <BlockMenuQueries />
    </nav>
  )
}

function BlockMenuConnections() {
  const fromConnections = useConnections()

  return (
    <BlockMenu icon={<Icon icon={connectionIcon} />} title={`Connections`}>
      {fromConnections.connections.map((conn) => (
        <BlockMenuItem
          key={conn.name}
          className="group justify-between gap-2"
          active={fromConnections.selectedConnection === conn.name}
          label={conn.name}
          onClick={fromConnections.run.connect}
        >
          <div className="opacity-0 group-hover:opacity-100">
            <ButtonAction icon={refreshIcon} tooltip="refresh" />
            <ButtonAction icon={copyIcon} tooltip="copy" />
            <ButtonAction icon={snapshotIcon} tooltip="snapshot" />
            <ButtonAction icon={removeCircleOutline} tooltip="remove" />
          </div>
        </BlockMenuItem>
      ))}
    </BlockMenu>
  )
}

function ButtonAction(props: {
  tooltip?: string
  icon: IconifyIcon | string
  onClick?: () => void
}) {
  return (
    <div className="tooltip tooltip-bottom" data-tip={props.tooltip}>
      <button className="btn btn-ghost btn-xs" onClick={props.onClick}>
        <Icon icon={props.icon} />
      </button>
    </div>
  )
}

function BlockMenuTables() {
  const fromTables = useTables()

  return (
    <BlockMenu icon={<Icon icon={tableIcon} />} title={`Tables`}>
      {fromTables.tables.map((table) => (
        <BlockMenuItem
          key={table.name}
          active={fromTables.selectedTable === table.name}
          label={table.name}
          onClick={fromTables.run.tableOpen}
        />
      ))}
    </BlockMenu>
  )
}

function BlockMenuQueries() {
  return (
    <BlockMenu icon={<Icon icon={tableIcon} />} title={`Queries`}></BlockMenu>
  )
}

function BlockMenu(props: {
  icon: React.ReactNode
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest">
        {props.icon}
        {props.title}
      </h2>
      <div className="flex flex-col space-y-1">{props.children}</div>
    </div>
  )
}

function BlockMenuItem(props: {
  active?: boolean
  className?: string
  children?: React.ReactNode
  label: string
  onClick?: (label: string) => void
}) {
  return (
    <div className={cx(`flex`, props.className)}>
      <div
        className={cx(
          {'bg-primary': props.active},
          'btn btn-ghost btn-xs justify-start',
        )}
        onClick={() => props.onClick?.(props.label)}
      >
        {props.label}
      </div>
      {props.children}
    </div>
  )
}
