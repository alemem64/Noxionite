import '@fisch0920/config/ts-reset'

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number
  }
}
