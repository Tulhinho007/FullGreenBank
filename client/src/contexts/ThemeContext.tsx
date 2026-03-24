import { createContext, useContext, useEffect, ReactNode } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // O sistema agora é 100% Dark Mode por padrão.
  const theme = 'dark'

  useEffect(() => {
    // Garante que o atributo e a classe estejam sempre presentes
    document.documentElement.setAttribute('data-theme', 'dark')
    document.documentElement.classList.add('dark')
  }, [])

  const toggleTheme = () => {
    console.warn('A troca de tema foi desativada. O sistema está fixo em Modo Escuro.')
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
