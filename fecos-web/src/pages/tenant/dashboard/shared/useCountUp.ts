import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, duration = 700): number {
  const safe = Number.isFinite(target) ? target : 0
  const [value, setValue] = useState(0)
  const raf = useRef<number>(0)

  useEffect(() => {
    if (safe === 0) { setValue(0); return }
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(ease * safe))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [safe, duration])

  return value
}
