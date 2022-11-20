import cx from 'classnames'
import * as React from 'react'
import removeCircleOutline from '@iconify/icons-ion/remove-circle-outline'
import {useDropzone} from 'react-dropzone'

import {Connection} from 'app/types'
import {useConnections} from 'app/use-store'

import {BlockStyledTableView} from './block-table-view'
import {SectionSidebar} from './section-sidebar'
import {Icon} from '@iconify/react'
import closeThick from '@iconify/icons-mdi/close-thick'

export function ScreenHome() {
  const {viewSettings} = useConnections()

  return (
    <DropZone>
      <SectionSidebar className="px-4">
        {viewSettings ? <BlockViewSettings /> : <BlockStyledTableView />}
      </SectionSidebar>
    </DropZone>
  )
}

function DropZone(props: {children?: React.ReactNode}) {
  const {run} = useConnections()

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop: run.createFromFileList,
  })

  return (
    <div {...getRootProps()} className="flex grow">
      {isDragActive ? (
        <>
          <input {...getInputProps()} />
          <div className="m-4 flex grow items-center justify-center border border-dashed">
            Drop the files here
          </div>
        </>
      ) : (
        props.children
      )}
    </div>
  )
}

function BlockViewSettings() {
  const {connections, selectedConnection, run} = useConnections()

  const title = selectedConnection
    ? `Settings`
    : `Settings (connection not selected)`

  const currentConn = connections.find((v) => v.id === selectedConnection)

  return (
    <div className="bg-base-200 flex flex-grow flex-col self-start rounded-xl p-4">
      <div className="flex justify-between">
        <div className="prose">
          <h3>{title}</h3>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={run.viewSettingsDisable}
        >
          <Icon icon={closeThick} />
        </button>
      </div>
      {selectedConnection && currentConn ? (
        <BlockConnectionSettingsForm
          connection={currentConn}
          onChangeName={(name) => run.update({id: selectedConnection, name})}
          onRemove={() => run.remove(currentConn.id)}
        />
      ) : null}
    </div>
  )
}

function BlockConnectionSettingsForm(props: {
  connection: Connection
  onChangeName?: (name: string) => void
  onRemove?: () => void
}) {
  const {connection} = props
  const [removeName, setRemoveName] = React.useState(``)
  const removeEq = connection.name === removeName

  return (
    <div>
      <Input
        label={`Name (${connection.type})`}
        placeholder="Connection name"
        value={connection.name}
        onChangeValue={props.onChangeName}
      />
      <div className="flex items-end gap-2">
        <Input
          classNameInput={removeEq ? 'input-success' : 'input-error'}
          label={`Enter connection name and click the button to delete it`}
          placeholder="Remove name"
          value={removeName}
          onChangeValue={setRemoveName}
        />
        <button
          className={cx('btn btn-ghost')}
          onClick={() => removeEq && props.onRemove?.()}
        >
          <Icon
            icon={removeCircleOutline}
            className={removeEq ? `text-success` : `text-error`}
          />
        </button>
      </div>
    </div>
  )
}

function Input(props: {
  className?: string
  classNameInput?: string
  disabled?: boolean
  label?: string
  placeholder?: string
  value: string
  onChangeValue?: (value: string) => void
}) {
  return (
    <div className={cx('form-control w-full max-w-md', props.className)}>
      {props.label ? (
        <label className="label">
          <span className="label-text">{props.label}</span>
        </label>
      ) : null}
      <input
        className={cx(
          'input input-bordered w-full max-w-md',
          props.classNameInput,
        )}
        type="text"
        disabled={props.disabled}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(e) => props.onChangeValue?.(e.target.value)}
      />
    </div>
  )
}
