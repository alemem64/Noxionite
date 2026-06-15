import React, { useState, useEffect, useRef, ReactNode } from 'react'

interface MagnetProps {
  children: ReactNode
  padding?: number
  disabled?: boolean
  magnetStrength?: number
  activeTransition?: string
  inactiveTransition?: string
  wrapperClassName?: string
  innerClassName?: string
  style?: React.CSSProperties
}

const Magnet: React.FC<MagnetProps> = ({
  children,
  padding = 300,
  disabled = false,
  magnetStrength = 1.5,
  activeTransition = 'transform 0.3s ease-out',
  inactiveTransition = 'transform 0.5s ease-in-out',
  wrapperClassName = '',
  innerClassName = '',
  style,
  ...props
}) => {
  const [isActive, setIsActive] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const magnetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (disabled) {
      setPosition({ x: 0, y: 0 })
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!magnetRef.current) return

      const { left, top, width, height } =
        magnetRef.current.getBoundingClientRect()
      const centerX = left + width / 2
      const centerY = top + height / 2

      const distX = Math.abs(e.clientX - centerX)
      const distY = Math.abs(e.clientY - centerY)

      if (distX < width / 2 + padding && distY < height / 2 + padding) {
        setIsActive(true)

        const offsetX = (e.clientX - centerX) / magnetStrength
        const offsetY = (e.clientY - centerY) / magnetStrength
        setPosition({ x: offsetX, y: offsetY })
      } else {
        setIsActive(false)
        setPosition({ x: 0, y: 0 })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [padding, disabled, magnetStrength])

  const transitionStyle = isActive ? activeTransition : inactiveTransition

  return (
    <div
      ref={magnetRef}
      className={wrapperClassName}
      style={{
        position: 'relative',
        display: 'inline-block',
        ...style
      }}
      {...props}
    >
      <div
        className={innerClassName}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          transition: transitionStyle,
          willChange: 'transform'
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default Magnet
