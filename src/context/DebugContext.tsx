import React, {
  createContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react';

interface DebugContextType {
  isDebugEnabled: boolean;
  toggleDebug: () => void;
  debugLogs: any[];
  clearLogs: () => void;
}

export const DebugContext = createContext<DebugContextType>({
  isDebugEnabled: false,
  toggleDebug: () => {},
  debugLogs: [],
  clearLogs: () => {},
});

export const DebugProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDebugEnabled, setIsDebugEnabled] = useState(false);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);

  const toggleDebug = useCallback(() => {
    setIsDebugEnabled((prev) => {
      const newValue = !prev;
      console.log('Debug mode toggled:', newValue);
      if (!newValue) {
        // Clear logs when disabling debug mode
        setDebugLogs([]);
      }
      return newValue;
    });
  }, []);

  const clearLogs = useCallback(() => {
    setDebugLogs([]);
  }, []);

  useEffect(() => {
    if (isDebugEnabled) {
      // Initialize debug storage when enabled
      chrome.storage.local.get(['debugLogs'], (result) => {
        if (result.debugLogs) {
          setDebugLogs(result.debugLogs);
        }
      });
    }
  }, [isDebugEnabled]);

  const value = useMemo(
    () => ({
      isDebugEnabled,
      toggleDebug,
      debugLogs,
      clearLogs,
    }),
    [isDebugEnabled, toggleDebug, debugLogs, clearLogs],
  );

  return (
    <DebugContext.Provider value={value}>{children}</DebugContext.Provider>
  );
};
