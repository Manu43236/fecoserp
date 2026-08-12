import { createContext, useContext, useState, type ReactNode } from 'react'

interface TabsContextValue {
  active: string
  setActive: (v: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabs() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tabs components must be used inside <Tabs>')
  return ctx
}

interface TabsProps {
  defaultValue: string
  children: ReactNode
  className?: string
}

export function Tabs({ defaultValue, children, className = '' }: TabsProps) {
  const [active, setActive] = useState(defaultValue)
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabsListProps { children: ReactNode }

export function TabsList({ children }: TabsListProps) {
  return (
    <div
      className="flex border-b gap-0"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: ReactNode
}

export function TabsTrigger({ value, children }: TabsTriggerProps) {
  const { active, setActive } = useTabs()
  const isActive = active === value

  return (
    <button
      onClick={() => setActive(value)}
      className="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-150 -mb-px"
      style={{
        borderBottomColor: isActive ? 'var(--color-primary)' : 'transparent',
        color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
      }}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: ReactNode
}

export function TabsContent({ value, children }: TabsContentProps) {
  const { active } = useTabs()
  if (active !== value) return null
  return <div className="pt-4">{children}</div>
}
