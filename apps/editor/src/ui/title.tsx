import cx from 'classnames'

export function Title(props: {className?: string; children: React.ReactNode}) {
  return (
    <article className={cx(`prose`, props.className)}>
      <h3>{props.children}</h3>
    </article>
  )
}
