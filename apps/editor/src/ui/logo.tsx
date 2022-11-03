import {Icon} from '@iconify/react'
import applicationEffect from '@iconify/icons-icon-park-outline/application-effect'

export function Logo(props: {className?: string}) {
  return (
    <div className={props.className}>
      <Icon icon={applicationEffect} width={`100%`} height={`100%`} />
    </div>
  )
}
