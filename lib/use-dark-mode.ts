import * as React from 'react'

const DARK_MODE_STORAGE_KEY = 'darkMode'
const DARK_MODE_EVENT = 'noxionite:dark-mode-change'

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = React.useState(false)

  React.useEffect(() => {
    const initialValue = readDarkModePreference()
    setIsDarkMode(initialValue)
    applyDarkModeClass(initialValue)

    const handleDarkModeChange = (event: Event) => {
      const nextValue = (event as CustomEvent<boolean>).detail
      if (typeof nextValue === 'boolean') {
        setIsDarkMode(nextValue)
        applyDarkModeClass(nextValue)
      }
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== DARK_MODE_STORAGE_KEY) return
      const nextValue = parseStoredDarkMode(event.newValue)
      if (nextValue === null) return

      setIsDarkMode(nextValue)
      applyDarkModeClass(nextValue)
    }

    window.addEventListener(DARK_MODE_EVENT, handleDarkModeChange)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener(DARK_MODE_EVENT, handleDarkModeChange)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  const toggleDarkMode = React.useCallback(() => {
    setIsDarkMode((currentValue) => {
      const nextValue = !currentValue
      persistDarkModePreference(nextValue)
      applyDarkModeClass(nextValue)

      window.dispatchEvent(
        new CustomEvent<boolean>(DARK_MODE_EVENT, { detail: nextValue })
      )

      return nextValue
    })
  }, [])

  return {
    isDarkMode,
    toggleDarkMode
  }
}

function readDarkModePreference(): boolean {
  const storedValue = parseStoredDarkMode(getStoredDarkModePreference())
  if (storedValue !== null) {
    return storedValue
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

function getStoredDarkModePreference(): string | null {
  try {
    return window.localStorage.getItem(DARK_MODE_STORAGE_KEY)
  } catch {
    return null
  }
}

function persistDarkModePreference(value: boolean) {
  try {
    window.localStorage.setItem(DARK_MODE_STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Ignore storage failures; body classes still update for the current page.
  }
}

function parseStoredDarkMode(value: string | null): boolean | null {
  if (value === null) return null

  try {
    const parsedValue = JSON.parse(value)
    return typeof parsedValue === 'boolean' ? parsedValue : null
  } catch {
    return null
  }
}

function applyDarkModeClass(isDarkMode: boolean) {
  document.body.classList.toggle('dark-mode', isDarkMode)
  document.body.classList.toggle('light-mode', !isDarkMode)
}
