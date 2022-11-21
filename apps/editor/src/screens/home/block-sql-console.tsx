import * as React from 'react'
import Editor, {useMonaco} from '@monaco-editor/react'
import {format} from 'sql-formatter'
import {Icon} from '@iconify/react'
import playIcon from '@iconify/icons-mdi/play'

export function BlockSqlConsole() {
  const [value, setValue] = React.useState(`SELECT * FROM users`)
  const monaco = useMonaco()

  React.useEffect(() => {
    if (monaco) {
      monaco.languages.registerCompletionItemProvider('sql', {
        provideCompletionItems(_model: any, _position: any) {
          return {
            suggestions: {
              label: 'select version',
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: 'select @@version',
            },
          }
        },
      })
    }
  }, [monaco])

  return (
    <div className="bg-base-200 flex flex-col space-y-1 self-stretch rounded-xl p-4 text-sm">
      <div className="flex">
        <button className="btn btn-ghost btn-xs">
          <Icon icon={playIcon} />
        </button>
        <button
          className="btn btn-ghost btn-xs"
          onClick={() => setValue(format(value))}
        >
          prettier
        </button>
      </div>
      <Editor
        height="20vh"
        theme="vs-dark"
        defaultLanguage="sql"
        value={value}
        onChange={(value) => value && setValue(value)}
      />
    </div>
  )
}
