'use client'

import { useState } from 'react'
import { ChevronDown, Menu, X } from 'lucide-react'

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)

  const navItems = [
    {
      title: 'Product',
      href: '/product',
      items: ['Features', 'How it Works', 'Integrations', 'API']
    },
    {
      title: 'Solutions',
      items: ['For Teams', 'For Enterprise', 'For Developers', 'For Startups']
    },
    {
      title: 'Resources',
      items: ['Documentation', 'Blog', 'Community', 'Support']
    },
    {
      title: 'Pricing',
      href: '/pricing',
      items: ['Plans', 'Enterprise', 'Billing', 'FAQ']
    }
  ]

  return (
    <nav className="relative z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Supergrow</h1>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <div 
                key={item.title}
                className="relative"
                onMouseEnter={() => setOpenDropdown(item.title)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {item.href ? (
                  <a href={item.href} className="flex items-center gap-1 text-gray-700 hover:text-gray-900 font-medium text-sm">
                    {item.title}
                  </a>
                ) : (
                  <button className="flex items-center gap-1 text-gray-700 hover:text-gray-900 font-medium text-sm">
                    {item.title}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                )}
                
                {/* Dropdown */}
                {!item.href && openDropdown === item.title && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {item.items.map((subItem) => (
                      <a
                        key={subItem}
                        href="#"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      >
                        {subItem}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right side buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <button className="text-gray-700 hover:text-gray-900 font-medium text-sm">
              Log in
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm">
              Get started free
            </button>
          </div>

          {/* Mobile menu button */}
          <button 
            className="lg:hidden text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <div key={item.title}>
                  {item.href ? (
                    <a href={item.href} className="block px-3 py-2 text-gray-700 hover:text-gray-900 font-medium text-sm">
                      {item.title}
                    </a>
                  ) : (
                    <>
                      <button className="flex items-center justify-between w-full px-3 py-2 text-gray-700 hover:text-gray-900 font-medium text-sm">
                        {item.title}
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <div className="pl-6 pr-3 pb-2">
                        {item.items.map((subItem) => (
                          <a
                            key={subItem}
                            href="#"
                            className="block py-1 text-sm text-gray-600 hover:text-gray-900"
                          >
                            {subItem}
                          </a>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <button className="block w-full text-left px-3 py-2 text-gray-700 hover:text-gray-900 font-medium text-sm">
                  Log in
                </button>
                <button className="block w-full text-left px-3 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm mt-1">
                  Get started free
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
