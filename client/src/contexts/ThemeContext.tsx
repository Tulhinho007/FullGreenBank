import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeContextType {
  theme: Theme
  toggleTheme: (t?: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('fgb_theme') as Theme) || 'system'
  })

  useEffect(() => {
    const applyTheme = (t: Theme) => {
      let active: 'dark' | 'light' = 'dark'
      
      if (t === 'system') {
        active = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      } else {
        active = t as 'dark' | 'light'
      }

      document.documentElement.setAttribute('data-theme', active)
      localStorage.setItem('fgb_theme', t)
    }

    applyTheme(theme)

    // Listener para mudanças no sistema se estiver em modo 'system'
    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = () => applyTheme('system')
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    }
  }, [theme])

  const toggleTheme = (t?: Theme) => {
    if (t) setTheme(t)
    else setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
