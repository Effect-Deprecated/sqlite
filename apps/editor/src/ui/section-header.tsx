import {IconGithub} from './icon-github'
import {Logo} from './logo'
import {SectionCenter} from './section'

export function SectionHeader(props: {className?: string}) {
  return (
    <SectionCenter className={props.className}>
      <div className="navbar bg-primary text-primary-content rounded-box opacity-80">
        <div className="navbar-start">
          <a className="btn btn-ghost text-md normal-case  md:text-xl">
            <Logo className="h-6 w-6 md:h-8 md:w-8" />
            <div className="px-2">@effect/sqlite-editor</div>
          </a>
        </div>
        <div className="navbar-end">
          <a
            className="btn btn-ghost gap-2"
            rel="noopener noreferrer"
            target="_blank"
            href="https://github.com/Effect-TS/sqlite"
          >
            <IconGithub className="text- h-6 w-6 md:h-8 md:w-8" />
          </a>
        </div>
      </div>
    </SectionCenter>
  )
}
