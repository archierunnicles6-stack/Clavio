import Link from 'next/link'

const COMPANY_NAME = 'Clavio'
const TAGLINE = 'Turn expertise into measurable influence. High-performing LinkedIn and X content for creators.'

const RESOURCES = [
  { label: 'Twitter', href: 'https://twitter.com/clavio' },
  { label: 'YouTube', href: 'https://youtube.com/@clavio' },
]

const LEGAL_LINKS = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Fulfillment Policy', href: '/fulfillment' },
]

export function Footer() {
  return (
    <footer className="bg-[#1a2235] text-[#9eb2cc]">
      <div className="mx-auto max-w-[1160px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand column */}
          <div className="max-w-[320px]">
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/clavio-mark.svg"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
                aria-hidden
              />
              <span className="text-lg font-semibold text-white">
                {COMPANY_NAME}
              </span>
            </Link>
            <p className="mt-3 text-[14px] leading-6 text-[#9eb2cc]">
              {TAGLINE}
            </p>
          </div>

          {/* Resources column */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#c5d4e8]">
              Resources
            </h4>
            <ul className="mt-4 space-y-2">
              {RESOURCES.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[14px] text-[#9eb2cc] transition-colors hover:text-white"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company column */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#c5d4e8]">
              Company
            </h4>
            <ul className="mt-4 space-y-2">
              {LEGAL_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-[14px] text-[#9eb2cc] transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-[#2d3a52] pt-6 text-center">
          <p className="text-[13px] text-[#8a9fb8]">
            © {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
