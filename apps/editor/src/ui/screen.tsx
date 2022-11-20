import cx from 'classnames'

export function Screen(props: {className?: string; children: React.ReactNode}) {
  return (
    <div
      className={cx(
        `flex h-screen max-w-[100vw] flex-col overflow-hidden antialiased`,
        props.className,
      )}
    >
      {props.children}
    </div>
  )
}
