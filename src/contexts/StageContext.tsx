import React, { createContext, useContext, useRef } from 'react';

interface StageContextType {
  mainStageContainerRef: React.RefObject<HTMLDivElement> | null;
}

const StageContext = createContext<StageContextType>({ mainStageContainerRef: null });

export const useStageContext = () => useContext(StageContext);

export const StageContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mainStageContainerRef = useRef<HTMLDivElement>(null);
  
  return (
    <StageContext.Provider value={{ mainStageContainerRef }}>
      <div ref={mainStageContainerRef} className="relative w-full h-full">
        {children}
      </div>
    </StageContext.Provider>
  );
};