import cx from 'classnames'

export function Screen(props: {className?: string; children: React.ReactNode}) {
  return (
    <div className={cx(`max-w-[100vw] overflow-hidden antialiased`, props.className)}>
      {props.children}
    </div>
  )
}
