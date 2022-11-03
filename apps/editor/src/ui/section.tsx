import cx from 'classnames'

export function Section(props: {className?: string; children: React.ReactNode}) {
  return (
    <div className={cx(`flex`, props.className)}>
      <div className="flex max-w-6xl flex-grow flex-col px-4">{props.children}</div>
    </div>
  )
}

export function SectionCenter(props: {className?: string; children: React.ReactNode}) {
  return (
    <Section className={cx(`items-center justify-center pb-5`, props.className)}>
      {props.children}
    </Section>
  )
}
