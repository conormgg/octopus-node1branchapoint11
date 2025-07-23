import { useState, useCallback } from 'react';

interface ObjectLockingState {
  [objectId: string]: boolean;
}

export const useObjectLocking = (initialObjectId?: string) => {
  const [lockedObjects, setLockedObjects] = useState<ObjectLockingState>({});

  const isObjectLocked = useCallback((objectId: string) => {
    return lockedObjects[objectId] || false;
  }, [lockedObjects]);

  const toggleObjectLock = useCallback((objectId: string) => {
    setLockedObjects(prev => ({
      ...prev,
      [objectId]: !prev[objectId]
    }));
  }, []);

  const lockObject = useCallback((objectId: string) => {
    setLockedObjects(prev => ({
      ...prev,
      [objectId]: true
    }));
  }, []);

  const unlockObject = useCallback((objectId: string) => {
    setLockedObjects(prev => ({
      ...prev,
      [objectId]: false
    }));
  }, []);

  const clearAllLocks = useCallback(() => {
    setLockedObjects({});
  }, []);

  return {
    isObjectLocked: initialObjectId ? isObjectLocked(initialObjectId) : false,
    toggleObjectLock,
    lockObject,
    unlockObject,
    clearAllLocks,
    lockedObjects
  };
};