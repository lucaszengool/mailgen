// SIMPLE EMAIL PERSISTENCE - NO BULLSHIT VERSION
import { useState, useEffect, useCallback } from 'react';
import { EmailPersistenceManager } from '../utils/emailDatabase';

export function useSimpleEmailPersistence(emailKey, initialData = { components: [], html: '', subject: '' }) {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);

  // Load data on mount or email key change
  useEffect(() => {
    const loadData = async () => {
      console.log('📁 [SIMPLE] Loading data for:', emailKey);
      setIsLoading(true);

      try {
        const savedData = await EmailPersistenceManager.loadEmailEdit(emailKey);

        if (savedData) {
          console.log('✅ [SIMPLE] Loaded data:', {
            components: savedData.components?.length || 0,
            htmlLength: savedData.html?.length || 0
          });
          setData(savedData);
        } else {
          console.log('📝 [SIMPLE] No saved data, using initial');
          setData(initialData);
        }
      } catch (error) {
        console.error('❌ [SIMPLE] Load failed:', error);
        setData(initialData);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [emailKey]);

  // Simple save function with immediate save
  const saveData = useCallback(async (newData) => {
    console.log('💾 [SIMPLE] Saving:', {
      emailKey,
      components: newData.components?.length || 0
    });

    try {
      await EmailPersistenceManager.saveEmailEdit(emailKey, newData);
      console.log('✅ [SIMPLE] Saved successfully');
    } catch (error) {
      console.error('❌ [SIMPLE] Save failed:', error);
    }
  }, [emailKey]);

  // Update function that immediately saves
  const updateData = useCallback((newData) => {
    console.log('🔄 [SIMPLE] Updating data');
    setData(newData);
    saveData(newData);
  }, [saveData]);

  // Partial update helper
  const updatePartial = useCallback((partialData) => {
    setData(prev => {
      const newData = { ...prev, ...partialData };
      saveData(newData);
      return newData;
    });
  }, [saveData]);

  return {
    data,
    isLoading,
    updateData,
    updatePartial,
    setComponents: useCallback((components) => updatePartial({ components }), [updatePartial]),
    setHtml: useCallback((html) => updatePartial({ html }), [updatePartial]),
    setSubject: useCallback((subject) => updatePartial({ subject }), [updatePartial]),
  };
}