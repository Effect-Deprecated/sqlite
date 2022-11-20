import 'react-toastify/dist/ReactToastify.min.css'

import {ToastContainer, toast, Flip} from 'react-toastify'

import * as React from 'react'
import {Screen} from 'ui/screen'
import {SectionHeader} from 'ui/section-header'
import {useMessage} from 'app/use-store'
import {Message} from 'app/types'

export default function App(props: {children: React.ReactNode}) {
  useMessage(
    React.useCallback((message) => {
      if (message) {
        if (message.type === `error`) {
          toastError(message)
        } else {
          toastSuccess(message)
        }
      }
    }, []),
  )

  return (
    <>
      <Screen>
        <SectionHeader className="pt-2" />
        <main className="flex grow">{props.children}</main>
      </Screen>

      <ToastContainer
        theme="dark"
        position="bottom-left"
        autoClose={1000}
        transition={Flip}
      />
    </>
  )
}

const toastError = ({value}: Message) =>
  toast.error(<div className="flex items-center gap-2">{value}</div>)

const toastSuccess = ({value}: Message) =>
  toast.success(<div className="flex items-center gap-2">{value}</div>)
