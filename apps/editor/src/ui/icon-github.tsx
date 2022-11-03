import {Icon} from '@iconify/react'
import githubIcon from '@iconify/icons-codicon/github'

export function IconGithub(props: {className?: string}) {
  return (
    <div className={props.className}>
      <Icon icon={githubIcon} width={`100%`} height={`100%`} />
    </div>
  )
}
