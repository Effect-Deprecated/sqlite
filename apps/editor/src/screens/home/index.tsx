import '@glideapps/glide-data-grid/dist/index.css'

import * as React from 'react'

import {
  DataEditor,
  EditableGridCell,
  GridCell,
  GridCellKind,
  Item,
} from '@glideapps/glide-data-grid'

import {SectionCenter} from 'ui/section'
import {Title} from 'ui/title'
import {useConnections, useTables} from 'app/use-store'

export function ScreenHome() {
  return (
    <>
      <SectionConnections />
      <SectionTable />
    </>
  )
}

function SectionConnections(props: {className?: string}) {
  return (
    <SectionCenter className={props.className}>
      <Title>Connections</Title>
      <BlockConnectionsActions />
      {/* <BlockConnections /> */}
    </SectionCenter>
  )
}

function BlockConnectionsActions() {
  return (
    <div className="flex">
      <button className="btn btn-xs btn-ghost">+ From URL</button>
      <button className="btn btn-xs btn-ghost">+ Upload</button>
      <button className="btn btn-xs btn-ghost">+ Empty</button>
    </div>
  )
}

function SectionTable() {
  return (
    <SectionCenter>
      <DataTable />
    </SectionCenter>
  )
}

const getValue = (
  dataRow: Record<string, unknown> | undefined,
  index: string | undefined,
) =>
  typeof dataRow !== 'undefined' && typeof index !== 'undefined'
    ? dataRow[index]
    : ``

function DataTable() {
  const {rows, cols} = useTables()

  const indexes = cols.map((item) => item.name)

  const columns = indexes.map((name) => ({
    title: name,
    id: name,
  }))

  const getContent = React.useCallback(
    (cell: Item): GridCell => {
      const [col, row] = cell
      const d = `${getValue(rows[row], indexes[col])}`
      return {
        kind: GridCellKind.Text,
        allowOverlay: true,
        readonly: false,
        displayData: d,
        data: d,
      }
    },
    [rows, indexes, columns],
  )

  const onCellEdited = React.useCallback(
    (cell: Item, newValue: EditableGridCell) => {
      if (newValue.kind !== GridCellKind.Text) {
        // we only have text cells, might as well just die here.
        return
      }

      const [col, row] = cell
      const key = indexes[col]

      console.log(col, row, key, newValue.data)
      // const key = indexes[col];
      // data[row][key] = newValue.data;
    },
    [],
  )

  const notReady = cols.length === 0

  // console.log(`data-table`, rows, cols)

  if (notReady) {
    return null
  }

  return (
    <div>
      <DataEditor
        getCellContent={getContent}
        columns={columns}
        rows={rows.length}
        onCellEdited={onCellEdited}
      />
    </div>
  )
}

// function BlockConnections() {
//   const {connections, connectionSelected, run} = React.useContext(Context)

//   return (
//     <>
//       <div className="flex flex-wrap justify-center gap-2 pt-2 md:justify-start">
//         {connections.map((conn) => (
//           <ConnectionCard
//             key={conn.name}
//             className={cx({'bg-secondary': conn.name === connectionSelected})}
//             name={conn.name}
//             type={conn.type}
//             onOpen={() => run.open(conn.name)}
//           />
//         ))}
//       </div>
//     </>
//   )
// }

// function ConnectionCard(props: {
//   className?: string
//   type: string
//   name: string
//   onOpen?: () => void
// }) {
//   return (
//     <div className={cx(`stats bg-primary text-primary-content`, props.className)}>
//       <div className="stat">
//         <div className="stat-title select-none">
//           Name <div className="badge badge-secondary badge-sm">{props.type}</div>
//         </div>
//         <div className="stat-value">{props.name}</div>
//         <div className="stat-actions flex gap-2">
//           <button className="btn btn-success btn-xs" onClick={props.onOpen}>
//             Open
//           </button>
//           <button className="btn btn-error btn-xs">Remove</button>
//         </div>
//       </div>
//     </div>
//   )
// }

// function SectionTables(props: {className?: string}) {
//   return (
//     <SectionCenter className={props.className}>
//       <Title>Tables</Title>
//       <BlockTables />
//     </SectionCenter>
//   )
// }

// function BlockTables() {
//   const {tables, tableSelected, run} = React.useContext(Context)

//   return (
//     <div className="flex flex-wrap gap-2">
//       {tables.map((table) => (
//         <TableCard
//           className={cx({'bg-secondary': table.name === tableSelected})}
//           key={table.name}
//           name={table.name}
//           onOpen={() => run.tableOpen(table.name)}
//         />
//       ))}
//     </div>
//   )
// }

// function TableCard(props: {
//   className?: string
//   name: string
//   children?: React.ReactNode
//   onOpen?: () => void
// }) {
//   return (
//     <button className={cx(`btn btn-sm btn-ghost`, props.className)} onClick={props.onOpen}>
//       {props.children || props.name}
//     </button>
//   )
// }
