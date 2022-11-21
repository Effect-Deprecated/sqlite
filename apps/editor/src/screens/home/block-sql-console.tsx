import * as React from 'react'
import Editor, {useMonaco} from '@monaco-editor/react'
import {format} from 'sql-formatter'
import {Icon} from '@iconify/react'
import playIcon from '@iconify/icons-mdi/play'

export function BlockSqlConsole() {
  const [value, setValue] = React.useState(`SELECT * FROM users`)
  const [editor, setEditor] = React.useState<any>(null)
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

  React.useEffect(() => {
    if (editor) {
      const layout = () => {
        editor.layout({
          width: `auto`,
          height: `10vh`,
        })
      }

      window.addEventListener('resize', layout)

      return () => window.removeEventListener('resize', layout)
    }
  }, [editor])

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
        theme="vs-dark"
        height="15vh"
        defaultLanguage="sql"
        value={value}
        onChange={(value) => value && setValue(value)}
        onMount={setEditor}
      />
    </div>
  )
}
