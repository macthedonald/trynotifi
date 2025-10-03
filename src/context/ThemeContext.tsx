'use client'

import { createContext, useContext } from 'react'

type Theme = 'light'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const value: ThemeContextType = {
    theme: 'light',
    setTheme: () => {}, // No-op since theme is always light
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
