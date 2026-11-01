'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { ThemeProvider, BaseStyles } from '@primer/react'
import { StyledComponentsRegistry } from './styled-components-registry'

/**
 * App-wide Primer providers. The theme attributes that the @primer/primitives
 * theme CSS keys off of (data-color-mode / data-light-theme / data-dark-theme)
 * are set on <html> in app/layout.tsx so the document background resolves too.
 * Here we mirror that mode on ThemeProvider so styled-components reads matching
 * theme values. BaseStyles applies Primer's base typography + color.
 *
 * Client-only boundary: Primer / styled-components touch `HTMLElement` (e.g.
 * `instanceof HTMLElement`) during render. That throws ReferenceError under
 * vinext Workers SSR where the DOM globals are absent. Defer the whole tree
 * until after mount instead of polyfilling the DOM.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <StyledComponentsRegistry>
      <ThemeProvider
        colorMode="night"
        dayScheme="light"
        nightScheme="dark"
        preventSSRMismatch
      >
        <BaseStyles>{children}</BaseStyles>
      </ThemeProvider>
    </StyledComponentsRegistry>
  )
}
