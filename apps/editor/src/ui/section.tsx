import cx from 'classnames'

export function Section(props: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cx(`flex max-w-6xl flex-grow flex-col px-4`, props.className)}
    >
      {props.children}
    </div>
  )
}

export function SectionCenter(props: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-center pb-5">
      <Section className={props.className}>{props.children}</Section>
    </div>
  )
}
