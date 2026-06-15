import React from 'react'
import styles from 'styles/components/react-bits/ShinyText.module.css'
import { useDarkMode } from '@/lib/use-dark-mode'

interface ShinyTextProps {
  text: string
  disabled?: boolean
  speed?: number
  className?: string
}

const ShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 5,
  className = ''
}) => {
  const { isDarkMode } = useDarkMode()
  const animationDuration = `${speed}s`

  return (
    <div
      className={`${styles.shinyText} ${disabled ? styles.disabled : ''} ${!isDarkMode ? styles.lightMode : ''} ${className}`}
      style={{ animationDuration }}
    >
      {text}
    </div>
  )
}

export default ShinyText
