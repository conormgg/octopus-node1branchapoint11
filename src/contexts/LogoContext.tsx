
import React, { createContext, useContext, useState, useEffect } from 'react';

interface LogoContextType {
  logoUrl: string;
  setLogoUrl: (url: string) => void;
  resetToOriginal: () => void;
}

const ORIGINAL_LOGO_URL = "/lovable-uploads/5c508699-4155-42ef-a977-c436f4734ca4.png";
const LOGO_STORAGE_KEY = "octopi-custom-logo";

const LogoContext = createContext<LogoContextType | undefined>(undefined);

export const LogoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logoUrl, setLogoUrlState] = useState<string>(ORIGINAL_LOGO_URL);

  useEffect(() => {
    // Load custom logo from localStorage on mount
    const savedLogo = localStorage.getItem(LOGO_STORAGE_KEY);
    if (savedLogo) {
      setLogoUrlState(savedLogo);
    }
  }, []);

  const setLogoUrl = (url: string) => {
    setLogoUrlState(url);
    localStorage.setItem(LOGO_STORAGE_KEY, url);
  };

  const resetToOriginal = () => {
    setLogoUrlState(ORIGINAL_LOGO_URL);
    localStorage.removeItem(LOGO_STORAGE_KEY);
  };

  return (
    <LogoContext.Provider value={{ logoUrl, setLogoUrl, resetToOriginal }}>
      {children}
    </LogoContext.Provider>
  );
};

export const useLogo = () => {
  const context = useContext(LogoContext);
  if (context === undefined) {
    throw new Error('useLogo must be used within a LogoProvider');
  }
  return context;
};
