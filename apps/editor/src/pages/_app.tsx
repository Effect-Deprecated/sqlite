import 'react-toastify/dist/ReactToastify.min.css'

import connectionIcon from '@iconify/icons-ep/connection'
import {Icon} from '@iconify/react'
import {ToastContainer, toast, Flip} from 'react-toastify'

import {Screen} from 'ui/screen'
import {SectionHeader} from 'ui/section-header'
import type {Message} from 'app/types'
import {PanelProvider} from 'app/panel'

export default function App({children}: {children: React.ReactNode}) {
  return (
    <PanelProvider onError={toastError} onSuccess={toastSuccess}>
      <Screen>
        <SectionHeader className="pt-2" />
        <main>{children}</main>
      </Screen>

      <ToastContainer
        theme="dark"
        position="bottom-right"
        autoClose={1000}
        transition={Flip}
      />
    </PanelProvider>
  )
}

const toastError = ({value}: Message) =>
  toast.error(
    <div className="flex items-center gap-2">
      <Icon icon={connectionIcon} />
      {value}
    </div>,
  )
const toastSuccess = ({value}: Message) =>
  toast.success(
    <div className="flex items-center gap-2">
      <Icon icon={connectionIcon} />
      {value}
    </div>,
  )
