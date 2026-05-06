import { createContext, useContext, useState, useCallback } from 'react'

const DataContext = createContext({ refreshKey: 0, triggerRefresh: () => {} })

export function DataProvider({ children }) {
  const [refreshKey, setRefreshKey] = useState(0)
  const triggerRefresh = useCallback(() => setRefreshKey(k => k + 1), [])
  return (
    <DataContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  return useContext(DataContext)
}
