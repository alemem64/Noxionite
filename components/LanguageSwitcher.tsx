import { IoChevronDown } from '@react-icons/all-files/io5/IoChevronDown'
import { useRouter } from 'next/router'
import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'next-i18next'

export function LanguageSwitcher() {
  const router = useRouter()
  const { t } = useTranslation('languages')
  const [isOpen, setIsOpen] = React.useState(false)
  const buttonRef = React.useRef<HTMLDivElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties>({})
  const [mounted, setMounted] = React.useState(false)

  const { locale, locales, asPath } = router

  const currentLanguageShort = locale?.toUpperCase() || 'EN'

  const handleLanguageChange = (newLocale: string) => {
    void router.push(asPath, asPath, { locale: newLocale })
    setIsOpen(false)
  }

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuStyle({
        position: 'fixed',
        top: `${rect.bottom + 5}px`,
        left: `${rect.left}px`,
        zIndex: 1001
      })
    }
  }, [isOpen])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const menu =
    isOpen &&
    mounted &&
    createPortal(
      <div ref={menuRef} className='language-switcher-menu' style={menuStyle}>
        {locales?.map((availableLocale) => (
          <a
            key={availableLocale}
            onClick={() => handleLanguageChange(availableLocale)}
          >
            {t(`lang_${availableLocale}`)}
          </a>
        ))}
      </div>,
      document.body
    )

  return (
    <>
      <div
        ref={buttonRef}
        className='glass-item'
        style={{ position: 'relative' }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'inherit'
          }}
        >
          <span>{currentLanguageShort}</span>
          <IoChevronDown
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          />
        </button>
      </div>
      {menu}
    </>
  )
}
