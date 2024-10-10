import React, { createContext, useState, useMemo, useCallback } from 'react';

interface DebugContextType {
  isDebugEnabled: boolean;
  toggleDebug: () => void;
}

export const DebugContext = createContext<DebugContextType>({
  isDebugEnabled: false,
  toggleDebug: () => {},
});

export const DebugProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDebugEnabled, setIsDebugEnabled] = useState(false);

  const toggleDebug = useCallback(() => {
    setIsDebugEnabled((prev) => {
      const newValue = !prev;
      console.log('Debug mode toggled:', newValue);
      return newValue;
    });
  }, []);

  const value = useMemo(
    () => ({ isDebugEnabled, toggleDebug }),
    [isDebugEnabled, toggleDebug],
  );

  return (
    <DebugContext.Provider value={value}>{children}</DebugContext.Provider>
  );
};
