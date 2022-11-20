import 'react-toastify/dist/ReactToastify.min.css'

import {ToastContainer, toast, Flip} from 'react-toastify'

import {Screen} from 'ui/screen'
import {SectionHeader} from 'ui/section-header'
// import type {Message} from 'app/types'

export default function App({children}: {children: React.ReactNode}) {
  return (
    <>
      <Screen>
        <SectionHeader className="pt-2" />
        <main>{children}</main>
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

// const toastError = ({value}: Message) =>
//   toast.error(
//     <div className="flex items-center gap-2">
//       <Icon icon={connectionIcon} />
//       {value}
//     </div>,
//   )
// const toastSuccess = ({value}: Message) =>
//   toast.success(
//     <div className="flex items-center gap-2">
//       <Icon icon={connectionIcon} />
//       {value}
//     </div>,
//   )
