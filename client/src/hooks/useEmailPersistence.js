// useEmailPersistence.js - React hook for reliable email editor persistence
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { EmailPersistenceManager, debouncedSaver } from '../utils/emailDatabase';

// Global flag to block ALL saves during email switching
let globalSaveBlocked = false;
let globalSaveBlockTimer = null;

export function blockAllSaves(duration = 3000) {
  globalSaveBlocked = true;

  // Also expose to window for other modules to check
  if (typeof window !== 'undefined') {
    window.globalSaveBlocked = true;
  }

  if (globalSaveBlockTimer) {
    clearTimeout(globalSaveBlockTimer);
  }
  globalSaveBlockTimer = setTimeout(() => {
    globalSaveBlocked = false;
    if (typeof window !== 'undefined') {
      window.globalSaveBlocked = false;
    }
    console.log('🔓 [GLOBAL] Re-enabled all saves after protection period');
  }, duration);
  console.log(`🔒 [GLOBAL] Blocked ALL saves for ${duration}ms`);
}

export function useEmailPersistence(emailKey, initialValue = { components: [], html: '', subject: '' }) {
  // Ensure initialValue always has proper array for components
  const safeInitialValue = {
    ...initialValue,
    components: Array.isArray(initialValue.components) ? initialValue.components : []
  };
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [localState, setLocalState] = useState(safeInitialValue);
  const prevEmailKeyRef = useRef(emailKey);
  const lastSavedRef = useRef(null);
  const loadingCompleteTimeRef = useRef(null);
  const dataLoadedTimeRef = useRef(null);

  // Live query to watch for changes in the database
  const savedEdit = useLiveQuery(
    () => EmailPersistenceManager.loadEmailEdit(emailKey),
    [emailKey]
  );

  // Load data when email key changes
  useEffect(() => {
    if (prevEmailKeyRef.current !== emailKey) {
      console.log('🔄 [useEmailPersistence] Email key changed:', prevEmailKeyRef.current, '→', emailKey);
      prevEmailKeyRef.current = emailKey;

      setIsLoading(true);
      setSaveStatus('idle');

      // Load saved data or use initial value
      const loadData = async () => {
        try {
          const savedData = await EmailPersistenceManager.loadEmailEdit(emailKey);

          if (savedData && await EmailPersistenceManager.hasMeaningfulEdit(emailKey)) {
            console.log('✅ [useEmailPersistence] Loading meaningful saved edit:', {
              components: savedData.components?.length || 0,
              htmlLength: savedData.html?.length || 0,
              subject: savedData.subject || 'empty'
            });

            // Ensure saved data has valid components array
            const safeSavedData = {
              ...savedData,
              components: Array.isArray(savedData.components) ? savedData.components : []
            };

            setLocalState(safeSavedData);
            lastSavedRef.current = JSON.stringify(safeSavedData);
            dataLoadedTimeRef.current = Date.now(); // Track when meaningful data was loaded
            console.log('🔄 [useEmailPersistence] Local state updated with saved data');
          } else {
            console.log('📝 [useEmailPersistence] No meaningful save found, preserving current state to avoid overwriting original content');
            // DON'T reset to initial value - preserve whatever is currently loaded
            // This prevents overwriting original email content that was just loaded
            lastSavedRef.current = JSON.stringify(localState);
          }
        } catch (error) {
          console.error('❌ [useEmailPersistence] Failed to load data:', error);
          setLocalState(safeInitialValue);
          lastSavedRef.current = JSON.stringify(safeInitialValue);
        } finally {
          setIsLoading(false);
          loadingCompleteTimeRef.current = Date.now();
        }
      };

      loadData();
    }
  }, [emailKey, initialValue]);

  // Update local state when database changes (from other tabs/components)
  useEffect(() => {
    if (!isLoading && savedEdit !== undefined) {
      const currentStateString = JSON.stringify(localState);
      const savedStateString = JSON.stringify(savedEdit);

      // Only update if database has meaningful data and it's not from our own save
      if (savedEdit && savedStateString !== lastSavedRef.current && savedStateString !== currentStateString) {
        const hasComponents = savedEdit.components && savedEdit.components.length > 0;
        const hasHtml = savedEdit.html && savedEdit.html.length > 100;

        if (hasComponents || hasHtml) {
          console.log('🔄 [useEmailPersistence] Database updated from external source with meaningful data');

          // Ensure external data has valid components array
          const safeSavedEdit = {
            ...savedEdit,
            components: Array.isArray(savedEdit.components) ? savedEdit.components : []
          };

          setLocalState(safeSavedEdit);
          lastSavedRef.current = JSON.stringify(safeSavedEdit);
          dataLoadedTimeRef.current = Date.now(); // Reset protection timer when external data loads
          console.log('🛡️ [useEmailPersistence] Reset data protection timer for external update');
        } else {
          console.log('🔄 [useEmailPersistence] Database updated but no meaningful data - preserving current state');
        }
      }
    }
  }, [savedEdit, localState, isLoading]);

  // Debounced save function
  const saveData = useCallback(async (data) => {
    const dataString = JSON.stringify(data);

    console.log('🔍 [useEmailPersistence] Save attempt:', {
      emailKey,
      components: data.components?.length || 0,
      htmlLength: data.html?.length || 0,
      subject: data.subject || 'no subject'
    });

    // NUCLEAR OPTION: Block ALL saves during email switching
    if (globalSaveBlocked) {
      console.log('🔒 [GLOBAL] Save blocked by global protection');
      return;
    }

    // Don't save if data hasn't changed
    if (dataString === lastSavedRef.current) {
      console.log('🛡️ [useEmailPersistence] Skipping save - data unchanged');
      return;
    }

    // CRITICAL FIX: Don't save while loading to prevent overwriting loaded data
    if (isLoading) {
      console.log('🛡️ [useEmailPersistence] Skipping save while loading data');
      return;
    }

    // CRITICAL FIX: Add longer settling period after loading completes
    const timeSinceLoading = loadingCompleteTimeRef.current ? Date.now() - loadingCompleteTimeRef.current : Infinity;
    if (timeSinceLoading < 1000) { // Extended to 1000ms settling period
      console.log(`🛡️ [useEmailPersistence] Skipping save during settling period (${timeSinceLoading}ms since loading)`);
      return;
    }

    // CRITICAL FIX: Add protection period after meaningful data was loaded
    const timeSinceDataLoaded = dataLoadedTimeRef.current ? Date.now() - dataLoadedTimeRef.current : Infinity;
    if (timeSinceDataLoaded < 2000) { // 2 second protection after loading meaningful data
      console.log(`🛡️ [useEmailPersistence] Skipping save during data protection period (${timeSinceDataLoaded}ms since data load)`);
      return;
    }

    setSaveStatus('saving');

    try {
      // Use debounced saver for automatic saves
      debouncedSaver.save(emailKey, data);

      // Update our reference immediately to prevent duplicate saves
      lastSavedRef.current = dataString;

      // Set status to saved after a short delay
      setTimeout(() => setSaveStatus('saved'), 100);

      console.log('💾 [useEmailPersistence] Data queued for save:', emailKey);
    } catch (error) {
      console.error('❌ [useEmailPersistence] Save failed:', error);
      setSaveStatus('error');
    }
  }, [emailKey]);

  // Force immediate save (for critical saves like before navigation)
  const saveImmediately = useCallback(async (data) => {
    setSaveStatus('saving');

    try {
      await debouncedSaver.saveImmediately(emailKey, data);
      lastSavedRef.current = JSON.stringify(data);
      setSaveStatus('saved');
      console.log('⚡ [useEmailPersistence] Data saved immediately:', emailKey);
    } catch (error) {
      console.error('❌ [useEmailPersistence] Immediate save failed:', error);
      setSaveStatus('error');
      throw error;
    }
  }, [emailKey]);

  // Update state and trigger save
  const updateState = useCallback((newData) => {
    setLocalState(newData);
    saveData(newData);
  }, [saveData]);

  // Partial update helper
  const updatePartial = useCallback((partialData) => {
    setLocalState(prev => {
      const newState = { ...prev, ...partialData };
      saveData(newState);
      return newState;
    });
  }, [saveData]);

  // Clear data
  const clearData = useCallback(async () => {
    try {
      await EmailPersistenceManager.deleteEmailEdit(emailKey);
      setLocalState(safeInitialValue);
      lastSavedRef.current = JSON.stringify(safeInitialValue);
      setSaveStatus('idle');
      console.log('🗑️ [useEmailPersistence] Data cleared for:', emailKey);
    } catch (error) {
      console.error('❌ [useEmailPersistence] Clear failed:', error);
      throw error;
    }
  }, [emailKey, initialValue]);

  return {
    // State
    data: localState,
    isLoading,
    saveStatus,

    // Actions
    updateState,
    updatePartial,
    saveImmediately,
    clearData,

    // Direct state setters for specific fields
    setComponents: useCallback((components) => updatePartial({ components }), [updatePartial]),
    setHtml: useCallback((html) => updatePartial({ html }), [updatePartial]),
    setSubject: useCallback((subject) => updatePartial({ subject }), [updatePartial]),

    // Helpers
    hasMeaningfulData: localState.components?.length > 0 || localState.html?.length > 100
  };
}