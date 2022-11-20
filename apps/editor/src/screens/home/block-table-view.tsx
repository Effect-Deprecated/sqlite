import * as React from 'react'

import '@glideapps/glide-data-grid/dist/index.css'

import {
  DataEditor,
  EditableGridCell,
  GridCell,
  GridCellKind,
  Item,
} from '@glideapps/glide-data-grid'
import {useTables} from 'app/use-store'

const getValue = (
  dataRow: Record<string, unknown> | undefined,
  index: string | undefined,
) =>
  typeof dataRow !== 'undefined' && typeof index !== 'undefined'
    ? dataRow[index]
    : ``

export function BlockStyledTableView() {
  const {selectedTable} = useTables()

  if (!selectedTable) {
    return null
  }

  return (
    <div className="bg-base-200 flex flex-grow flex-col space-y-4 self-start rounded-xl p-4 text-sm">
      <div className="prose">
        <h2>Table: {selectedTable}</h2>
      </div>
      <BlockTableView />
    </div>
  )
}

export function BlockTableView() {
  const {rows, cols, run} = useTables()

  const {indexes, columns} = React.useMemo(() => {
    const indexes = cols.map((item) => item.name)
    const columns = indexes.map((name) => ({
      title: name,
      id: name,
    }))

    return {indexes, columns}
  }, [cols])

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
        return
      }

      const [col, row] = cell
      const key = indexes[col]

      if (key) {
        run.tableUpdateRow(row, {[key]: newValue.data})
      }
    },
    [indexes],
  )

  const notReady = cols.length === 0

  if (notReady) {
    return null
  }

  return (
    <DataEditor
      getCellContent={getContent}
      columns={columns}
      rows={rows.length}
      onCellEdited={onCellEdited}
    />
  )
}
