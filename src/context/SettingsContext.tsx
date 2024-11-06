import React, {
  useMemo,
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { DEFAULT_SETTINGS, IEditorOptions } from '../constants';
import {
  getSettings,
  updateSettings as updateSettingsInStorage,
  resetSettings as resetSettingsInStorage,
} from './settingsManager';

interface SettingsContextType {
  settings: IEditorOptions;
  updateSettings: (newSettings: Partial<IEditorOptions>) => Promise<void>;
  resetSettings: () => Promise<void>;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<IEditorOptions>(
    {} as IEditorOptions,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loadedSettings = await getSettings();
        setSettings(loadedSettings);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading settings: ', error);
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettingsHandler = useCallback(
    async (newSettings: Partial<IEditorOptions>) => {
      const updatedSettings = await updateSettingsInStorage(newSettings);
      setSettings(updatedSettings);
    },
    [],
  );

  const resetSettingsHandler = useCallback(async () => {
    await resetSettingsInStorage();
    setSettings((prev) => ({ ...prev, DEFAULT_SETTINGS }));
  }, []);

  return useMemo(
    () => (
      <SettingsContext.Provider
        value={{
          settings,
          updateSettings: updateSettingsHandler,
          resetSettings: resetSettingsHandler,
          isLoading,
        }}
      >
        {children}
      </SettingsContext.Provider>
    ),
    [settings, updateSettingsHandler, resetSettingsHandler, isLoading],
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
