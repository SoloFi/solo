import { Link } from '@tanstack/react-router'
import { Sparkle } from 'lucide-react'

export function Logo() {
  return (
    <div className="flex items-center gap-1.5 text-2xl font-extrabold transition-opacity hover:opacity-75">
      <Sparkle className="w-[24px] h-[24px]" />
      <span>Solo</span>
    </div>
  )
}

export function LogoLink(props: { href: string }) {
  return (
    <Link href={props.href}>
      <Logo />
    </Link>
  )
}
