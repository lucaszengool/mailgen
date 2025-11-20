import React from 'react';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSimpleEmailPersistence } from '../hooks/useSimpleEmailPersistence';
import { EmailPersistenceManager, debouncedSaver } from '../utils/emailDatabase';
import {
  PlusIcon,
  TrashIcon,
  PhotoIcon,
  LinkIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilIcon,
  EnvelopeIcon,
  SwatchIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import TemplateSelectionModal from './TemplateSelectionModal';
import { EMAIL_TEMPLATES } from '../data/emailTemplatesConsistent.js';
import toast from 'react-hot-toast';

export default function ProfessionalEmailEditor(props) {
  const {
    emailData: emailDataProp,
    availableEmails = [],
    onSave,
    onSend,
    onClose,
    onRefresh,
    campaignId,
    prospectId
  } = props;

  // Track if emails have been loaded to prevent constant re-fetching - MOVED HERE TO TEST
  const [emailsLoaded, setEmailsLoaded] = useState(false);

  // CRITICAL FIX: If emailData is null but availableEmails has data, use the first email
  // Use useMemo to prevent creating new objects on every render
  const emailData = useMemo(() => {
    return emailDataProp || (availableEmails && availableEmails.length > 0 ? availableEmails[0] : null);
  }, [emailDataProp, availableEmails]);

  // MOVED: Load email data when component mounts or data changes - MOVED HERE TO FIX SCOPE
  useEffect(() => {
    console.log('📧 EMAIL LOADING EFFECT TRIGGERED');
    console.log('📧 emailsLoaded:', emailsLoaded);
    console.log('📧 true:', true);
    console.log('📧 emailData exists:', typeof emailData !== 'undefined', emailData);
    console.log('📧 availableEmails length:', availableEmails?.length || 0);

    // Safety check for emailData
    if (typeof emailData === 'undefined') {
      console.error('❌ emailData is undefined in useEffect');
      return;
    }

    // Early return if no meaningful changes
    if (emailsLoaded && !emailData && (!availableEmails || availableEmails.length === 0)) {
      console.log('📧 Already loaded emails and no new data, returning');
      return;
    }

    console.log('✅ useEffect is working correctly in proper scope');
  }, []); // Simplified dependencies for now

  // TEMPORARILY DISABLED - Render tracking for debugging
  // const renderCount = useRef(0);
  // renderCount.current += 1;
  // console.log(`🔄 RENDER #${renderCount.current} - INVESTIGATING INFINITE LOOP`);
  // console.log('📧 emailData?.to:', emailData?.to);
  // console.log('📧 availableEmails?.length:', availableEmails?.length);

  // TEMPORARILY DISABLED - Dependency tracking for debugging
  // const prevProps = useRef();
  // useEffect(() => {
  //   if (prevProps.current) {
  //     console.log('🔍 PROP CHANGES:');
  //     if (prevProps.current.emailDataProp !== emailDataProp) {
  //       console.log('  📧 emailDataProp CHANGED:', prevProps.current.emailDataProp, '->', emailDataProp);
  //     }
  //     if (prevProps.current.availableEmails !== availableEmails) {
  //       console.log('  📧 availableEmails CHANGED (new array reference)');
  //     }
  //     if (prevProps.current.campaignId !== campaignId) {
  //       console.log('  📧 campaignId CHANGED:', prevProps.current.campaignId, '->', campaignId);
  //     }
  //   }
  //   prevProps.current = { emailDataProp, availableEmails, campaignId, prospectId };
  // });

  // Track when we're manually switching emails to prevent sync conflicts
  const [isManuallySwitching, setIsManuallySwitching] = useState(false);
  // REMOVED: hasInitialLoad state - no longer needed
  // Ref to prevent React from re-rendering contenteditable areas with inline components
  const contentEditableRefs = useRef(new Map());
  const [preserveInlineComponents, setPreserveInlineComponents] = useState(true);
  const [frozenHTML, setFrozenHTML] = useState(new Map()); // Store HTML to prevent React overwrites

  // Template Selection State
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Props initialized successfully

  // Declare state variables first
  // CRITICAL FIX: Find the correct email index that matches emailData.to
  const getCorrectEmailIndex = useCallback(() => {
    if (!emailData?.to || !availableEmails?.length) return 0;

    const matchingIndex = availableEmails.findIndex(email => email.to === emailData.to);
    // Disabled debug logs for testing
    return matchingIndex >= 0 ? matchingIndex : 0;
  }, [emailData?.to, availableEmails]);

  const [currentEmailIndex, setCurrentEmailIndex] = useState(() => getCorrectEmailIndex());

  // CRITICAL FIX: Track current email independently since emailData prop doesn't update
  // MUST be declared before useMemo that uses it
  const [currentEmail, setCurrentEmail] = useState(() => {
    // Initialize with emailData if available, ensuring we save it as last edited
    if (emailData?.to) {
      localStorage.setItem('email_editor_last_edited_email', emailData.to);
      console.log('💾 Initial currentEmail set and saved as last edited:', emailData.to);
    }
    return emailData;
  });

  // TEMPORARILY DISABLED - Current email tracking for debugging
  // const prevCurrentEmail = useRef();
  // useEffect(() => {
  //   if (prevCurrentEmail.current !== currentEmail) {
  //     console.log('📧 CURRENT EMAIL OBJECT CHANGED!');
  //     // ... rest of logging
  //     prevCurrentEmail.current = currentEmail;
  //   }
  // });

  // DISABLED - emailData sync effect that was causing conflicts with manual switching
  // The component now relies entirely on manual email switching and the parent component
  // should restore the correct email on page load using the last edited email tracking

  // Update currentEmailIndex when availableEmails changes to ensure correct email is selected
  useEffect(() => {
    const correctIndex = getCorrectEmailIndex();
    if (correctIndex !== currentEmailIndex) {
      console.log('🔧 CORRECTING EMAIL INDEX from', currentEmailIndex, 'to', correctIndex);
      console.log('🔧 This should fix the auto-save key mismatch!');
      setCurrentEmailIndex(correctIndex);
    }
  }, [availableEmails, emailData?.to]);

  // CRITICAL FIX: Synchronize template with email data
  useEffect(() => {
    console.log('🎨 TEMPLATE SYNC CHECK:', {
      emailDataTemplate: emailData?.template,
      emailDataTemplateId: emailData?.templateId,
      currentTemplate: currentTemplate
    });

    // Check if email has template information and it's different from current
    const emailTemplateId = emailData?.templateId || emailData?.template;
    if (emailTemplateId && emailTemplateId !== currentTemplate) {
      console.log('🎨 SYNCING TEMPLATE:', emailTemplateId);
      setCurrentTemplate(emailTemplateId);
    } else if (emailData && !emailTemplateId && !currentTemplate) {
      // Default to professional partnership if no template specified
      console.log('🎨 DEFAULTING TO PROFESSIONAL PARTNERSHIP TEMPLATE');
      setCurrentTemplate('professional_partnership');
    }
  }, [emailData?.templateId, emailData?.template, currentTemplate]);

  // REMOVED: Old complex getAutoSaveKey function - causes conflicts
  /*
    // Use parameters if provided, otherwise fall back to closure variables
    const useEmailData = emailDataParam !== null ? emailDataParam : emailData;
    const useCampaignId = campaignIdParam !== null ? campaignIdParam : campaignId;
    const useProspectId = prospectIdParam !== null ? prospectIdParam : prospectId;
    const useEmailIndex = emailIndexParam !== null ? emailIndexParam : currentEmailIndex;
    const useAvailableEmails = availableEmailsParam !== null ? availableEmailsParam : availableEmails;

    // CRITICAL FIX: Always prioritize emailData.to over availableEmails
    // This prevents auto-save key mismatches when emailData doesn't match availableEmails[0]
    let currentEmail;
    if (useEmailData?.to) {
      currentEmail = useEmailData;
      console.log('🔑 🚀 USING EMAILDATA as source of truth');
    } else {
      currentEmail = useAvailableEmails && useAvailableEmails[useEmailIndex];
      console.log('🔑 ⚠️ FALLBACK to availableEmails');
    }

    console.log('🔑 Getting auto-save key for:');
    console.log('🔑 useEmailData:', useEmailData ? 'EXISTS' : 'NULL');
    console.log('🔑 useEmailIndex:', useEmailIndex);
    console.log('🔑 useAvailableEmails length:', useAvailableEmails?.length || 0);
    if (useAvailableEmails && useAvailableEmails.length > 0) {
      console.log('🔑 useAvailableEmails[0].to:', useAvailableEmails[0]?.to);
      console.log('🔑 useAvailableEmails[useEmailIndex]:', useAvailableEmails[useEmailIndex] ? 'EXISTS' : 'NULL');
      if (useAvailableEmails[useEmailIndex]) {
        console.log('🔑 useAvailableEmails[useEmailIndex].to:', useAvailableEmails[useEmailIndex].to);
      }
    }
    console.log('🔑 currentEmail:', currentEmail ? 'EXISTS' : 'NULL');
    console.log('🔑 currentEmail.to:', currentEmail?.to);
    console.log('🔑 currentEmail keys:', currentEmail ? Object.keys(currentEmail) : 'NULL');

    // Priority: Use specific email identifier first
    // Try multiple possible email fields
    const emailAddress = currentEmail?.to || currentEmail?.email || currentEmail?.recipient || currentEmail?.recipientEmail;
    const emailId = currentEmail?.id || currentEmail?._id;

    console.log('🔑 Found emailAddress:', emailAddress);
    console.log('🔑 Found emailId:', emailId);

    if (emailAddress) {
      const key = `email_editor_autosave_email_${emailAddress.replace(/[^a-zA-Z0-9]/g, '_')}`;
      console.log('🔑 Using email-based key:', key);
      return key;
    }
    if (emailId) {
      const key = `email_editor_autosave_email_${emailId}`;
      console.log('🔑 Using id-based key:', key);
      return key;
    }
    if (currentEmail?.campaignId && useEmailIndex !== undefined) {
      const key = `email_editor_autosave_${currentEmail.campaignId}_email_${useEmailIndex}`;
      console.log('🔑 Using campaign+index key:', key);
      return key;
    }
    if (useCampaignId && useEmailIndex !== undefined) {
      const key = `email_editor_autosave_${useCampaignId}_email_${useEmailIndex}`;
      console.log('🔑 Using prop campaign+index key:', key);
      return key;
    }
    // Fallback for specific recipient
    if (useProspectId) {
      const key = `email_editor_autosave_prospect_${useProspectId}`;
      console.log('🔑 Using prospect key:', key);
      return key;
    }

    console.log('🔑 ⚠️ FALLING BACK TO DEFAULT KEY');
    return `email_editor_autosave_default`;
  */

  // REMOVED: Old autoSaveKey - now defined in the stable persistence section

  // REMOVED: Old auto-save key tracking

  // Check for auto-save data for THIS SPECIFIC EMAIL
  const getInitialAutoSaveData = () => {
    console.log('🔍 CHECKING FOR AUTO-SAVE FOR THIS SPECIFIC EMAIL');
    console.log('🔍 Current email autoSaveKey:', autoSaveKey);

    // First try the exact key for this email
    let savedData = localStorage.getItem(autoSaveKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const savedTime = new Date(parsed.timestamp).getTime();
        const currentTime = new Date().getTime();
        const hoursSinceLastSave = (currentTime - savedTime) / (1000 * 60 * 60);

        if (hoursSinceLastSave < 24 && (parsed.html || parsed.components?.length > 0)) {
          console.log('🚀 FOUND AUTO-SAVE FOR THIS EMAIL:', autoSaveKey);
          console.log('🚀 Subject:', parsed.subject);
          console.log('🚀 Components:', parsed.components?.length || 0);
          console.log('🚀 HTML length:', parsed.html?.length || 0);
          parsed._loadedFromKey = autoSaveKey;
          return parsed;
        } else {
          console.log('⏰ Auto-save too old, removing:', autoSaveKey);
          localStorage.removeItem(autoSaveKey);
        }
      } catch (e) {
        console.error('Failed to parse auto-save:', e);
        localStorage.removeItem(autoSaveKey);
      }
    }

    // If no exact match, try fallback keys but be more specific
    const fallbackKeys = [];

    if (emailData?.to) {
      fallbackKeys.push(`email_editor_autosave_email_${emailData.to.replace(/[^a-zA-Z0-9]/g, '_')}`);
    }
    if (emailData?.id) {
      fallbackKeys.push(`email_editor_autosave_email_${emailData.id}`);
    }

    for (const key of fallbackKeys) {
      savedData = localStorage.getItem(key);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          const savedTime = new Date(parsed.timestamp).getTime();
          const hoursSinceLastSave = (new Date().getTime() - savedTime) / (1000 * 60 * 60);

          if (hoursSinceLastSave < 24 && (parsed.html || parsed.components?.length > 0)) {
            console.log('🚀 FOUND FALLBACK AUTO-SAVE:', key);
            parsed._loadedFromKey = key;
            return parsed;
          }
        } catch (e) {
          // Ignore failed parsing
        }
      }
    }

    console.log('❌ No auto-save found for this email');
    return null;
  };

  // Don't do initial auto-save loading here - it's too early
  // Will be done in useEffect when availableEmails becomes available

  // Check for immediate auto-save data to prevent empty state flicker
  const getInitialComponents = () => {
    try {
      // CRITICAL FIX: Always prioritize emailData.to over availableEmails array
      const currentEmail = emailData;
      if (currentEmail?.to) {
        const autoSaveKey = `email_editor_autosave_email_${currentEmail.to.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const saved = localStorage.getItem(autoSaveKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.components && parsed.components.length > 0) {
            console.log('🚀 IMMEDIATE auto-save load:', parsed.components.length, 'components');
            console.log('🚀 ✅ Using emailData.to for consistency:', currentEmail.to);
            return parsed.components;
          }
        }
      }
    } catch (e) {
      console.log('🚀 IMMEDIATE auto-save failed:', e);
    }
    return [];
  };

  // STABLE PERSISTENCE: Use the stable localStorage hook for email components
  const autoSaveKey = useMemo(() => {
    if (currentEmail?.to) {
      return `email_editor_autosave_email_${currentEmail.to.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
    return 'email_editor_autosave_default';
  }, [currentEmail?.to]);

  // DISABLED: Force email editor to show exact campaign HTML only
  // const {
  //   data: persistedData,
  //   isLoading: isPersistenceLoading,
  //   updateData: updatePersistedData,
  //   updatePartial: updatePersistedPartial,
  //   setComponents: setPersistedComponents,
  //   setHtml: setPersistedHtml,
  //   setSubject: setPersistedSubject
  // } = useSimpleEmailPersistence(autoSaveKey, {
  //   components: [], // Always ensure this is an empty array
  //   subject: '',
  //   html: ''
  // });

  // FORCE NO PERSISTENCE - ALWAYS USE CAMPAIGN DATA
  const persistedData = { components: [], subject: '', html: '' };
  const isPersistenceLoading = false;
  const updatePersistedData = () => {};
  const updatePersistedPartial = () => {};
  const setPersistedComponents = () => {};
  const setPersistedHtml = () => {};
  const setPersistedSubject = () => {};

  // Force no meaningful data from persistence
  const hasMeaningfulData = false;

  // Extract components from persisted data - ensure it's always an array
  const emailComponents = Array.isArray(persistedData.components) ? persistedData.components : [];

  // Debug logging for component safety and rendering
  if (!Array.isArray(persistedData.components) && persistedData.components !== undefined) {
    console.error('❌ persistedData.components is not an array:', persistedData.components);
    console.error('❌ persistedData:', persistedData);
  }

  // Debug: Track when emailComponents changes for rendering issues
  useEffect(() => {
    console.log('🎨 [RENDER] emailComponents changed:', {
      autoSaveKey,
      componentCount: emailComponents.length,
      componentIds: emailComponents.map(c => c.id),
      isLoading: isPersistenceLoading,
      hasMeaningfulData
    });
  }, [emailComponents.length, autoSaveKey, isPersistenceLoading, hasMeaningfulData]);

  // Simple component change tracking for re-render
  const [lastComponentCount, setLastComponentCount] = useState(emailComponents.length);

  useEffect(() => {
    if (emailComponents.length !== lastComponentCount) {
      console.log('🔄 [SIMPLE] Component count changed:', lastComponentCount, '→', emailComponents.length);
      setLastComponentCount(emailComponents.length);
    }
  }, [emailComponents.length, lastComponentCount]);

  // Simple setEmailComponents function
  const setEmailComponents = useCallback((components) => {
    console.log('📝 [SIMPLE] Setting email components:', components?.length || 0);

    // Ensure components is always an array
    const safeComponents = Array.isArray(components) ? components : [];

    if (!Array.isArray(components) && components !== undefined) {
      console.error('❌ setEmailComponents called with non-array:', components);
    }

    // Direct save - no complex protection mechanisms
    setPersistedComponents(safeComponents);
  }, [setPersistedComponents]);

  // REMOVED: Old autosave loader - now handled by usePersistedState hook automatically

  // REMOVED: Debug wrapper for setEmailComponents
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  // 🔥 FIX: Enable subject customization with persistence
  const [subject, setSubject] = useState(currentEmail?.subject || '');

  // Update subject when switching emails
  useEffect(() => {
    if (currentEmail?.subject) {
      setSubject(currentEmail.subject);
    }
  }, [currentEmail?.to]); // Only update when email recipient changes

  // 🔥 FIX: Enable HTML customization with localStorage persistence
  const [rootEmailHTML, setRootEmailHTMLState] = useState(() => {
    // CRITICAL FIX: Prioritize AI-generated content over localStorage
    const emailHTML = currentEmail?.html || currentEmail?.body || '';

    // Only use localStorage if no AI-generated content exists
    if (!emailHTML || emailHTML.length < 100) {
      const emailKey = `email_custom_html_${currentEmail?.to}`;
      const savedHTML = localStorage.getItem(emailKey);
      console.log('📧 No AI content found, using localStorage:', !!savedHTML);
      return savedHTML || '';
    }

    console.log('📧 Loading AI-generated HTML, length:', emailHTML.length);
    return emailHTML;
  });

  // Wrapper to save HTML customizations to localStorage
  const setRootEmailHTML = useCallback((newHTML) => {
    setRootEmailHTMLState(newHTML);
    if (currentEmail?.to && newHTML) {
      const emailKey = `email_custom_html_${currentEmail.to}`;
      localStorage.setItem(emailKey, newHTML);
      console.log('💾 Saved HTML customization for:', currentEmail.to, 'length:', newHTML.length);
    }
  }, [currentEmail?.to]);

  // Update HTML when switching emails
  useEffect(() => {
    // CRITICAL FIX: Prioritize AI-generated content over localStorage
    const emailHTML = currentEmail?.html || currentEmail?.body || '';

    // Only check localStorage if no AI-generated content
    if (!emailHTML || emailHTML.length < 100) {
      const emailKey = `email_custom_html_${currentEmail?.to}`;
      const savedHTML = localStorage.getItem(emailKey);

      if (savedHTML) {
        console.log('📧 Loading HTML from localStorage for:', currentEmail?.to, 'length:', savedHTML.length);
        setRootEmailHTMLState(savedHTML);
        return;
      }
    }

    // Use AI-generated content
    if (emailHTML && emailHTML.length >= 100) {
      console.log('📧 Loading AI-generated HTML for:', currentEmail?.to, 'length:', emailHTML.length);
      setRootEmailHTMLState(emailHTML);
    } else {
      console.log('⚠️ No HTML content found for:', currentEmail?.to);
    }
  }, [currentEmail?.to, currentEmail?.html, currentEmail?.body]); // Watch for HTML changes
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add preheader state since it's not handled by useEmailPersistence
  const [preheader, setPreheader] = useState('');

  // REMOVED: Old debug effect
  const [refreshing, setRefreshing] = useState(false);
  const [pendingEmails, setPendingEmails] = useState([]);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [textDropPosition, setTextDropPosition] = useState(null);
  const [inlineComponents, setInlineComponents] = useState(new Map());
  const [originalEmailStyles, setOriginalEmailStyles] = useState('');
  const [showEmailList, setShowEmailList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplateConfirmation, setShowTemplateConfirmation] = useState(false);

  // 🔄 Pause/Resume Email Generation State
  const [isPaused, setIsPaused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastProcessedIndex, setLastProcessedIndex] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);
  const pauseRef = useRef(false); // Use ref for immediate pause detection
  // REMOVED: true state - not needed with stable hook

  // Moved above to prevent hoisting issues

  // Moved above to prevent hoisting issues

  // REMOVED: Old protected setters that were causing recursion - using stable hook setters now

  // REMOVED: Old secondary email data loading effect - not needed with stable persistence

  // TEMPORARILY DISABLED - Debug effects for testing
  // useEffect(() => {
  //   console.log('🔵 STATE CHANGE - emailComponents:', emailComponents.length, 'components');
  // }, [emailComponents.length]);

  // useEffect(() => {
  //   const checkLocalStorage = () => {
  //     console.log('🗄️ LOCALSTORAGE DEBUG:');
  //     console.log('🗄️ Current autoSaveKey:', autoSaveKey);
  //     // ... rest of localStorage check
  //   };
  //   checkLocalStorage();
  // }, [autoSaveKey]);

  // Auto-save functionality - save whenever content changes
  // DEBOUNCE TIMER - prevent excessive autosave calls
  const autoSaveTimerRef = useRef(null);

  // REMOVED: Old autosave effect - now handled by usePersistedState hook automatically

  // DISABLED: This effect was causing race conditions with the primary autosave loader
  // Dynamic auto-save loading when autoSaveKey changes (switching between emails)
  useEffect(() => {
    console.log('🔵 DISABLED EFFECT - primary autosave loader handles this now');
    return; // Exit early - primary loader handles this now
    console.log('🔵 New autoSaveKey:', autoSaveKey);
    console.log('🔵 Current emailComponents:', emailComponents.length);
    console.log('🔵 Current rootEmailHTML length:', rootEmailHTML?.length || 0);
    console.log('🔵 Current subject:', subject);
    console.log('🔵 Current true:', true);

    // Skip if this is the initial load (already handled) or if we're on default key
    if (autoSaveKey === 'email_editor_autosave_default') {
      console.log('⚠️ Using default key, skipping dynamic load');
      return;
    }

    // Check for auto-save specific to this email
    const savedData = localStorage.getItem(autoSaveKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const savedTime = new Date(parsed.timestamp).getTime();
        const currentTime = new Date().getTime();
        const hoursSinceLastSave = (currentTime - savedTime) / (1000 * 60 * 60);

        if (hoursSinceLastSave < 24 && (parsed.html || parsed.components?.length > 0)) {
          // CRITICAL FIX: Validate that auto-save data matches current email to prevent cross-contamination
          // CRITICAL FIX: Always prioritize emailData.to over availableEmails array
          const currentEmail = emailData;
          const currentEmailAddress = currentEmail?.to;
          const autoSaveEmailAddress = parsed.emailAddress || parsed.email?.to;

          // Only apply auto-save if it belongs to the current email
          if (currentEmailAddress && autoSaveEmailAddress && currentEmailAddress !== autoSaveEmailAddress) {
            console.log('🚫 AUTO-SAVE VALIDATION FAILED - Email mismatch');
            console.log('🚫 Current email:', currentEmailAddress);
            console.log('🚫 Auto-save email:', autoSaveEmailAddress);
            console.log('🚫 Ignoring mismatched auto-save data');
            // REMOVED setAutoSaveLoaded(false);
            return;
          }

          console.log('🔄 LOADING EMAIL-SPECIFIC AUTO-SAVE from:', autoSaveKey);
          console.log('🔄 Validated email match:', currentEmailAddress);
          console.log('🔄 Restoring Subject:', parsed.subject);
          console.log('🔄 Restoring Components:', parsed.components?.length || 0);
          console.log('🔄 Restoring HTML length:', parsed.html?.length || 0);

          // CRITICAL FIX: Use protected setters to maintain consistency with auto-save protection
          if (parsed.subject) setSubject(parsed.subject);
          if (parsed.preheader) setPreheader(parsed.preheader);

          if (parsed.components && parsed.components.length > 0) {
            setEmailComponents(parsed.components);
          }
          if (parsed.html) {
            setRootEmailHTML(parsed.html);
          }

          // REMOVED setAutoSaveLoaded(true);
          console.log('✅ SET true = true for this email');
          toast.success('Restored edits for this email');
        } else {
          console.log('⏰ No recent auto-save for this email');
          // REMOVED setAutoSaveLoaded(false);
        }
      } catch (e) {
        console.error('Failed to parse email-specific auto-save:', e);
        // REMOVED setAutoSaveLoaded(false);
      }
    } else {
      console.log('📭 No auto-save found for this email');
      // REMOVED setAutoSaveLoaded(false);
    }
  }, [autoSaveKey]); // Run when switching between emails
  
  // Freeze HTML content when inline components exist to prevent React from destroying them
  useEffect(() => {
    if (inlineComponents.size > 0) {
      console.log('🧊 Freezing HTML content - inline components detected');
      // Capture current HTML state
      const currentHTML = new Map();
      contentEditableRefs.current.forEach((element, key) => {
        if (element && element.innerHTML) {
          currentHTML.set(key, element.innerHTML);
          console.log(`🧊 Froze HTML for ${key}:`, element.innerHTML.substring(0, 100) + '...');
        }
      });
      setFrozenHTML(currentHTML);
    } else {
      console.log('❄️ No inline components - unfreezing HTML');
      setFrozenHTML(new Map());
    }
  }, [inlineComponents.size]);

  useEffect(() => {
    console.log('🔵 STATE CHANGE - rootEmailHTML length:', rootEmailHTML ? rootEmailHTML.length : 0);
    // Removed verbose logging to reduce render impact
  }, [rootEmailHTML?.length]); // Only trigger on length change

  // Enhanced function to parse email HTML into editable components
  const parseEmailToComponents = (email) => {
    if (!email) return [];

    console.log('🔄 ENHANCED HTML PARSING - Starting conversion to components');
    console.log('📧 EMAIL OBJECT:', email);

    const components = [];
    let originalStyles = '';

    // Get email content from various possible fields
    const emailContent = email.body || email.html || email.content || email.message || email.text;
    
    if (!emailContent) {
      console.log('❌ No email content found');
      return [];
    }

    console.log('📧 Found email content, length:', emailContent.length);
    console.log('📧 Content preview:', emailContent.substring(0, 500));

    try {
      // Parse HTML and extract components
      const parser = new DOMParser();
      const doc = parser.parseFromString(emailContent, 'text/html');
      
      // Extract and preserve original styles
      const styleElements = doc.querySelectorAll('style');
      originalStyles = Array.from(styleElements).map(style => style.innerHTML).join('\n');
      console.log('🎨 Extracted styles:', originalStyles.length, 'characters');
      
      // Find the main email container
      const emailWrapper = doc.querySelector('.email-wrapper') || 
                          doc.querySelector('[class*="email"]') || 
                          doc.querySelector('body') || 
                          doc.querySelector('div');
                          
      if (!emailWrapper) {
        console.log('❌ No email wrapper found, treating as plain text');
        // Create a single text component with all content
        components.push({
          id: 'imported_text_' + Date.now(),
          type: 'freeform_editor',
          content: {
            html: emailContent,
            fontSize: '16px',
            textColor: '#374151',
            lineHeight: '1.6',
            padding: '20px'
          }
        });
        return components;
      }

      console.log('📧 Found email wrapper:', emailWrapper.tagName, emailWrapper.className);
      
      // Convert child elements to components
      const childElements = Array.from(emailWrapper.children);
      console.log('🔍 Processing', childElements.length, 'child elements');
      
      childElements.forEach((element, index) => {
        const component = convertElementToComponent(element, index);
        if (component) {
          components.push(component);
          console.log('✅ Converted element to component:', component.type, component.id);
        }
      });
      
      // If no components were created, create a single freeform component
      if (components.length === 0) {
        console.log('🔄 No components created, creating single freeform component');
        components.push({
          id: 'imported_content_' + Date.now(),
          type: 'freeform_editor',
          content: {
            html: emailWrapper.innerHTML,
            fontSize: '16px',
            textColor: '#374151',
            lineHeight: '1.6',
            padding: '20px'
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Error parsing email HTML:', error);
      // Fallback: create a single text component
      components.push({
        id: 'fallback_text_' + Date.now(),
        type: 'freeform_editor',
        content: {
          html: emailContent,
          fontSize: '16px',
          textColor: '#374151',
          lineHeight: '1.6',
          padding: '20px'
        }
      });
    }

    // Store original styles for use in preview generation
    setOriginalEmailStyles(originalStyles);
    
    console.log('✅ HTML parsing complete:', components.length, 'components created');
    components.forEach((comp, i) => console.log(`  ${i + 1}. ${comp.type} (${comp.id})`));
    
    return components;
  };

  // Helper function to convert HTML elements to components
  const convertElementToComponent = (element, index) => {
    if (!element || !element.tagName) return null;

    const tagName = element.tagName.toLowerCase();
    const textContent = element.textContent?.trim() || '';
    const innerHTML = element.innerHTML?.trim() || '';
    const styles = window.getComputedStyle ? {} : {};

    console.log(`🔍 Converting element: ${tagName}, text: "${textContent.substring(0, 50)}..."`);

    // Detect component type based on element characteristics
    const componentId = `imported_${tagName}_${index}_${Date.now()}`;

    // Hero section detection (large headers with background)
    if (tagName === 'div' && (
      element.classList.contains('header') ||
      element.classList.contains('hero') ||
      (element.querySelector('h1') && element.style.background) ||
      (innerHTML.includes('h1') && innerHTML.includes('background'))
    )) {
      const titleElement = element.querySelector('h1, h2, .title');
      const subtitleElement = element.querySelector('p, .subtitle');
      const ctaElement = element.querySelector('a, button, .cta');

      return {
        id: componentId,
        type: 'hero',
        content: {
          title: titleElement ? titleElement.textContent : 'Welcome!',
          subtitle: subtitleElement ? subtitleElement.textContent : 'Your subtitle here',
          ctaText: ctaElement ? ctaElement.textContent : 'Get Started',
          ctaUrl: ctaElement ? (ctaElement.href || '#') : 'https://example.com',
          backgroundColor: element.style.background || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          textColor: element.style.color || 'transparent',
          alignment: 'center'
        }
      };
    }

    // Button/CTA detection
    if (tagName === 'a' || tagName === 'button' || element.classList.contains('button') || element.classList.contains('cta')) {
      return {
        id: componentId,
        type: 'cta_primary',
        content: {
          text: textContent || 'Click Here',
          url: element.href || 'https://example.com',
          backgroundColor: element.style.backgroundColor || '#00f0a0',
          textColor: element.style.color || 'transparent',
          borderRadius: '8px',
          fontSize: '16px',
          padding: '12px 24px',
          alignment: 'center'
        }
      };
    }

    // Header detection (h1-h6)
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
      return {
        id: componentId,
        type: 'text_rich',
        content: {
          text: `<${tagName}>${innerHTML}</${tagName}>`,
          fontSize: tagName === 'h1' ? '32px' : tagName === 'h2' ? '28px' : '24px',
          textColor: element.style.color || '#374151',
          alignment: element.style.textAlign || 'left',
          padding: '10px 0'
        }
      };
    }

    // Paragraph or general text content
    if (tagName === 'p' || tagName === 'div') {
      // Check if it contains rich content (images, links, formatting)
      const hasRichContent = element.querySelector('img, a, strong, em, b, i, br, span[style]');
      
      if (hasRichContent || innerHTML !== textContent) {
        return {
          id: componentId,
          type: 'freeform_editor',
          content: {
            html: innerHTML,
            fontSize: '16px',
            textColor: element.style.color || '#374151',
            lineHeight: '1.6',
            padding: '10px 0'
          }
        };
      } else {
        return {
          id: componentId,
          type: 'text_rich',
          content: {
            text: `<p>${textContent}</p>`,
            fontSize: '16px',
            textColor: element.style.color || '#374151',
            alignment: element.style.textAlign || 'left',
            padding: '10px 0'
          }
        };
      }
    }

    // Image detection
    if (tagName === 'img') {
      return {
        id: componentId,
        type: 'freeform_editor', // Use freeform for now, could create dedicated image component
        content: {
          html: element.outerHTML,
          fontSize: '16px',
          textColor: '#374151',
          lineHeight: '1.6',
          padding: '10px 0'
        }
      };
    }

    // Generic fallback - convert to freeform editor
    if (innerHTML && innerHTML.trim()) {
      return {
        id: componentId,
        type: 'freeform_editor',
        content: {
          html: innerHTML,
          fontSize: '16px',
          textColor: element.style.color || '#374151',
          lineHeight: '1.6',
          padding: '10px 0'
        }
      };
    }

    console.log(`⏭️ Skipping element: ${tagName} (no meaningful content)`);
    return null;
  };

  // Update the old parsing logic
  const parseEmailToComponentsOld = (email) => {
    // Extract subject and content
    const emailSubject = email.subject || email.Subject || `Email to ${email.to || email.recipient_name || 'prospect'}`;
    const emailContent = email.body || email.html || email.content || email.preview || email.message || email.text || '';
    
    console.log('🔍 Parsing email:', { subject: emailSubject, contentLength: emailContent.length });
    console.log('🔍 EMAIL CONTENT:', emailContent);
    
    // Set the subject
    setSubject(emailSubject);
    
    // Set the email HTML for root-level rendering - FIX THE BODY CSS ISSUE HERE!
    if (emailContent && emailContent.includes('<')) {
      console.log('🔍 DEBUG - FIRST PATH - Processing HTML content');
      console.log('🔍 DEBUG - FIRST PATH - Original HTML:', emailContent.substring(0, 500));
      
      // Extract the content inside <body> tags
      const bodyMatch = emailContent.match(/<body[^>]*>(.*?)<\/body>/s);
      // Extract the CSS styles  
      const styleMatch = emailContent.match(/<style[^>]*>(.*?)<\/style>/s);
      
      let processedHTML = emailContent;
      
      if (bodyMatch && styleMatch) {
        const bodyContent = bodyMatch[1];
        const styles = styleMatch[1];
        
        console.log('🔍 DEBUG - FIRST PATH - Original Styles:', styles);
        
        // Replace 'body' selector with '.email-wrapper' since body CSS won't work in a div
        const modifiedStyles = styles.replace(/\bbody\s*{/g, '.email-wrapper {');
        
        console.log('🔍 DEBUG - FIRST PATH - Modified Styles:', modifiedStyles);
        
        // Create new HTML with FORCED WIDTH
        processedHTML = `
          <style>
            ${modifiedStyles}
            .email-wrapper {
              width: 600px !important;
              max-width: 600px !important;
              min-width: 600px !important;
              margin: 0 auto !important;
              display: block !important;
              box-sizing: border-box !important;
            }
            .email-force-container {
              width: 100% !important;
              min-width: 800px !important;
              display: flex !important;
              justify-content: center !important;
              align-items: flex-start !important;
              padding: 20px !important;
              box-sizing: border-box !important;
            }
          </style>
          <div class="email-force-container">
            <div class="email-wrapper">
              ${bodyContent}
            </div>
          </div>
        `;
        
        console.log('🔍 DEBUG - FIRST PATH - Final HTML:', processedHTML.substring(0, 800));
      } else {
        // Just remove dangerous content if no body/style tags
        processedHTML = emailContent
          .replace(/onclick="[^"]*"/gi, '') // Remove onclick handlers
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ''); // Remove scripts only
      }
      
      console.log('✅ EMAIL HTML SET - Length:', processedHTML.length, 'Has gradient:', processedHTML.includes('linear-gradient'));
      console.log('✅ EMAIL HTML SET - Contains component:', processedHTML.includes('email-inline-component'));
      console.log('✅ EMAIL HTML SET - First 300 chars:', processedHTML.substring(0, 300));
      setRootEmailHTML(processedHTML);
      
    } else if (emailContent) {
      // Plain text email - convert to formatted HTML
      const formattedHtml = emailContent
        .split('\n')
        .map(line => line.trim() ? `<p>${line}</p>` : '<br/>')
        .join('');
      
      setRootEmailHTML(formattedHtml);
    } else {
      // No content - set default
      setRootEmailHTML('<p>Start typing your email content here...</p>');
    }

    return [];
  };

  // Function to switch to a specific email by index
  const switchToEmail = async (index) => {
    console.log('🚨🚨🚨 CRITICAL: SWITCHING TO EMAIL INDEX:', index);

    // NUCLEAR OPTION: Block ALL saves immediately when switching starts
    console.log('🔄 [SIMPLE] Email switching - no save blocking needed');
    console.log('🚨 Current currentEmailIndex:', currentEmailIndex);
    console.log('🚨 Target index:', index);
    console.log('🚨 Current true:', true);
    console.log('🚨 Current subject before switch:', subject);
    console.log('🚨 Current emailComponents count:', emailComponents.length);
    console.log('🚨 Current emailData.to:', emailData?.to);
    console.log('🚨 Current autoSaveKey:', autoSaveKey);
    console.log('🚨 Target email (availableEmails[index]):', availableEmails?.[index]);
    console.log('🚨 Target email.to:', availableEmails?.[index]?.to);
    console.log('🚨 🚨 🚨 THIS WILL TRIGGER AUTO-SAVE KEY CHANGE!');
    console.log('🟢 Current components before switch:', emailComponents.length);

    // CRITICAL FIX: Save current email's edits before switching using the OLD autoSaveKey
    console.log('💾 CAPTURING CURRENT EDITS BEFORE SWITCHING...');
    const oldAutoSaveKey = autoSaveKey; // Capture current key before changing currentEmail
    console.log('💾 OLD autoSaveKey (where we should save):', oldAutoSaveKey);

    // Only capture edits if we don't have meaningful data for the current email
    // This prevents capturing stale DOM content when switching away from loaded data
    let currentEdits = [];
    if (!hasMeaningfulData) {
      console.log('💾 No meaningful data exists, capturing current DOM edits');
      currentEdits = captureCurrentEdits();
    } else {
      console.log('💾 Meaningful data exists, skipping DOM capture to preserve loaded state');
    }
    // CRITICAL: Add inline components to the save data
    const inlineComponentsArray = Array.from(inlineComponents.values());
    console.log('💾 Found', inlineComponentsArray.length, 'inline components to include in save');

    // Combine current edits with inline components AND existing emailComponents
    const allComponents = [...currentEdits, ...inlineComponentsArray, ...emailComponents];
    console.log('💾 Total components to save:', allComponents.length, '(', currentEdits.length, 'edited +', inlineComponentsArray.length, 'inline +', emailComponents.length, 'existing )');

    if (allComponents.length > 0) {
      console.log('💾 Captured', allComponents.length, 'total components, saving to OLD key');

      // Save to Dexie database using the OLD key (current email before switch)
      const currentState = {
        subject: subject,
        preheader: preheader,
        components: allComponents,
        html: generatePreviewHTML(allComponents)
      };

      try {
        // Force immediate save to Dexie for the OLD email before switching
        await debouncedSaver.saveImmediately(oldAutoSaveKey, currentState);
        console.log('💾 FORCE SAVED current edits to Dexie (old key):', oldAutoSaveKey);
      } catch (error) {
        console.error('❌ Failed to save current edits to Dexie:', error);
      }
    } else {
      console.log('💾 No current edits to capture');
    }

    // Save the target email as the last edited email for page navigation persistence
    const targetEmail = availableEmails?.[index];
    if (targetEmail?.to) {
      localStorage.setItem('email_editor_last_edited_email', targetEmail.to);
      console.log('💾 Saved last edited email for navigation:', targetEmail.to);
    }

    // Set manual switching flag to prevent sync conflicts
    setIsManuallySwitching(true);
    console.log('🛡️ ENABLED manual switching protection');

    // Only reset auto-save protection if we're not switching to an email that has auto-save
    // Get the target email to check if it has auto-save
    let emailsSource = [];
    if (availableEmails && availableEmails.length > 0) {
      emailsSource = availableEmails;
    } else if (pendingEmails.length > 0) {
      emailsSource = pendingEmails;
    } else if (emailData) {
      emailsSource = [emailData];
    }

    if (index >= 0 && index < emailsSource.length) {
      const targetEmail = emailsSource[index];
      // Simple key generation for target email
      const targetKey = targetEmail?.to ? `email_editor_autosave_email_${targetEmail.to.replace(/[^a-zA-Z0-9]/g, '_')}` : 'email_editor_autosave_default';
      const hasTargetAutoSave = localStorage.getItem(targetKey);

      console.log('🔄 Checking target key:', targetKey);
      console.log('🔄 Target email:', targetEmail?.to);
      console.log('🔄 Has auto-save:', !!hasTargetAutoSave);

      // CRITICAL FIX: Only reset auto-save protection if target email has NO auto-save
      // If target email has auto-save, keep protection active to prevent overwriting
      if (!hasTargetAutoSave) {
        // REMOVED setAutoSaveLoaded(false);
        console.log('🔄 No auto-save for target email - resetting protection');
      } else {
        console.log('🔄 Target email has auto-save - keeping protection active');
      }
    } else {
      // REMOVED setAutoSaveLoaded(false);
      console.log('🔄 Reset auto-save protection for invalid email');
    }

    if (index < 0 || index >= emailsSource.length) {
      console.log('❌ Invalid email index:', index, 'available:', emailsSource.length);
      return;
    }

    const selectedEmail = emailsSource[index];
    console.log('📧 Switching to email', index, ':', selectedEmail);

    // CRITICAL FIX: Update currentEmail FIRST so autoSaveKey changes immediately
    console.log('🔧 SWITCHING: emailData prop stays', emailData?.to, 'but updating currentEmail to', selectedEmail.to);

    // Update currentEmail IMMEDIATELY to ensure autoSaveKey is correct for the new email
    setCurrentEmail({
      to: selectedEmail.to,
      subject: selectedEmail.subject,
      body: selectedEmail.body,
      recipientName: selectedEmail.recipientName,
      company: selectedEmail.company,
      quality_score: selectedEmail.quality_score,
      campaignId: selectedEmail.campaignId || emailData?.campaignId,
      id: selectedEmail.id
    });

    // Update index after currentEmail to maintain consistency
    setCurrentEmailIndex(index);

    // CRITICAL FIX: Don't parse HTML to components when switching emails!
    // The autosave system will load the correct components for this email.
    // Only parse HTML if there's no autosave for this email.

    console.log('🔍 Checking for meaningful autosave before parsing HTML');
    const targetAutoSaveKey = selectedEmail?.to ? `email_editor_autosave_email_${selectedEmail.to.replace(/[^a-zA-Z0-9]/g, '_')}` : 'email_editor_autosave_default';
    const savedData = localStorage.getItem(targetAutoSaveKey);

    // The useEmailPersistence hook will automatically handle loading the correct data
    // when autoSaveKey changes due to currentEmail update

    // The useEmailPersistence hook should now automatically load the correct data for the new email
    // We don't need to manually load it here since the hook will handle it when autoSaveKey changes
    console.log('✅ Email switch complete - persistence hook will load correct data for new email');

    // Set default subject and preheader if not loaded from saved data
    if (!hasMeaningfulData) {
      console.log('📧 No meaningful saved data, setting original email content');
      setSubject(selectedEmail.subject || 'No Subject');
      setPreheader(selectedEmail.preheader || '');

      // Parse HTML to components for emails without saved data
      const components = parseEmailToComponents(selectedEmail);
      console.log('🔄 Parsed', components?.length || 0, 'components from original email HTML');
      setEmailComponents(components);

      // Set the HTML content for preview
      const emailContent = selectedEmail.body || selectedEmail.html || selectedEmail.content || selectedEmail.message || selectedEmail.text;
      if (emailContent) {
        console.log('📧 Setting original email HTML for preview, length:', emailContent.length);
        setRootEmailHTML(emailContent);
      }
    }

    // Clear any inline components since we're loading a new email
    setInlineComponents(new Map());
    setSelectedComponent(null);

    // Reset manual switching flag after a longer delay to ensure persistence system fully settles
    setTimeout(() => {
      setIsManuallySwitching(false);
      console.log('🛡️ DISABLED manual switching protection - switch complete');
    }, 1000); // Increased to 1000ms to match persistence settling period
  };

  // Helper function to replace template variables in email content
  const replaceTemplateVariables = (content, emailData) => {
    if (!content || typeof content !== 'string') return content;
    
    const variables = {
      '{{companyName}}': emailData?.recipient_company || emailData?.company || 'Your Company',
      '{{recipientName}}': emailData?.recipient_name || emailData?.name || 'there',
      '{{senderName}}': emailData?.sender_name || 'AI Marketing',
      '{{websiteUrl}}': emailData?.website_url || 'https://example.com',
      '{{campaignId}}': emailData?.campaign_id || 'default'
    };

    let result = content;
    Object.entries(variables).forEach(([placeholder, value]) => {
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return result;
  };

  // Fetch pending approval emails from API
  const fetchPendingEmails = async () => {
    try {
      setRefreshing(true);
      console.log('🔄 Fetching pending approval emails...');
      
      // Try to fetch from workflow API first (skip this as it doesn't exist)
      // const response = await fetch('/api/workflow/pending-emails');
      const response = { ok: false }; // Skip the non-existent endpoint
      if (response.ok) {
        const data = await response.json();
        console.log('📧 Received pending emails:', data);
        
        if (data.success && data.emails) {
          setPendingEmails(data.emails);
          return data.emails;
        }
      }
      
      // Fallback to workflow results
      const workflowUrl = campaignId
        ? `/api/workflow/results?campaignId=${campaignId}`
        : '/api/workflow/results';
      const workflowResponse = await fetch(workflowUrl);
      if (workflowResponse.ok) {
        const workflowData = await workflowResponse.json();
        console.log('📧 Workflow results:', workflowData);
        console.log('📧 Workflow data structure:', workflowData.data);
        console.log('📧 CampaignData:', workflowData.data?.campaignData);
        console.log('📧 EmailCampaign:', workflowData.data?.campaignData?.emailCampaign);
        console.log('📧 EmailCampaign emails:', workflowData.data?.campaignData?.emailCampaign?.emails);
        
        if (workflowData.success && workflowData.data) {
          // Check multiple possible locations for emails
          const emails = workflowData.data.campaignData?.emailCampaign?.emails || 
                        workflowData.data.emailCampaign?.emails || 
                        workflowData.data.emails || 
                        workflowData.data.generatedEmails || 
                        [];
          
          console.log('📧 Found emails:', emails.length, 'emails');
          if (emails.length > 0) {
            console.log('📧 First email sample:', emails[0]);
            setPendingEmails(emails);
            return emails;
          }
        }
      }
    } catch (error) {
      console.error('❌ Error fetching pending emails:', error);
    } finally {
      setRefreshing(false);
    }

    return [];
  };

  // REMOVED: All loose code from duplicate useEffect - moved functionality to proper scope earlier

  console.log('🔍 DEBUG: Still inside component before useEffect at line 1188');

  // Temporarily comment out the original useEffect and add this simple one

  // Set up global function and event listener for inline component selection


  // Update visual indicators when selectedComponent changes
  useEffect(() => {
    if (selectedComponent) {
      console.log('🎯 Selected component changed to:', selectedComponent);
      // Update visual indicators
      setTimeout(() => {
        document.querySelectorAll('.inline-component, .email-inline-component').forEach(el => {
          el.style.border = el.dataset.componentId === selectedComponent 
            ? '3px solid #00f0a0' 
            : '2px solid transparent';
        });
      }, 50);
    } else {
      // Clear all selections
      document.querySelectorAll('.inline-component, .email-inline-component').forEach(el => {
        el.style.border = '2px solid transparent';
      });
    }
  }, [selectedComponent]);

  // Force clear any freeform editor selections and prevent their creation
  useEffect(() => {
    if (selectedComponent) {
      const component = emailComponents.find(c => c.id === selectedComponent);
      if (component && component.type === 'freeform_editor') {
        console.log('🧹 Force clearing freeform editor selection');
        setSelectedComponent(null);
      }
      if (selectedComponent.includes('email_body') || selectedComponent.includes('freeform')) {
        console.log('🧹 Force clearing based on component ID pattern');  
        setSelectedComponent(null);
      }
    }
  }, [selectedComponent, emailComponents]);

  const parseHTMLToComponents = (htmlContent, emailData = null) => {
    console.log('🔄 Parsing email HTML to components:', htmlContent?.substring(0, 200) + '...');
    
    if (!htmlContent) {
      console.log('❌ No HTML content provided');
      return;
    }

    // Replace template variables first
    let processedContent = htmlContent;
    if (emailData) {
      processedContent = replaceTemplateVariables(htmlContent, emailData);
    }

    // Extract body content if it's a full HTML document
    if (processedContent.includes('<!DOCTYPE') || processedContent.includes('<html')) {
      console.log('📧 Detected full HTML document, extracting body content...');
      
      // Extract body content
      const bodyMatch = processedContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        processedContent = bodyMatch[1];
      }
      
      // Extract content from email-container or similar wrapper if present
      const containerPatterns = [
        /<div[^>]*class="email-container"[^>]*>([\s\S]*)<\/div>/i,
        /<div[^>]*class="email-content"[^>]*>([\s\S]*)<\/div>/i,
        /<div[^>]*class="email-body"[^>]*>([\s\S]*)<\/div>/i,
        /<table[^>]*class="email-container"[^>]*>([\s\S]*)<\/table>/i
      ];
      
      for (const pattern of containerPatterns) {
        const match = processedContent.match(pattern);
        if (match) {
          processedContent = match[1];
          break;
        }
      }
    }

    // Clean the HTML content to prevent issues
    processedContent = processedContent
      .replace(/onclick="[^"]*"/gi, '') // Remove onclick handlers that cause errors only
      // Remove editing control icons and buttons
      .replace(/✏️/g, '') // Remove edit icons
      .replace(/⬆️/g, '') // Remove up arrow icons
      .replace(/⬇️/g, '') // Remove down arrow icons
      .replace(/🗑️/g, '') // Remove delete icons
      .replace(/\u270F\uFE0F/g, '') // Remove pencil emoji with variation selector
      .replace(/\u2B06\uFE0F/g, '') // Remove up arrow emoji with variation selector  
      .replace(/\u2B07\uFE0F/g, '') // Remove down arrow emoji with variation selector
      .replace(/\u1F5D1\uFE0F/g, '') // Remove wastebasket emoji with variation selector
      .replace(/<button[^>]*class="[^"]*component-control[^"]*"[^>]*>[\s\S]*?<\/button>/gi, '') // Remove control buttons
      .replace(/<div[^>]*class="[^"]*component-controls[^"]*"[^>]*>[\s\S]*?<\/div>/gi, ''); // Remove control divs

    console.log('📧 Processed content preview:', processedContent.substring(0, 300) + '...');

    // Word-processor approach: Store content as single editable HTML with inline components
    const emailContent = {
      html: processedContent,
      subject: '',
      inlineComponents: [] // Components that can be inserted anywhere in the flow
    };
    
    // Extract subject if present
    const subjectMatch = processedContent.match(/Subject:\s*([^\n\r<]+)/i);
    if (subjectMatch) {
      emailContent.subject = subjectMatch[1].trim();
      emailContent.html = processedContent.replace(/Subject:\s*[^\n\r<]+/i, '').trim();
    }
    
    // Clean up the HTML for editing
    emailContent.html = emailContent.html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Set the subject if found
    if (emailContent.subject) {
      setSubject(emailContent.subject);
    }
    
    // DON'T create any components - render email HTML directly at root level  
    const components = [];
    
    // Store the processed HTML for root-level rendering with template variables (preserve original styling)
    if (emailContent) {
      console.log('📄 Storing email HTML for root-level rendering, NOT creating freeform_editor component');
      console.log('📄 Email HTML content:', emailContent);
      
      // For HTML content, use EXACT SAME processing as working email campaign
      if (typeof emailContent === 'string' && emailContent.includes('<')) {
        // DEBUG: COMPREHENSIVE LOGGING
        console.log('🔍 DEBUG - Original Email HTML Length:', emailContent.length);
        console.log('🔍 DEBUG - Original Email HTML:', emailContent.substring(0, 500));
        
        // EXTRACT AND CONVERT BODY CSS TO WRAPPER DIV - THE REAL FIX!
        let processedHTML = emailContent;
        
        // Extract the content inside <body> tags
        const bodyMatch = processedHTML.match(/<body[^>]*>(.*?)<\/body>/s);
        // Extract the CSS styles
        const styleMatch = processedHTML.match(/<style[^>]*>(.*?)<\/style>/s);
        
        console.log('🔍 DEBUG - Body Match Found:', !!bodyMatch);
        console.log('🔍 DEBUG - Style Match Found:', !!styleMatch);
        
        if (bodyMatch && styleMatch) {
          const bodyContent = bodyMatch[1];
          const styles = styleMatch[1];
          
          console.log('🔍 DEBUG - Original Body Content:', bodyContent.substring(0, 300));
          console.log('🔍 DEBUG - Original Styles:', styles);
          
          // Replace 'body' selector with '.email-wrapper' since body CSS won't work in a div
          const modifiedStyles = styles.replace(/\bbody\s*{/g, '.email-wrapper {');
          
          console.log('🔍 DEBUG - Modified Styles:', modifiedStyles);
          
          // Create new HTML with FORCED WIDTH - NO COMPRESSION POSSIBLE
          processedHTML = `
            <style>
              ${modifiedStyles}
              .email-wrapper {
                /* NUCLEAR OPTION - FORCE EMAIL TO PROPER SIZE */
                width: 600px !important;
                max-width: 600px !important;
                min-width: 600px !important;
                margin: 0 auto !important;
                display: block !important;
                position: relative !important;
                box-sizing: border-box !important;
                background: yellow !important; /* DEBUG: Make wrapper visible */
                border: 2px solid red !important; /* DEBUG: Show wrapper boundaries */
              }
              .email-force-container {
                /* Force container to be wide enough */
                width: 100% !important;
                min-width: 800px !important;
                display: flex !important;
                justify-content: center !important;
                align-items: flex-start !important;
                padding: 20px !important;
                box-sizing: border-box !important;
                background: lightblue !important; /* DEBUG: Make container visible */
                border: 3px solid green !important; /* DEBUG: Show container boundaries */
              }
            </style>
            <div class="email-force-container">
              <div class="email-wrapper">
                ${bodyContent}
              </div>
            </div>
          `;
          
          console.log('🔍 DEBUG - Final Processed HTML Length:', processedHTML.length);
          console.log('🔍 DEBUG - Final Processed HTML:', processedHTML.substring(0, 800));
        } else {
          console.log('❌ DEBUG - No body/style match, using original HTML');
        }
        
        setRootEmailHTML(processedHTML);
      } else if (typeof emailContent === 'string') {
        // Convert plain text to HTML
        console.log('📄 Converting plain text to HTML');
        const htmlContent = emailContent.split('\n').map(line => 
          line.trim() ? `<p>${line}</p>` : '<br>'
        ).join('');
        const processedHTML = replaceTemplateVariables(htmlContent, emailData || {});
        setRootEmailHTML(processedHTML);
      }
    } else {
      setRootEmailHTML('<p>Start typing your email content here...</p>');
    }

    console.log('✅ Generated', components.length, 'components from email');
    console.log('✅ Components:', components.map(c => c.type));
    
    // Set the parsed components
    const parsedComponents = parseEmailToComponents(email);
    console.log('🔄 Setting', parsedComponents.length, 'parsed components');
    setEmailComponents(parsedComponents);
  };

  // Handle drag and drop functionality
  const handleDragStart = (e, componentType) => {
    setIsDragging(true);
    e.dataTransfer.setData('componentType', componentType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Handle text drop positioning - more precise line-based insertion
  const handleTextDragOver = (e, componentId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    // Calculate which line/paragraph to insert before or after
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const elementHeight = rect.height;
    
    // More granular positioning - which third of the element
    let insertPosition = 'middle';
    const ratio = relativeY / elementHeight;
    if (ratio < 0.33) {
      insertPosition = 'before';
    } else if (ratio > 0.66) {
      insertPosition = 'after';
    } else {
      insertPosition = 'middle';
    }
    
    setTextDropPosition({
      componentId,
      position: insertPosition
    });
  };

  // Handle dropping into text content - simpler, more reliable approach
  const handleTextDrop = (e, componentId) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('componentType');
    
    if (componentType && textDropPosition?.componentId === componentId) {
      const targetIndex = emailComponents.findIndex(c => c.id === componentId);
      if (targetIndex !== -1) {
        const newComponent = createComponent(componentType);
        const updatedComponents = [...emailComponents];
        
        // Insert component based on position
        if (textDropPosition.position === 'before') {
          // Insert before the text component
          updatedComponents.splice(targetIndex, 0, newComponent);
        } else if (textDropPosition.position === 'after') {
          // Insert after the text component
          updatedComponents.splice(targetIndex + 1, 0, newComponent);
        } else {
          // Insert in the middle - split the text component
          const targetComponent = emailComponents[targetIndex];
          if (targetComponent.type === 'text_rich') {
            const textContent = targetComponent.content.text;
            
            // Simple middle split - find a good break point
            const parser = new DOMParser();
            const doc = parser.parseFromString(`<div>${textContent}</div>`, 'text/html');
            const paragraphs = doc.querySelectorAll('p');
            
            if (paragraphs.length > 1) {
              // Split at middle paragraph
              const middleParagraph = Math.floor(paragraphs.length / 2);
              const beforeParagraphs = Array.from(paragraphs).slice(0, middleParagraph);
              const afterParagraphs = Array.from(paragraphs).slice(middleParagraph);
              
              const beforeHTML = beforeParagraphs.map(p => p.outerHTML).join('');
              const afterHTML = afterParagraphs.map(p => p.outerHTML).join('');
              
              // Update first part
              updatedComponents[targetIndex] = {
                ...targetComponent,
                content: {
                  ...targetComponent.content,
                  text: beforeHTML || '<p></p>'
                }
              };
              
              // Insert new component
              updatedComponents.splice(targetIndex + 1, 0, newComponent);
              
              // Insert second part if there's content
              if (afterHTML.trim()) {
                const secondPart = {
                  ...targetComponent,
                  id: 'split_' + Date.now(),
                  content: {
                    ...targetComponent.content,
                    text: afterHTML
                  }
                };
                updatedComponents.splice(targetIndex + 2, 0, secondPart);
              }
            } else {
              // Just insert after if only one paragraph
              updatedComponents.splice(targetIndex + 1, 0, newComponent);
            }
          } else {
            // For non-text components, just insert after
            updatedComponents.splice(targetIndex + 1, 0, newComponent);
          }
        }
        
        setEmailComponents(updatedComponents);
        setSelectedComponent(newComponent.id);
        toast.success('Component inserted!');
      }
    }
    
    setTextDropPosition(null);
  };

  // Handle freeform editor drag and drop - like Google Docs/Word
  const handleFreeformDragOver = (e, componentId) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling
    e.dataTransfer.dropEffect = 'copy';
    
    // Calculate drop position based on mouse coordinates
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setTextDropPosition({
      componentId,
      x: x,
      y: y,
      mouseX: e.clientX,
      mouseY: e.clientY
    });
  };

  // Handle dropping components into freeform text - insert at mouse position
  const handleFreeformDrop = (e, componentId) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling to other drop handlers

    const componentType = e.dataTransfer.getData('componentType');
    const existingComponentId = e.dataTransfer.getData('componentId');
    const droppedHTML = e.dataTransfer.getData('text/html');

    
    // Handle repositioning of existing inline components
    if (existingComponentId && droppedHTML) {
      console.log('🔄 Repositioning inline component:', existingComponentId);
      
      const editorElement = e.currentTarget;
      if (!editorElement) {
        console.log('❌ No editor element found');
        return;
      }
      
      // Find the original element to remove it
      const originalElement = editorElement.querySelector(`[data-component-id="${existingComponentId}"]`);
      
      // Get the stored component data to regenerate it properly
      const storedComponent = inlineComponents.get(existingComponentId);
      
      if (storedComponent && originalElement) {
        console.log('✅ Found stored component data:', storedComponent);
        
        // Remove the original element first
        originalElement.remove();
        
        // Regenerate the component HTML from stored data (this ensures event handlers work)
        const newHTML = generateInlineComponentHTML(storedComponent.type, existingComponentId, storedComponent.content);
        console.log('🔄 Generated new HTML for repositioning');
        
        // Insert the new HTML at the drop position with better positioning
        const rect = editorElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Try to insert at mouse position using range
        let inserted = false;
        if (document.caretRangeFromPoint) {
          try {
            const range = document.caretRangeFromPoint(e.clientX, e.clientY);
            if (range) {
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = newHTML;
              const componentElement = tempDiv.firstElementChild;
              if (componentElement && range.insertNode) {
                range.insertNode(componentElement);
                inserted = true;
                console.log('✅ Inserted at exact mouse position');
              }
            }
          } catch (error) {
            console.log('⚠️ Range insertion failed, using fallback');
          }
        }
        
        // Fallback to appendChild if range insertion failed
        if (!inserted) {
          editorElement.insertAdjacentHTML('beforeend', newHTML);
        }
        
        // IMPORTANT: Re-attach event listeners and ensure draggable property is maintained
        setTimeout(() => {
          const newElement = editorElement.querySelector(`[data-component-id="${existingComponentId}"]`);
          if (newElement) {
            newElement.draggable = true;
            newElement.style.cursor = 'move';
            
            // Ensure the element can be dragged again
            newElement.addEventListener('dragstart', (e) => {
              console.log('🚀 Re-dragging component:', existingComponentId);
              e.dataTransfer.setData('text/html', newElement.outerHTML);
              e.dataTransfer.setData('componentId', existingComponentId);
              e.dataTransfer.setData('componentIndex', 'inline');
              e.stopPropagation();
            });
            
            console.log('✅ Re-attached drag handlers to repositioned component');
          }
        }, 100);
        
        console.log('✅ Component repositioned successfully');
        
        // DO NOT update freeform component - destroys inline components  
        const freeformComponent = emailComponents.find(c => c.type === 'freeform_editor');
        if (freeformComponent) {
          console.log('🚫 Skipped freeform update during drag - inline components would be destroyed');
        }
        
        // Clear text drop position
        setTextDropPosition(null);
        
        toast.success('Component repositioned!');
        return;
      } else {
        console.log('❌ Could not find stored component data or original element');
        
        // Try to restore from stored data as a last resort
        const fallbackComponent = inlineComponents.get(existingComponentId);
        if (fallbackComponent && editorElement) {
          console.log('🔄 Restoring component from stored data as fallback...');
          const newHTML = generateInlineComponentHTML(fallbackComponent.type, existingComponentId, fallbackComponent.content);
          editorElement.insertAdjacentHTML('beforeend', newHTML);
          // DO NOT update freeform component - destroys inline components
          const freeformComponent = emailComponents.find(c => c.type === 'freeform_editor');
          if (freeformComponent) {
            console.log('🚫 Skipped freeform update during restore - inline components would be destroyed');
          }
          toast.success('Component restored!');
        }
      }
      
      // Clear text drop position
      setTextDropPosition(null);
      return;
    }
    
    // Handle new component drops (original functionality)
    
    if (componentType && textDropPosition?.componentId === componentId) {
      // Get the target element
      const editorElement = e.currentTarget;
      if (!editorElement) return;
      
      // Create a simple placeholder instead of complex HTML
      const componentId = `inline_${componentType}_${Date.now()}`;
      
      // Get default content for the component type
      const defaultContent = getDefaultComponentContent(componentType);
      
      // Generate component HTML using the new function with proper styling
      let componentHTML = generateInlineComponentHTML(componentType, componentId, defaultContent);
      
      // Try to insert at mouse position using range
      let range;
      if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(textDropPosition.mouseX, textDropPosition.mouseY);
      } else if (document.caretPositionFromPoint) {
        const caretPos = document.caretPositionFromPoint(textDropPosition.mouseX, textDropPosition.mouseY);
        range = document.createRange();
        range.setStart(caretPos.offsetNode, caretPos.offset);
      }
      
      // Insert at cursor position if possible, otherwise append
      if (range && range.insertNode) {
        try {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = componentHTML;
          const componentElement = tempDiv.firstElementChild;
          if (componentElement) {
            range.insertNode(componentElement);
            console.log('✅ Inserted component at cursor position');
          } else {
            editorElement.innerHTML += componentHTML;
            console.log('📍 Fallback: Appended to end (no element)');
          }
        } catch (error) {
          console.log('📍 Fallback: Appended to end (range error):', error);
          editorElement.innerHTML += componentHTML;
        }
      } else {
        console.log('📍 Fallback: Appended to end (no range)');
        editorElement.innerHTML += componentHTML;
      }
      
      // Store the inline component data for later editing
      console.log('💾 Storing inline component:', componentId, componentType);
      setInlineComponents(prev => {
        const newMap = new Map(prev.set(componentId, {
          type: componentType,
          id: componentId,
          content: getDefaultComponentContent(componentType)
        }));
        console.log('📋 Updated inlineComponents Map size:', newMap.size);
        console.log('🔑 InlineComponents keys:', Array.from(newMap.keys()));
        return newMap;
      });

      
      // IMPORTANT: Ensure the newly created component has proper drag functionality
      setTimeout(() => {
        const newElement = editorElement.querySelector(`[data-component-id="${componentId}"]`);
        if (newElement) {
          newElement.draggable = true;
          newElement.style.cursor = 'move';
          
          // Attach drag start event listener
          newElement.addEventListener('dragstart', (e) => {
            console.log('🚀 Dragging newly created component:', componentId);
            e.dataTransfer.setData('text/html', newElement.outerHTML);
            e.dataTransfer.setData('componentId', componentId);
            e.dataTransfer.setData('componentIndex', 'inline');
            e.stopPropagation();
          });
          
          console.log('✅ Attached drag handlers to new component');
        }
      }, 100);
      
      // Update the component content
      // DO NOT update freeform component - destroys inline components
      const freeformComponent = emailComponents.find(c => c.type === 'freeform_editor');
      if (freeformComponent) {
        console.log('🚫 Skipped freeform update after insert - inline components would be destroyed');
      }

      // CRITICAL: Capture and save the updated HTML content after component insertion
      setTimeout(() => {
        console.log('🔄 [DELAYED] setTimeout callback executing...');

        try {
          // Use the editor element that was already used for insertion (more reliable)
          console.log('🔄 [DELAYED] Using editorElement from insertion:', !!editorElement);

          if (editorElement) {
            const currentHTML = editorElement.innerHTML;
            console.log('💾 Capturing updated HTML after component insertion, length:', currentHTML.length);
            setRootEmailHTML(currentHTML);

            // NOTE: Don't save to database immediately - this destroys inline components
            // Inline components will be saved when user switches emails
            console.log('🔄 [DELAYED] Skipping immediate database save to preserve inline component');
          } else {
            console.log('❌ [DELAYED] Editor element from insertion is null');

            // Fallback: try contentEditableRefs
            const fallbackElement = contentEditableRefs.current.get('freeform_editor');
            console.log('🔄 [DELAYED] Fallback editor element:', !!fallbackElement);
            console.log('❌ [DELAYED] Available refs:', Array.from(contentEditableRefs.current.keys()));
          }
        } catch (error) {
          console.error('❌ [DELAYED] Error in setTimeout callback:', error);
        }
      }, 150); // Small delay to ensure DOM is updated

      toast.success('Component inserted!');
    }
    
    setTextDropPosition(null);
  };

  // Helper function to get default content for component types
  const getDefaultComponentContent = (componentType) => {
    switch (componentType) {
      case 'hero':
        return {
          title: 'Welcome to Our Newsletter',
          subtitle: 'Stay updated with the latest news and offers',
          ctaText: 'Get Started',
          ctaUrl: 'https://example.com',
          backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          textColor: 'transparent',
          alignment: 'center'
        };
      case 'cta_primary':
        return {
          text: 'Start Your Free Trial',
          url: 'https://example.com',
          backgroundColor: '#00f0a0',
          textColor: 'transparent',
          borderRadius: '8px',
          fontSize: '18px',
          padding: '16px 32px',
          alignment: 'center'
        };
      case 'product_showcase':
        return {
          title: 'Featured Product',
          description: 'Discover our latest offering with amazing features and benefits.',
          price: '$99.99',
          ctaText: 'Shop Now',
          ctaUrl: 'https://example.com',
          imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop',
          backgroundColor: 'white',
          borderColor: '#e5e7eb',
          titleColor: '#1f2937',
          textColor: '#6b7280',
          priceColor: '#10b981',
          ctaBackgroundColor: '#00f0a0',
          ctaTextColor: 'white'
        };
      case 'button_group':
        return {
          primaryText: 'Learn More',
          primaryUrl: 'https://example.com',
          secondaryText: 'Contact Us',
          secondaryUrl: 'https://example.com/contact',
          primaryBackgroundColor: '#00f0a0',
          primaryTextColor: 'white',
          secondaryBackgroundColor: 'transparent',
          secondaryTextColor: '#00f0a0',
          secondaryBorderColor: '#00f0a0'
        };
      case 'social_links':
        return {
          title: 'Follow Us',
          facebookUrl: 'https://facebook.com',
          twitterUrl: 'https://twitter.com',
          linkedinUrl: 'https://linkedin.com',
          backgroundColor: 'transparent',
          titleColor: '#1f2937',
          linkColor: '#00f0a0'
        };
      case 'testimonial':
        return {
          quote: 'This product has transformed our business in ways we never imagined.',
          author: 'Jane Doe',
          role: 'CEO, Example Corp'
        };
      case 'text_rich':
        return {
          title: 'Rich Text Section',
          text: 'This is a rich text section where you can add detailed content, multiple paragraphs, and formatting to engage your readers.'
        };
      case 'social_proof':
        return {
          number: '10,000+',
          description: 'Happy customers trust our service'
        };
      case 'spacer':
        return {
          height: '40px'
        };
      case 'divider_fancy':
        return {};
      case 'footer_professional':
        return {
          companyName: 'Your Company',
          tagline: 'Building the future of business',
          websiteUrl: 'https://example.com',
          privacyUrl: 'https://example.com/privacy',
          unsubscribeUrl: 'https://example.com/unsubscribe'
        };
      default:
        return {};
    }
  };

  // Handle inline component selection
  const selectInlineComponent = (componentId, componentType) => {
    console.log('🎯 Selecting inline component:', componentId, componentType);
    console.log('📋 Inline components map:', inlineComponents);
    
    const inlineComponent = inlineComponents.get(componentId);
    console.log('🔍 Found inline component:', inlineComponent);
    
    if (inlineComponent) {
      console.log('✅ Setting selected component to:', componentId);
      setSelectedComponent(componentId);
      // You might also want to highlight the component visually
    } else {
      console.log('❌ Inline component not found in map');
    }
  };

  // Expose function globally for inline components to call
  useEffect(() => {
    window.selectInlineComponent = selectInlineComponent;

    // Add delete function for inline components
    window.deleteInlineComponent = (componentId) => {
      console.log('🗑️ [INLINE] Deleting component:', componentId);

      // Remove from inline components map
      setInlineComponents(prev => {
        const newMap = new Map(prev);
        newMap.delete(componentId);
        return newMap;
      });

      // Remove from emailComponents array and save immediately
      const updatedComponents = emailComponents.filter(comp => comp.id !== componentId);
      console.log('💾 [INLINE] Immediately saving after delete:', updatedComponents.length);
      setEmailComponents(updatedComponents);

      // Remove from DOM
      const element = document.querySelector(`[data-component-id="${componentId}"]`);
      if (element) {
        element.remove();
      }

      console.log('✅ [INLINE] Component deleted and saved');
    };

    // Add edit function for inline components (placeholder for now)
    window.editInlineComponent = (componentId) => {
      console.log('✏️ [INLINE] Edit component:', componentId);
      // For now, just log - can implement editing later
      alert('Edit functionality coming soon!');
    };

    return () => {
      delete window.selectInlineComponent;
      delete window.deleteInlineComponent;
      delete window.editInlineComponent;
    };
  }, [inlineComponents, emailComponents, setEmailComponents]);

  // Update inline component content and regenerate HTML
  const updateInlineComponent = (inlineComponentId, updates) => {
    console.log('🔄 updateInlineComponent called with:', inlineComponentId, updates);
    console.log('🔄 Current inlineComponents size:', inlineComponents.size);
    console.log('🔄 Current inlineComponents keys:', Array.from(inlineComponents.keys()));
    
    // Update the stored component data and get the updated component immediately
    setInlineComponents(prev => {
      const newMap = new Map(prev);
      const component = newMap.get(inlineComponentId);
      console.log('🔄 Found inline component:', component ? 'YES' : 'NO');
      
      if (component) {
        const updatedComponent = {
          ...component,
          content: { ...component.content, ...updates }
        };
        console.log('🔄 Original inline component:', component);
        console.log('🔄 Updated inline component:', updatedComponent);
        
        newMap.set(inlineComponentId, updatedComponent);
        
        // Perform the DOM update immediately with the updated data
        setTimeout(() => {
          updateComponentInDOM(inlineComponentId, updatedComponent, updates);
        }, 50); // Slightly longer delay to ensure state update
        
        console.log('✅ Inline component updated in Map');
      } else {
        console.log('❌ Inline component not found in Map');
      }
      return newMap;
    });
  };

  // Function to capture current edits from DOM before sending
  const captureCurrentEdits = () => {
    console.log('🔄 Capturing current edits from DOM...');
    
    // Get all contenteditable elements
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    console.log('🔍 Found', editableElements.length, 'editable elements');
    
    let updatedComponents = [...emailComponents];
    let foundMainEditor = false;
    let mainEditorContent = null;
    
    editableElements.forEach((element, index) => {
      const currentContent = element.innerHTML;
      const textContent = element.innerText;
      
      console.log(`🔍 Element ${index} content (first 100 chars):`, textContent.substring(0, 100));
      
      // Check if this is the main editor (no componentId but contains main content)
      const isMainEditor = !element.getAttribute('data-component-id') && 
                          !element.getAttribute('data-inline-id') &&
                          element.classList.contains('outline-none') &&
                          textContent.trim().length > 10;
      
      if (isMainEditor) {
        console.log('🎯 Found main editor element - updating rootEmailHTML');
        setRootEmailHTML(currentContent);
        foundMainEditor = true;
        mainEditorContent = currentContent; // Store the content to update freeform components
        return; // Skip component processing for main editor
      }
      
      // Try to identify which component this belongs to - FIXED TRAVERSAL
      let componentId = null;
      let currentElement = element;
      
      // Traverse up the DOM tree to find data-component-id (up to 10 levels)
      for (let i = 0; i < 10 && currentElement; i++) {
        componentId = currentElement.getAttribute('data-component-id');
        if (componentId) {
          console.log(`🔍 Found componentId "${componentId}" at level ${i}`);
          break;
        }
        currentElement = currentElement.parentElement;
      }
      
      // If still not found, try alternative approach - search all parents
      if (!componentId) {
        currentElement = element.parentElement;
        while (currentElement && !componentId) {
          componentId = currentElement.getAttribute('data-component-id');
          if (componentId) {
            console.log(`🔍 Found componentId "${componentId}" via parent traversal`);
            break;
          }
          currentElement = currentElement.parentElement;
        }
      }
      
      const inlineId = element.getAttribute('data-inline-id');
      
      console.log(`🔍 Element ${index} - componentId:`, componentId, 'inlineId:', inlineId);
      
      if (componentId) {
        // Find the component and update it
        const componentIndex = updatedComponents.findIndex(c => c.id === componentId);
        if (componentIndex !== -1) {
          const component = updatedComponents[componentIndex];
          
          if (component.type === 'freeform_editor') {
            // Update freeform editor content
            updatedComponents[componentIndex] = {
              ...component,
              content: {
                ...component.content,
                html: currentContent,
                text: textContent
              }
            };
            console.log(`✅ Updated freeform_editor component ${componentId} with current content`);
          } else if (component.type === 'text_rich') {
            // Update text component
            updatedComponents[componentIndex] = {
              ...component,
              content: {
                ...component.content,
                text: currentContent
              }
            };
            console.log(`✅ Updated text_rich component ${componentId} with current content`);
          }
        } else {
          console.log(`❌ Component with ID ${componentId} not found in emailComponents array`);
        }
      } else {
        console.log(`❌ No componentId found for element ${index}`);
        
        // ENHANCED FALLBACK: Try to identify by content matching if no componentId found
        const elementText = textContent.trim();
        if (elementText.length > 10) { // Only for substantial content
          console.log(`🔄 Trying fallback content matching for: "${elementText.substring(0, 50)}..."`);
          
          // First, try to find existing freeform component to update
          let matchFound = false;
          updatedComponents.forEach((component, compIndex) => {
            if (component.type === 'freeform_editor' && component.content && !matchFound) {
              const compText = component.content.text || component.content.html || '';
              if (compText.includes(elementText.substring(0, 20)) || elementText.includes(compText.substring(0, 20))) {
                console.log(`🎯 Found matching freeform_editor component by content matching`);
                updatedComponents[compIndex] = {
                  ...component,
                  content: {
                    ...component.content,
                    html: currentContent,
                    text: textContent
                  }
                };
                matchFound = true;
              }
            } else if (component.type === 'text_rich' && component.content && !matchFound) {
              const compText = component.content.text || '';
              if (compText.includes(elementText.substring(0, 20)) || elementText.includes(compText.substring(0, 20))) {
                console.log(`🎯 Found matching text_rich component by content matching`);
                updatedComponents[compIndex] = {
                  ...component,
                  content: {
                    ...component.content,
                    text: currentContent
                  }
                };
                matchFound = true;
              }
            }
          });
          
          // If no match found, create new freeform component for this content
          if (!matchFound) {
            console.log(`🆕 Creating new freeform component for unmatched content`);
            const newComponent = {
              id: 'captured_content_' + Date.now(),
              type: 'freeform_editor',
              content: {
                html: currentContent,
                text: textContent,
                fontSize: '16px',
                textColor: '#374151',
                lineHeight: '1.6'
              }
            };
            updatedComponents.push(newComponent);
            console.log(`✅ Created new component ${newComponent.id} for orphaned content`);
          }
        }
      }
      
      // Also check inline components map
      if (inlineId && inlineComponents.has(inlineId)) {
        const inlineComponent = inlineComponents.get(inlineId);
        const updatedInlineComponent = {
          ...inlineComponent,
          content: {
            ...inlineComponent.content,
            html: currentContent,
            text: textContent
          }
        };
        setInlineComponents(prev => new Map(prev.set(inlineId, updatedInlineComponent)));
        console.log(`✅ Updated inline component ${inlineId} with current content`);
      }
    });
    
    if (foundMainEditor) {
      console.log('✅ Main editor content captured and rootEmailHTML updated');
      
      // CRITICAL FIX: Also update any freeform_editor component with the complete main editor content
      const freeformIndex = updatedComponents.findIndex(c => c.type === 'freeform_editor');
      if (freeformIndex !== -1 && mainEditorContent) {
        console.log('🔄 Updating freeform_editor component with complete main editor content');
        updatedComponents[freeformIndex] = {
          ...updatedComponents[freeformIndex],
          content: {
            ...updatedComponents[freeformIndex].content,
            html: mainEditorContent,
            text: mainEditorContent.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
          }
        };
        console.log('✅ Updated freeform_editor with mainEditorContent (', mainEditorContent.length, 'characters)');
        console.log('✅ Updated content first 100 chars:', mainEditorContent.substring(0, 100));
      }
    }
    
    console.log('🔄 Capture complete. Updated', updatedComponents.length, 'components');
    return updatedComponents;
  };

  // Separate function to handle DOM updates
  const updateComponentInDOM = (inlineComponentId, component, updates) => {
    console.log('🔄 updateComponentInDOM called with:', inlineComponentId, component);
    console.log('🔄 Component content passed in:', component.content);
    console.log('🔄 Updates passed in:', updates);
    
    // First check if it's in a freeform editor
    const freeformComponent = emailComponents.find(c => c.type === 'freeform_editor');
    console.log('🔍 Found freeform component:', freeformComponent ? 'YES' : 'NO');
    
    if (freeformComponent) {
      // Try multiple selectors to find the editor element
      let editorElement = document.querySelector(`[data-component-id="${freeformComponent.id}"] [contenteditable]`);
      console.log('🔍 Trying selector 1 - [data-component-id] [contenteditable]:', editorElement ? 'YES' : 'NO');
      
      if (!editorElement) {
        editorElement = document.querySelector(`[contenteditable="true"]`);
        console.log('🔍 Trying selector 2 - [contenteditable="true"]:', editorElement ? 'YES' : 'NO');
      }
      
      if (!editorElement) {
        editorElement = document.querySelector('.freeform-editor [contenteditable]');
        console.log('🔍 Trying selector 3 - .freeform-editor [contenteditable]:', editorElement ? 'YES' : 'NO');
      }
      
      if (!editorElement) {
        // Look for any contenteditable element containing our component
        const allEditables = document.querySelectorAll('[contenteditable]');
        console.log('🔍 Found', allEditables.length, 'contenteditable elements total');
        
        for (let i = 0; i < allEditables.length; i++) {
          const editable = allEditables[i];
          const componentElement = editable.querySelector(`[data-component-id="${inlineComponentId}"]`);
          if (componentElement) {
            editorElement = editable;
            console.log('🔍 Found editor via component search:', 'YES');
            break;
          }
        }
      }
      
      console.log('🔍 Final editor element found:', editorElement ? 'YES' : 'NO');
      
      if (editorElement) {
        // Find the specific inline component in the DOM and update it
        let inlineElement = editorElement.querySelector(`[data-component-id="${inlineComponentId}"]`);
        console.log('🔍 Found inline element with data-component-id:', inlineElement ? 'YES' : 'NO');
        
        // If not found, try alternative selectors
        if (!inlineElement) {
          // Try searching in the entire document
          inlineElement = document.querySelector(`[data-component-id="${inlineComponentId}"]`);
          console.log('🔍 Found inline element in document:', inlineElement ? 'YES' : 'NO');
        }
        
        if (!inlineElement) {
          // Try searching for any inline component with matching ID in class or attributes
          const allInlineComponents = document.querySelectorAll('.inline-component');
          console.log('🔍 Found', allInlineComponents.length, 'inline components total');
          
          for (let i = 0; i < allInlineComponents.length; i++) {
            const comp = allInlineComponents[i];
            if (comp.dataset.componentId === inlineComponentId || 
                comp.getAttribute('data-component-id') === inlineComponentId) {
              inlineElement = comp;
              console.log('🔍 Found inline element via class search');
              break;
            }
          }
        }
        
        if (inlineElement) {
          console.log('🔄 Regenerating inline component HTML with updates...');
          const updatedContent = component.content;
          console.log('🔍 Component content:', component.content);
          console.log('🔍 Updates applied:', updates);
          console.log('🔍 Final merged content:', updatedContent);
          
          // Generate new HTML with the merged content
          const newHTML = generateInlineComponentHTML(component.type, inlineComponentId, updatedContent);
          console.log('🔄 Generated new HTML (first 500 chars):', newHTML.substring(0, 500) + '...');
          console.log('🔥 Component type:', component.type);
          console.log('🔥 Component ID:', inlineComponentId);
          console.log('🔥 Updated content being used:', updatedContent);
          
          // Replace the element in the DOM
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = newHTML;
          const newElement = tempDiv.firstElementChild;
          
          if (newElement && inlineElement.parentNode) {
            inlineElement.parentNode.replaceChild(newElement, inlineElement);
            console.log('✅ Replaced element in DOM');
            
            // Re-apply selection styling to the new element
            newElement.style.border = '3px solid #00f0a0';
            
            // DO NOT update freeform component - this destroys inline components via generatePreviewHTML
            console.log('✅ Skipped freeform component update to preserve inline components');
            
            // Ensure the component is still selected
            setSelectedComponent(inlineComponentId);
          } else {
            console.log('❌ Failed to create or insert new element');
          }
        } else {
          console.log('❌ Inline element not found in DOM');
        }
      } else {
        console.log('❌ Editor element not found - trying alternative update methods');
        
        // Try to update using any contenteditable element that contains the component
        const allEditables = document.querySelectorAll('[contenteditable]');
        console.log('🔍 Searching through', allEditables.length, 'contenteditable elements');
        
        let foundAndUpdated = false;
        for (let i = 0; i < allEditables.length; i++) {
          const editable = allEditables[i];
          const inlineElement = editable.querySelector(`[data-component-id="${inlineComponentId}"]`);
          
          if (inlineElement) {
            console.log('🔍 Found component in contenteditable element', i);
            
            // Generate new HTML with updated content
            const newHTML = generateInlineComponentHTML(component.type, inlineComponentId, component.content);
            console.log('🔥 Generated HTML preview:', newHTML.substring(0, 200) + '...');
            console.log('🔥 Component content being used:', component.content);
            
            // Replace the element
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newHTML;
            const newElement = tempDiv.firstElementChild;
            
            if (newElement && inlineElement.parentNode) {
              // Preserve drag functionality
              newElement.draggable = true;
              newElement.style.cursor = 'move';
              
              // Add event listener for continued dragging
              newElement.addEventListener('dragstart', (e) => {
                console.log('🚀 Re-dragging updated component:', inlineComponentId);
                e.dataTransfer.setData('text/html', newElement.outerHTML);
                e.dataTransfer.setData('componentId', inlineComponentId);
                e.dataTransfer.setData('componentIndex', 'inline');
                e.stopPropagation();
              });
              
              inlineElement.parentNode.replaceChild(newElement, inlineElement);
              console.log('✅ Successfully updated component in DOM');
              
              // Re-apply selection styling
              newElement.style.border = '3px solid #00f0a0';
              
              // DO NOT UPDATE FREEFORM COMPONENT - this triggers destructive re-renders
              // The inline component update is sufficient, no need to update the container
              console.log('✅ Skipping freeform component update to prevent destructive re-render');
              
              // Update frozen HTML directly without triggering React state change
              frozenHTML.set('main-editor', editable.innerHTML);
              if (freeformComponent) {
                frozenHTML.set(freeformComponent.id, editable.innerHTML);
              }
              console.log('🧊 Updated frozen HTML directly after successful component update');
              
              foundAndUpdated = true;
              toast.success('Component updated!');
              break;
            }
          }
        }
        
        if (!foundAndUpdated) {
          console.log('❌ Could not find component in any contenteditable element');
          console.log('🔄 Attempting to recreate component in freeform editor');
          
          // Try to find the freeform editor and add the component back
          const freeformComponent = emailComponents.find(c => c.type === 'freeform_editor');
          if (freeformComponent) {
            const editorElement = document.querySelector('[contenteditable="true"]');
            if (editorElement) {
              // Generate the HTML for this component
              const newHTML = generateInlineComponentHTML(component.type, inlineComponentId, component.content);
              
              // Add it back to the editor
              editorElement.insertAdjacentHTML('beforeend', newHTML);
              
              // Re-attach event handlers
              setTimeout(() => {
                const newElement = editorElement.querySelector(`[data-component-id="${inlineComponentId}"]`);
                if (newElement) {
                  newElement.draggable = true;
                  newElement.style.cursor = 'move';
                  
                  newElement.addEventListener('dragstart', (e) => {
                    console.log('🚀 Re-dragging recreated component:', inlineComponentId);
                    e.dataTransfer.setData('text/html', newElement.outerHTML);
                    e.dataTransfer.setData('componentId', inlineComponentId);
                    e.dataTransfer.setData('componentIndex', 'inline');
                    e.stopPropagation();
                  });
                  
                  console.log('✅ Recreated component in DOM');
                  toast.success('Component updated!');
                  
                  // DO NOT UPDATE FREEFORM COMPONENT - this triggers destructive re-renders
                  console.log('✅ Skipping freeform component update to prevent destructive re-render');
                  
                  // Update frozen HTML directly without triggering React state change
                  frozenHTML.set('main-editor', editorElement.innerHTML);
                  if (freeformComponent) {
                    frozenHTML.set(freeformComponent.id, editorElement.innerHTML);
                  }
                  console.log('🧊 Updated frozen HTML directly after component recreation');
                } else {
                  console.log('❌ Failed to recreate component');
                  toast.error('Failed to update component visually');
                }
              }, 100);
            } else {
              console.log('❌ Could not find contenteditable element for recreation');
              toast.error('Failed to update component visually');
            }
          } else {
            console.log('❌ Could not find freeform component for recreation');
            toast.error('Failed to update component visually');
          }
        }
      }
    } else {
      // Component is at the root level, not in a freeform editor
      console.log('🔍 Component is at root level, updating directly...');
      
      // Find the inline component in the root email container
      const rootEditor = document.querySelector('[contenteditable="true"]');
      if (rootEditor) {
        const inlineElement = rootEditor.querySelector(`[data-component-id="${inlineComponentId}"]`);
        console.log('🔍 Found inline element in root:', inlineElement ? 'YES' : 'NO');
        
        if (inlineElement) {
          const updatedContent = component.content;
          console.log('🔍 Updating root inline component with:', updatedContent);
          
          // Generate new HTML with the simple inline component generator
          const newHTML = generateSimpleInlineComponent(component.type, inlineComponentId, updatedContent);
          console.log('🔄 Generated new HTML for root component');
          
          // Replace the element in the DOM
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = newHTML;
          const newElement = tempDiv.firstElementChild;
          
          if (newElement && inlineElement.parentNode) {
            inlineElement.parentNode.replaceChild(newElement, inlineElement);
            console.log('✅ Replaced element in root DOM');
            
            // Re-apply selection styling to the new element
            newElement.style.border = '3px solid #00f0a0';
            
            // Update the root HTML state
            setRootEmailHTML(rootEditor.innerHTML);
            console.log('✅ Updated root email HTML state');
            
            // Ensure the component is still selected
            setSelectedComponent(inlineComponentId);
          } else {
            console.log('❌ Failed to create or insert new element in root');
          }
        } else {
          console.log('❌ Inline element not found in root DOM');
        }
      } else {
        console.log('❌ Root editor not found');
      }
    }
  };

  // Generate simplified inline component HTML for root-level insertion
  const generateSimpleInlineComponent = (componentType, componentId, content) => {
    console.log('🏗️ Generating simple inline component for:', componentType);
    
    // Store component data for later editing
    if (!window.emailInlineComponents) {
      window.emailInlineComponents = new Map();
    }
    window.emailInlineComponents.set(componentId, { type: componentType, content });
    
    // Return clean HTML with data attributes for identification
    switch (componentType) {
      case 'hero':
        return `
          <div data-component-id="${componentId}" data-component-type="${componentType}" class="email-inline-component" draggable="true" ondragstart="event.dataTransfer.setData('componentId', '${componentId}'); event.dataTransfer.effectAllowed = 'move';" style="background: ${content.backgroundColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}; color: ${content.textColor || 'white'}; padding: 40px 20px; text-align: ${content.alignment || 'center'}; border-radius: 8px; margin: 20px 0; cursor: move; position: relative; user-select: none;">
            <div class="component-edit-overlay" style="position: absolute; top: 0; right: 0; display: none; gap: 4px; padding: 4px; background: rgba(0,0,0,0.5); border-radius: 4px;">
              <button onclick="window.editInlineComponent('${componentId}')" style="background: #00f0a0; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">Edit</button>
              <button onclick="window.deleteInlineComponent('${componentId}')" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">Delete</button>
            </div>
            <h1 style="font-size: 2.5rem; font-weight: bold; margin: 0 0 1rem 0; color: ${content.textColor || 'white'}; pointer-events: none;">${content.title || 'Welcome to Our Newsletter'}</h1>
            <p style="font-size: 1.25rem; margin: 0 0 2rem 0; opacity: 0.9; color: ${content.textColor || 'white'}; pointer-events: none;">${content.subtitle || 'Stay updated with the latest news and offers'}</p>
            <a href="${content.ctaUrl || '#'}" style="display: inline-block; background: ${content.ctaBackgroundColor || 'white'}; color: ${content.ctaTextColor || '#667eea'}; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; pointer-events: none;">${content.ctaText || 'Get Started'}</a>
          </div>
        `;
      case 'cta_primary':
        return `
          <div data-component-id="${componentId}" data-component-type="${componentType}" class="email-inline-component" draggable="true" ondragstart="event.dataTransfer.setData('componentId', '${componentId}'); event.dataTransfer.effectAllowed = 'move';" style="text-align: ${content.alignment || 'center'}; margin: 20px 0; position: relative; cursor: move; user-select: none;">
            <div class="component-edit-overlay" style="position: absolute; top: 0; right: 0; display: none; gap: 4px; padding: 4px; background: rgba(0,0,0,0.5); border-radius: 4px; z-index: 10;">
              <button onclick="window.editInlineComponent('${componentId}')" style="background: #00f0a0; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">Edit</button>
              <button onclick="window.deleteInlineComponent('${componentId}')" style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">Delete</button>
            </div>
            <a href="${content.url || '#'}" style="display: inline-block; background: ${content.backgroundColor || '#00f0a0'}; color: ${content.textColor || 'white'}; padding: ${content.padding || '16px 32px'}; text-decoration: none; border-radius: ${content.borderRadius || '8px'}; font-size: ${content.fontSize || '18px'}; font-weight: 600; pointer-events: none;">${content.text || 'Start Your Free Trial'}</a>
          </div>
        `;
      case 'product_showcase':
        return `
          <div data-component-id="${componentId}" data-component-type="${componentType}" class="email-inline-component" draggable="true" ondragstart="event.dataTransfer.setData('componentId', '${componentId}'); event.dataTransfer.effectAllowed = 'move';" style="border: 1px solid ${content.borderColor || '#e5e7eb'}; border-radius: 8px; padding: 24px; text-align: center; margin: 20px 0; background: ${content.backgroundColor || 'white'}; cursor: move; user-select: none; position: relative;">
            <img src="${content.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop'}" alt="${content.title || 'Featured Product'}" style="width: 100%; max-width: 300px; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 16px; pointer-events: none;">
            <h3 style="font-size: 1.5rem; font-weight: bold; margin: 0 0 8px 0; color: ${content.titleColor || '#1f2937'}; pointer-events: none;">${content.title || 'Featured Product'}</h3>
            <p style="color: ${content.textColor || '#6b7280'}; margin: 0 0 16px 0; pointer-events: none;">${content.description || 'Discover our latest offering with amazing features and benefits.'}</p>
            <div style="display: flex; justify-content: center; align-items: center; gap: 16px; flex-wrap: wrap; pointer-events: none;">
              <span style="font-size: 1.5rem; font-weight: bold; color: ${content.priceColor || '#10b981'};">${content.price || '$99.99'}</span>
              <a href="${content.ctaUrl || '#'}" style="background: ${content.ctaBackgroundColor || '#00f0a0'}; color: ${content.ctaTextColor || 'white'}; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 600;">${content.ctaText || 'Shop Now'}</a>
            </div>
          </div>
        `;
      case 'button_group':
        return `
          <div data-component-id="${componentId}" data-component-type="${componentType}" class="email-inline-component" draggable="true" ondragstart="event.dataTransfer.setData('componentId', '${componentId}'); event.dataTransfer.effectAllowed = 'move';" style="display: flex; justify-content: center; gap: 16px; margin: 20px 0; flex-wrap: wrap; cursor: move; user-select: none; position: relative; padding: 8px; border-radius: 8px;">
            <a href="${content.primaryUrl || '#'}" style="background: ${content.primaryBackgroundColor || '#00f0a0'}; color: ${content.primaryTextColor || 'white'}; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; pointer-events: none;">${content.primaryText || 'Learn More'}</a>
            <a href="${content.secondaryUrl || '#'}" style="background: ${content.secondaryBackgroundColor || 'transparent'}; color: ${content.secondaryTextColor || '#00f0a0'}; padding: 12px 24px; text-decoration: none; border-radius: 6px; border: 2px solid ${content.secondaryBorderColor || '#00f0a0'}; font-weight: 600; pointer-events: none;">${content.secondaryText || 'Contact Us'}</a>
          </div>
        `;
      case 'social_links':
        return `
          <div data-component-id="${componentId}" data-component-type="${componentType}" class="email-inline-component" draggable="true" ondragstart="event.dataTransfer.setData('componentId', '${componentId}'); event.dataTransfer.effectAllowed = 'move';" style="text-align: center; padding: 20px 0; margin: 20px 0; cursor: move; user-select: none; position: relative; border-radius: 8px; background: ${content.backgroundColor || 'transparent'};">
            <h3 style="margin: 0 0 16px 0; color: ${content.titleColor || '#1f2937'}; pointer-events: none;">${content.title || 'Follow Us'}</h3>
            <div style="display: flex; justify-content: center; gap: 16px; pointer-events: none;">
              <a href="${content.facebookUrl || '#'}" style="color: ${content.linkColor || '#00f0a0'}; text-decoration: none;">Facebook</a>
              <a href="${content.twitterUrl || '#'}" style="color: ${content.linkColor || '#00f0a0'}; text-decoration: none;">Twitter</a>
              <a href="${content.linkedinUrl || '#'}" style="color: ${content.linkColor || '#00f0a0'}; text-decoration: none;">LinkedIn</a>
            </div>
          </div>
        `;
      case 'testimonial':
        return `
          <div data-component-id="${componentId}" data-component-type="${componentType}" class="email-inline-component" draggable="true" ondragstart="event.dataTransfer.setData('componentId', '${componentId}'); event.dataTransfer.effectAllowed = 'move';" style="background: ${content.backgroundColor || 'transparent'}; border-left: 4px solid ${content.borderColor || '#00f0a0'}; padding: 20px; margin: 20px 0; border-radius: 4px; cursor: move; user-select: none; position: relative;">
            <p style="font-style: italic; color: ${content.quoteColor || '#4b5563'}; margin: 0 0 12px 0; pointer-events: none;">"${content.quote || 'This product has transformed our business in ways we never imagined.'}"</p>
            <div style="font-weight: 600; color: ${content.authorColor || '#1f2937'}; pointer-events: none;">${content.author || 'Jane Doe'}</div>
            <div style="color: ${content.roleColor || '#6b7280'}; font-size: 0.875rem; pointer-events: none;">${content.role || 'CEO, Example Corp'}</div>
          </div>
        `;
      case 'text_rich':
        return `
          <div data-component-id="${componentId}" data-component-type="${componentType}" class="email-inline-component" draggable="true" ondragstart="event.dataTransfer.setData('componentId', '${componentId}'); event.dataTransfer.effectAllowed = 'move';" style="padding: 20px; margin: 20px 0; border-radius: 8px; cursor: move; user-select: none; position: relative; background: ${content.backgroundColor || 'white'};">
            <h2 style="font-size: 1.5rem; font-weight: bold; margin: 0 0 1rem 0; color: ${content.titleColor || '#1f2937'}; pointer-events: none;">${content.title || 'Rich Text Section'}</h2>
            <p style="color: ${content.textColor || '#4b5563'}; line-height: 1.6; margin: 0; pointer-events: none;">${content.text || 'This is a rich text section where you can add detailed content, multiple paragraphs, and formatting to engage your readers.'}</p>
          </div>
        `;
      case 'social_proof':
        return `
          <div data-component-id="${componentId}" data-component-type="${componentType}" class="email-inline-component" draggable="true" ondragstart="event.dataTransfer.setData('componentId', '${componentId}'); event.dataTransfer.effectAllowed = 'move';" style="text-align: center; padding: 24px; margin: 20px 0; background: ${content.backgroundColor || 'transparent'}; border-radius: 12px; cursor: move; user-select: none; position: relative;">
            <div style="font-size: 2rem; font-weight: bold; color: ${content.numberColor || '#00f0a0'}; margin-bottom: 8px; pointer-events: none;">${content.number || '10,000+'}</div>
            <div style="color: ${content.descriptionColor || '#64748b'}; font-size: 1rem; pointer-events: none;">${content.description || 'Happy customers trust our service'}</div>
          </div>
        `;
      case 'spacer':
        return `
          <div data-component-id="${componentId}" data-component-type="${componentType}" class="email-inline-component" draggable="true" ondragstart="event.dataTransfer.setData('componentId', '${componentId}'); event.dataTransfer.effectAllowed = 'move';" style="height: ${content.height || '40px'}; margin: 20px 0; cursor: move; user-select: none; position: relative; background: ${content.backgroundColor || 'linear-gradient(90deg, #e5e7eb 0%, transparent 50%, #e5e7eb 100%)'}; border-radius: 4px; opacity: ${content.opacity || '0.5'};">
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 12px; color: ${content.textColor || '#9ca3af'}; pointer-events: none;">Spacer (${content.height || '40px'})</div>
          </div>
        `;
      case 'divider_fancy':
        return `
          <div data-component-id="${componentId}" data-component-type="${componentType}" class="email-inline-component" draggable="true" ondragstart="event.dataTransfer.setData('componentId', '${componentId}'); event.dataTransfer.effectAllowed = 'move';" style="text-align: center; margin: 30px 0; cursor: move; user-select: none; position: relative; padding: 10px; background: ${content.backgroundColor || 'transparent'};">
            <div style="display: inline-block; position: relative; pointer-events: none;">
              <div style="width: ${content.width || '60px'}; height: ${content.height || '3px'}; background: ${content.lineColor || 'linear-gradient(90deg, #00f0a0, #8b5cf6)'}; border-radius: 2px; margin: 0 auto;"></div>
              <div style="width: 8px; height: 8px; background: ${content.dotColor || '#00f0a0'}; border-radius: 50%; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);"></div>
            </div>
          </div>
        `;
      case 'footer_professional':
        return `
          <div data-component-id="${componentId}" data-component-type="${componentType}" class="email-inline-component" draggable="true" ondragstart="event.dataTransfer.setData('componentId', '${componentId}'); event.dataTransfer.effectAllowed = 'move';" style="background: ${content.backgroundColor || '#1f2937'}; color: ${content.textColor || 'white'}; padding: 32px 20px; margin: 20px 0; border-radius: 8px; cursor: move; user-select: none; position: relative;">
            <div style="text-align: center; border-bottom: 1px solid ${content.borderColor || '#374151'}; padding-bottom: 20px; margin-bottom: 20px; pointer-events: none;">
              <div style="font-size: 1.25rem; font-weight: bold; margin-bottom: 8px; color: ${content.companyNameColor || content.textColor || 'white'};">${content.companyName || 'Your Company'}</div>
              <div style="color: ${content.taglineColor || '#9ca3af'}; font-size: 0.875rem;">${content.tagline || 'Building the future of business'}</div>
            </div>
            <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px; flex-wrap: wrap; pointer-events: none;">
              <a href="${content.websiteUrl || '#'}" style="color: ${content.linkColor || '#60a5fa'}; text-decoration: none; font-size: 0.875rem;">Website</a>
              <a href="${content.privacyUrl || '#'}" style="color: ${content.linkColor || '#60a5fa'}; text-decoration: none; font-size: 0.875rem;">Privacy Policy</a>
              <a href="${content.unsubscribeUrl || '#'}" style="color: ${content.linkColor || '#60a5fa'}; text-decoration: none; font-size: 0.875rem;">Unsubscribe</a>
            </div>
            <div style="text-align: center; color: ${content.copyrightColor || '#6b7280'}; font-size: 0.75rem; pointer-events: none;">
              © ${new Date().getFullYear()} ${content.companyName || 'Your Company'}. All rights reserved.
            </div>
          </div>
        `;
      default:
        return `
          <div data-component-id="${componentId}" data-component-type="${componentType}" class="email-inline-component" draggable="true" ondragstart="event.dataTransfer.setData('componentId', '${componentId}'); event.dataTransfer.effectAllowed = 'move';" style="padding: 20px; margin: 20px 0; background: transparent; border-radius: 8px; text-align: center; cursor: move; user-select: none; position: relative;">
            <p style="color: #6b7280; pointer-events: none;">${componentType} component</p>
          </div>
        `;
    }
  };

  // Generate HTML for inline component based on current properties
  const generateInlineComponentHTML = (componentType, componentId, content) => {
    console.log('🏗️ Generating HTML for:', componentType, 'with content:', content);
    
    switch (componentType) {
      case 'hero':
        return `
          <div data-component-type="${componentType}" data-component-id="${componentId}" class="inline-component" draggable="true" style="background: ${content.backgroundColor || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}; color: ${content.textColor || 'white'}; padding: 40px 20px; text-align: ${content.alignment || 'center'}; border-radius: 8px; margin: 20px 0; cursor: move; position: relative; user-select: none; border: 2px solid transparent;">
            <h1 data-editable="title" style="font-size: 2.5rem; font-weight: bold; margin: 0 0 1rem 0; color: ${content.textColor || 'white'};">${content.title || 'Welcome to Our Newsletter'}</h1>
            <p data-editable="subtitle" style="font-size: 1.25rem; margin: 0 0 2rem 0; opacity: 0.9; color: ${content.textColor || 'white'};">${content.subtitle || 'Stay updated with the latest news and offers'}</p>
            <a data-editable="ctaText" href="${content.ctaUrl || 'https://example.com'}" style="display: inline-block; background: ${content.ctaBackgroundColor || 'white'}; color: ${content.ctaTextColor || '#667eea'}; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">${content.ctaText || 'Get Started'}</a>
          </div>
        `;
      case 'cta_primary':
        return `
          <div data-component-type="${componentType}" data-component-id="${componentId}" class="inline-component" draggable="true" style="text-align: ${content.alignment || 'center'}; margin: 20px 0; cursor: move; position: relative; user-select: none; border: 2px solid transparent;" onmouseover="this.style.border='2px solid #00f0a0'" onmouseout="this.style.border='2px solid transparent'">
            <a data-editable="text" href="${content.url || 'https://example.com'}" style="display: inline-block; background: ${content.backgroundColor || '#00f0a0'}; color: ${content.textColor || 'white'}; padding: ${content.padding || '16px 32px'}; text-decoration: none; border-radius: ${content.borderRadius || '8px'}; font-size: ${content.fontSize || '18px'}; font-weight: 600;">${content.text || 'Start Your Free Trial'}</a>
          </div>
        `;
      case 'product_showcase':
        return `
          <div data-component-type="${componentType}" data-component-id="${componentId}" class="inline-component" draggable="true" style="border: 1px solid ${content.borderColor || '#e5e7eb'}; border-radius: 8px; padding: 24px; text-align: center; margin: 20px 0; background: ${content.backgroundColor || 'white'}; cursor: move; user-select: none; position: relative;" onmouseover="this.style.border='2px solid #00f0a0'" onmouseout="this.style.border='1px solid ${content.borderColor || '#e5e7eb'}'">
            <img src="${content.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop'}" alt="${content.title || 'Featured Product'}" style="width: 100%; max-width: 300px; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 16px;" onload="console.log('✅ Product image loaded:', this.src)" onerror="console.error('❌ Product image failed to load:', this.src); this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop'">
            <h3 style="font-size: 1.5rem; font-weight: bold; margin: 0 0 8px 0; color: #1f2937;">${content.title || 'Featured Product'}</h3>
            <p style="color: #6b7280; margin: 0 0 16px 0;">${content.description || 'Discover our latest offering with amazing features and benefits.'}</p>
            <div style="display: flex; justify-content: center; align-items: center; gap: 16px; flex-wrap: wrap;">
              <span style="font-size: 1.5rem; font-weight: bold; color: #10b981;">${content.price || '$99.99'}</span>
              <a href="${content.ctaUrl || 'https://example.com/product'}" style="background: #00f0a0; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: 600;">${content.ctaText || 'Shop Now'}</a>
            </div>
          </div>
        `;
      case 'button_group':
        const buttons = content.buttons || [
          { text: 'Primary Action', url: 'https://example.com', backgroundColor: '#00f0a0', textColor: 'white' },
          { text: 'Secondary Action', url: 'https://example.com', backgroundColor: 'transparent', textColor: '#00f0a0' }
        ];
        return `
          <div data-component-type="${componentType}" data-component-id="${componentId}" class="inline-component" draggable="true" style="display: flex; justify-content: center; gap: 12px; margin: 20px 0; flex-wrap: wrap; cursor: move; user-select: none; border: 2px solid transparent; border-radius: 8px; padding: 8px; position: relative;" onmouseover="this.style.border='2px solid #00f0a0'" onmouseout="this.style.border='2px solid transparent'">
            ${buttons.map(button => `
              <a href="${button.url || 'https://example.com'}" style="display: inline-block; background: ${button.backgroundColor || '#00f0a0'}; color: ${button.textColor || 'white'}; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; ${button.backgroundColor === 'transparent' ? 'border: 2px solid ' + button.textColor : ''}">${button.text || 'Button'}</a>
            `).join('')}
          </div>
        `;
      case 'text_rich':
        return `
          <div data-component-type="${componentType}" data-component-id="${componentId}" class="inline-component" draggable="true" style="margin: 20px 0; cursor: move; user-select: none; border: 2px solid transparent; border-radius: 4px; position: relative;" onmouseover="this.style.border='2px solid #00f0a0'" onmouseout="this.style.border='2px solid transparent'">
            <div style="font-size: ${content.fontSize || '16px'}; color: ${content.textColor || '#374151'}; text-align: ${content.alignment || 'left'}; line-height: ${content.lineHeight || '1.6'}; padding: ${content.padding || '10px 0'};">
              ${content.text || 'Enter your text here...'}
            </div>
          </div>
        `;
      case 'social_proof':
        return `
          <div data-component-type="${componentType}" data-component-id="${componentId}" class="inline-component" draggable="true" style="border: 1px solid ${content.borderColor || '#e5e7eb'}; border-radius: 8px; padding: 24px; margin: 20px 0; background: ${content.backgroundColor || 'white'}; cursor: move; user-select: none; position: relative;" onmouseover="this.style.border='2px solid #00f0a0'" onmouseout="this.style.border='1px solid ${content.borderColor || '#e5e7eb'}'">
            <div style="text-align: center;">
              <div style="margin-bottom: 16px; color: #fbbf24;">
                ${'★'.repeat(content.rating || 5)}
              </div>
              <p style="font-style: italic; color: #6b7280; margin: 0 0 16px 0; font-size: 16px;">"${content.content || 'This product exceeded my expectations!'}"</p>
              <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
                <img src="${content.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face'}" alt="${content.author || 'Customer'}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
                <div>
                  <div style="font-weight: 600; color: #1f2937; font-size: 14px;">${content.author || 'Happy Customer'}</div>
                  <div style="color: #6b7280; font-size: 12px;">${content.company || 'Verified Buyer'}</div>
                </div>
              </div>
            </div>
          </div>
        `;
      case 'divider':
        return `
          <div data-component-type="${componentType}" data-component-id="${componentId}" class="inline-component" draggable="true" style="margin: 20px 0; cursor: move; user-select: none; border: 2px solid transparent; border-radius: 4px; position: relative; text-align: center;" onmouseover="this.style.border='2px solid #00f0a0'" onmouseout="this.style.border='2px solid transparent'">
            <hr style="border: none; height: ${content.thickness || '1px'}; background: ${content.color || '#e5e7eb'}; width: ${content.width || '100%'}; margin: ${content.height || '20px'} auto;">
          </div>
        `;
      case 'footer':
        return `
          <div data-component-type="${componentType}" data-component-id="${componentId}" class="inline-component" draggable="true" style="background: ${content.backgroundColor || 'transparent'}; color: ${content.textColor || '#6b7280'}; padding: 24px; margin: 20px 0; border-radius: 8px; cursor: move; user-select: none; position: relative;" onmouseover="this.style.border='2px solid #00f0a0'" onmouseout="this.style.border='2px solid transparent'">
            <div style="text-align: center; font-size: 14px;">
              <div style="margin-bottom: 12px; font-weight: 600; color: ${content.textColor || '#1f2937'};">${content.companyName || 'Company Name'}</div>
              <div style="margin-bottom: 8px;">${content.address || '123 Main Street, City, State 12345'}</div>
              <div style="margin-bottom: 8px;">
                <a href="tel:${content.phone || '+1234567890'}" style="color: ${content.textColor || '#6b7280'}; text-decoration: none;">${content.phone || '(123) 456-7890'}</a> • 
                <a href="mailto:${content.email || 'contact@company.com'}" style="color: ${content.textColor || '#6b7280'}; text-decoration: none;">${content.email || 'contact@company.com'}</a>
              </div>
              <div style="font-size: 12px; margin-top: 12px; opacity: 0.8;">
                <a href="#" style="color: ${content.textColor || '#6b7280'}; text-decoration: underline;">${content.unsubscribeText || 'Unsubscribe from this list'}</a>
              </div>
            </div>
          </div>
        `;
      default:
        console.log('⚠️ Unknown component type, using default:', componentType);
        return `<div data-component-type="${componentType}" data-component-id="${componentId}" class="inline-component" draggable="true" style="background: transparent; border: 2px dashed #9ca3af; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; color: #6b7280; cursor: move; user-select: none; position: relative;" onmouseover="this.style.border='2px solid #00f0a0'" onmouseout="this.style.border='2px dashed #9ca3af'">New ${componentType.replace('_', ' ')} component</div>`;
    }
  };

  // Update the HTML of a specific inline component by regenerating it
  const updateInlineComponentHTML = (element, componentId, updates) => {
    const component = inlineComponents.get(componentId);
    if (!component) return;

    const updatedContent = { ...component.content, ...updates };
    console.log('🔄 Updating inline component HTML:', componentId, 'with updates:', updates);
    console.log('🔍 Current component content:', component.content);
    console.log('🔍 Updated component content:', updatedContent);
    
    // Generate new HTML with updated content
    const newHTML = generateInlineComponentHTML(component.type, componentId, updatedContent);
    
    // Replace the element with the new HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newHTML;
    const newElement = tempDiv.firstElementChild;
    
    if (newElement && element.parentNode) {
      element.parentNode.replaceChild(newElement, element);
      console.log('✅ Inline component HTML updated');
    }
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('componentType');
    const componentIndex = e.dataTransfer.getData('componentIndex');
    
    if (componentType) {
      // Adding new component
      addComponentAtIndex(componentType, dropIndex);
    } else if (componentIndex !== '') {
      // Reordering existing component
      const fromIndex = parseInt(componentIndex);
      let toIndex = dropIndex;
      
      // Adjust drop index if moving component down
      if (fromIndex < toIndex) {
        toIndex = toIndex - 1;
      }
      
      if (fromIndex !== toIndex) {
        moveComponent(fromIndex, toIndex);
      }
    }
    
    setDragOverIndex(null);
    setIsDragging(false);
  };

  // Enhanced preview HTML generation with original styles
  const generatePreviewHTML = (components) => {
    console.log('🎨 Generating preview HTML from', components.length, 'components');
    console.log('🎨 Using original styles:', originalEmailStyles ? 'YES' : 'NO');
    
    // Check if we have main editor content that should be included
    const hasMainEditorContent = rootEmailHTML && rootEmailHTML.trim().length > 50 && 
                                !rootEmailHTML.includes('Click here to edit') &&
                                !rootEmailHTML.includes('Start typing your email');
    console.log('🎨 Has main editor content:', hasMainEditorContent);
    
    if (hasMainEditorContent && components.length === 0) {
      // If we only have main editor content and no components, return it directly
      console.log('🎨 Returning main editor content directly');
      return rootEmailHTML;
    }
    
    if (hasMainEditorContent && components.length > 0) {
      // If we have both components and main editor content, combine them
      console.log('🎨 Combining components with main editor content');
    }
    
    const componentHTML = components.map(component => {
      switch (component.type) {
        case 'hero':
          return `
            <div style="background: ${component.content.backgroundColor}; color: ${component.content.textColor}; text-align: ${component.content.alignment}; padding: 60px 20px;">
              <h1 style="font-size: 48px; font-weight: bold; margin: 0 0 16px 0;">${component.content.title}</h1>
              <p style="font-size: 20px; margin: 0 0 32px 0; opacity: 0.9;">${component.content.subtitle}</p>
              <a href="${component.content.ctaUrl}" style="display: inline-block; background: transparent; color: ${component.content.textColor}; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">${component.content.ctaText}</a>
            </div>
          `;
        case 'text_rich':
          return `
            <div style="padding: ${component.content.padding || '20px'}; font-size: ${component.content.fontSize}; color: ${component.content.textColor}; text-align: ${component.content.alignment};">
              ${component.content.text}
            </div>
          `;
        case 'freeform_editor':
          console.log('🎨 Rendering freeform_editor component:', component.id);
          console.log('🎨 Component content.html length:', component.content.html?.length || 0);
          console.log('🎨 Component content.html first 100 chars:', component.content.html?.substring(0, 100));
          
          // Clean the HTML for email by converting inline components to proper email HTML
          let cleanedHTML = component.content.html || '';
          
          // Convert inline CTA components to email-friendly HTML, preserving their alignment
          cleanedHTML = cleanedHTML.replace(
            /<div[^>]*data-component-type="cta_primary"[^>]*style="[^"]*text-align:\s*([^;]+);[^"]*"[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>.*?<\/div>/g,
            '<div style="text-align: $1; margin: 20px 0;"><a href="$2" style="display: inline-block; background: #00f0a0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">$3</a></div>'
          );
          
          // Fallback for CTAs without explicit alignment (default to center)
          cleanedHTML = cleanedHTML.replace(
            /<div[^>]*data-component-type="cta_primary"[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>.*?<\/div>/g,
            '<div style="text-align: center; margin: 20px 0;"><a href="$1" style="display: inline-block; background: #00f0a0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">$2</a></div>'
          );
          
          // Convert product showcase components with images
          cleanedHTML = cleanedHTML.replace(
            /<div[^>]*data-component-type="product_showcase"[^>]*>.*?<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>.*?<h3[^>]*>([^<]*)<\/h3>.*?<p[^>]*>([^<]*)<\/p>.*?<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>.*?<\/div>/gs,
            `<div style="text-align: center; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0;">
              <img src="$1" alt="$2" style="width: 100%; max-width: 300px; height: auto; border-radius: 8px; margin-bottom: 16px;">
              <h3 style="font-size: 1.5rem; font-weight: bold; margin: 0 0 8px 0;">$3</h3>
              <p style="color: #6b7280; margin: 0 0 16px 0;">$4</p>
              <a href="$5" style="display: inline-block; background: #00f0a0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">$6</a>
            </div>`
          );
          
          // Convert other inline components to simple HTML
          cleanedHTML = cleanedHTML.replace(
            /<div[^>]*data-component-type="[^"]*"[^>]*>(.*?)<\/div>/g,
            '<div style="margin: 10px 0;">$1</div>'
          );
          
          // Remove all interactive attributes and classes that don't work in email
          cleanedHTML = cleanedHTML.replace(/\s*(data-component-[^=]*="[^"]*"|\bclass="[^"]*"|\bdraggable="[^"]*"|\bonmouse[^=]*="[^"]*")/g, '');
          
          console.log('🎨 Cleaned HTML for email first 100 chars:', cleanedHTML.substring(0, 100));
          
          return `
            <div style="padding: ${component.content.padding || '20px'}; font-size: ${component.content.fontSize}; color: ${component.content.textColor}; line-height: ${component.content.lineHeight};">
              ${cleanedHTML}
            </div>
          `;
        case 'cta_primary':
          return `
            <div style="text-align: ${component.content.alignment}; padding: 20px;">
              <a href="${component.content.url}" style="display: inline-block; background: ${component.content.backgroundColor}; color: ${component.content.textColor}; padding: ${component.content.padding}; text-decoration: none; border-radius: ${component.content.borderRadius}; font-size: ${component.content.fontSize}; font-weight: bold;">${component.content.text}</a>
            </div>
          `;
        case 'product_showcase':
          return `
            <div style="background: ${component.content.backgroundColor || 'transparent'}; border: 1px solid ${component.content.borderColor || '#e5e7eb'}; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <img src="${component.content.imageUrl || component.content.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop'}" alt="${component.content.title || 'Product'}" style="width: 100%; max-width: 300px; height: auto; border-radius: 4px; margin: 0 auto 16px auto; display: block;" />
              <h3 style="margin: 16px 0 8px 0; font-size: 24px; font-weight: bold; color: ${component.content.titleColor || '#1f2937'};">${component.content.title || 'Featured Product'}</h3>
              <p style="margin: 0 0 16px 0; color: ${component.content.textColor || '#6b7280'};">${component.content.description || 'Product description'}</p>
              <div style="display: flex; align-items: center; justify-content: center; gap: 16px;">
                <span style="font-size: 24px; font-weight: bold; color: ${component.content.priceColor || '#059669'};">${component.content.price || '$99.99'}</span>
                <a href="${component.content.ctaUrl || '#'}" style="background: ${component.content.ctaBackgroundColor || '#00f0a0'}; color: ${component.content.ctaTextColor || 'white'}; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">${component.content.ctaText || 'Shop Now'}</a>
              </div>
            </div>
          `;
        default:
          return `<div style="padding: 20px; background: transparent; border-radius: 8px; margin: 10px 0;">New ${component.type} Component</div>`;
      }
    }).join('');

    // Create a complete email HTML with original styles preserved
    const baseStyles = `
      .email-wrapper {
        width: 600px !important;
        max-width: 600px !important;
        min-width: 600px !important;
        margin: 0 auto !important;
        display: block !important;
        box-sizing: border-box !important;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: white;
      }
      .email-force-container {
        width: 100% !important;
        display: flex !important;
        justify-content: center !important;
        background: transparent;
        padding: 20px 0;
      }
    `;
    
    const combinedStyles = originalEmailStyles ? 
      `${originalEmailStyles}\n${baseStyles}` : 
      baseStyles;

    // Use the component HTML since components should now contain the latest captured content
    let finalContent = componentHTML;
    console.log('🎨 Using component HTML as content source (components contain captured edits)');

    return `
      <style>
        ${combinedStyles}
      </style>
      <div class="email-force-container">
        ${finalContent.includes('email-wrapper') ? finalContent : `<div class="email-wrapper">${finalContent}</div>`}
      </div>
    `;
  };

  const addComponentAtIndex = (componentType, index) => {
    console.log('🔥🔥🔥 DEBUG: addComponentAtIndex CALLED');
    console.log('  📍 Component type:', componentType);
    console.log('  📍 Index:', index);
    console.log('  📍 Current emailComponents:', emailComponents);
    console.log('  📍 Current emailComponents length:', emailComponents.length);
    console.log('  📍 Current rootEmailHTML exists:', !!rootEmailHTML);
    console.log('  📍 Current rootEmailHTML length:', rootEmailHTML ? rootEmailHTML.length : 0);
    console.log('  📍 rootEmailHTML includes email-wrapper:', rootEmailHTML ? rootEmailHTML.includes('email-wrapper') : false);
    
    let defaultContent = getDefaultContent(componentType);

    const newComponent = {
      id: componentType + '_' + Date.now(),
      type: componentType,
      content: defaultContent
    };
    console.log('  📍 New component created:', newComponent);

    // Insert component at specific index
    const newComponents = [...emailComponents];
    if (index !== undefined && index >= 0) {
      newComponents.splice(index, 0, newComponent);
      console.log('  📍 Component inserted at index:', index);
    } else {
      newComponents.push(newComponent);
      console.log('  📍 Component pushed to end');
    }
    
    console.log('  📍 New components array:', newComponents);
    console.log('  📍 New components length:', newComponents.length);
    
    setEmailComponents(newComponents);
    console.log('  📍 setEmailComponents called with:', newComponents.length, 'components');
    
    // If we have existing email HTML, append the component to it
    // Otherwise generate new HTML from components
    if (rootEmailHTML && rootEmailHTML.includes('email-wrapper')) {
      console.log('  🔵 PATH 1: Appending to existing email HTML');
      console.log('  📍 rootEmailHTML first 500 chars:', rootEmailHTML.substring(0, 500));
      
      // Generate HTML for just this component
      const componentHTML = generateComponentHTML(newComponent);
      console.log('  📍 Generated component HTML:', componentHTML);
      
      // Find the email wrapper and append the component
      const parser = new DOMParser();
      const doc = parser.parseFromString(rootEmailHTML, 'text/html');
      const wrapper = doc.querySelector('.email-wrapper');
      console.log('  📍 Found .email-wrapper element:', !!wrapper);
      
      if (wrapper) {
        console.log('  📍 Email wrapper found, inserting component at index:', index);
        const beforeLength = wrapper.innerHTML.length;
        console.log('  📍 Wrapper innerHTML length BEFORE:', beforeLength);
        console.log('  📍 Component HTML to insert:', componentHTML);
        console.log('  📍 Component HTML length:', componentHTML.length);

        // Insert at correct position based on index
        const existingComponents = wrapper.querySelectorAll('.email-component');
        if (index !== undefined && index >= 0 && index < existingComponents.length) {
          // Insert before the component at the target index
          const targetComponent = existingComponents[index];
          targetComponent.insertAdjacentHTML('beforebegin', componentHTML);
          console.log('  📍 Inserted BEFORE component at index:', index);
        } else {
          // Insert at the end if index is out of bounds or undefined
          wrapper.insertAdjacentHTML('beforeend', componentHTML);
          console.log('  📍 Inserted at END (index out of bounds)');
        }
        
        const afterLength = wrapper.innerHTML.length;
        console.log('  📍 Wrapper innerHTML length AFTER:', afterLength);
        console.log('  📍 Actual HTML length difference:', afterLength - beforeLength);
        
        // Get the updated HTML
        const updatedHTML = doc.documentElement.innerHTML;
        console.log('  📍 Updated HTML length:', updatedHTML.length);
        console.log('  📍 Updated HTML first 500 chars:', updatedHTML.substring(0, 500));
        
        setRootEmailHTML(updatedHTML);
        console.log('  ✅ COMPONENT APPENDED to existing email');
        console.log('  ✅ rootEmailHTML updated, new length:', updatedHTML.length);
      } else {
        console.log('  🟡 Email wrapper NOT found, generating new preview');
        // Fallback: generate from components
        const newPreviewHTML = generatePreviewHTML(newComponents);
        console.log('  📍 Generated preview HTML length:', newPreviewHTML.length);
        setRootEmailHTML(newPreviewHTML);
        console.log('  ✅ GENERATED new preview from components');
      }
    } else {
      console.log('  🔴 PATH 2: No existing HTML or no email-wrapper, generating from components');
      console.log('  📍 rootEmailHTML exists:', !!rootEmailHTML);
      console.log('  📍 rootEmailHTML includes email-wrapper:', rootEmailHTML ? rootEmailHTML.includes('email-wrapper') : false);
      
      // No existing HTML, generate from components
      const newPreviewHTML = generatePreviewHTML(newComponents);
      console.log('  📍 Generated preview HTML length:', newPreviewHTML.length);
      console.log('  📍 Generated preview HTML first 500 chars:', newPreviewHTML.substring(0, 500));
      
      setRootEmailHTML(newPreviewHTML);
      console.log('  ✅ GENERATED new preview from components');
      console.log('  ✅ rootEmailHTML set, new length:', newPreviewHTML.length);
    }
    
    console.log('🔥🔥🔥 DEBUG: addComponentAtIndex COMPLETED');
    console.log('  📍 Final component count:', newComponents.length);
    console.log('  📍 Final rootEmailHTML length:', rootEmailHTML ? rootEmailHTML.length : 0);
    
    toast.success('Component added!');
  };

  // Helper function to generate HTML for a single component
  const generateComponentHTML = (component) => {
    switch (component.type) {
      case 'hero':
        return `
          <div style="background: ${component.content.backgroundColor}; color: ${component.content.textColor}; text-align: ${component.content.alignment}; padding: 60px 20px;">
            <h1 style="font-size: 48px; font-weight: bold; margin: 0 0 16px 0;">${component.content.title}</h1>
            <p style="font-size: 20px; margin: 0 0 32px 0; opacity: 0.9;">${component.content.subtitle}</p>
            <a href="${component.content.ctaUrl}" style="display: inline-block; background: transparent; color: ${component.content.textColor}; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: bold;">${component.content.ctaText}</a>
          </div>
        `;
      case 'text_rich':
        return `
          <div style="padding: ${component.content.padding || '20px'}; font-size: ${component.content.fontSize}; color: ${component.content.textColor}; text-align: ${component.content.alignment};">
            ${component.content.text}
          </div>
        `;
      case 'freeform_editor':
        return `
          <div style="padding: ${component.content.padding || '20px'}; font-size: ${component.content.fontSize}; color: ${component.content.textColor}; line-height: ${component.content.lineHeight};">
            ${component.content.html}
          </div>
        `;
      case 'cta_primary':
        return `
          <div style="text-align: ${component.content.alignment}; padding: 20px;">
            <a href="${component.content.url}" style="display: inline-block; background: ${component.content.backgroundColor}; color: ${component.content.textColor}; padding: ${component.content.padding}; text-decoration: none; border-radius: ${component.content.borderRadius}; font-size: ${component.content.fontSize}; font-weight: bold;">${component.content.text}</a>
          </div>
        `;
      case 'product_showcase':
        return `
          <div style="background: ${component.content.backgroundColor}; border: 1px solid ${component.content.borderColor}; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <img src="${component.content.image}" alt="${component.content.title}" style="width: 100%; max-width: 300px; height: auto; border-radius: 4px;" />
            <h3 style="margin: 16px 0 8px 0; font-size: 24px; font-weight: bold;">${component.content.title}</h3>
            <p style="margin: 0 0 16px 0; color: #6b7280;">${component.content.description}</p>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 24px; font-weight: bold; color: #059669;">${component.content.price}</span>
              <a href="${component.content.ctaUrl}" style="background: #00f0a0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">${component.content.ctaText}</a>
            </div>
          </div>
        `;
      default:
        return `<div style="padding: 20px; background: transparent; border-radius: 8px; margin: 10px 0;">New ${component.type} Component</div>`;
    }
  };

  const moveComponent = (fromIndex, toIndex) => {
    console.log('🔄 MOVING COMPONENT:', `from ${fromIndex} to ${toIndex}`);
    
    const newComponents = [...emailComponents];
    const [movedComponent] = newComponents.splice(fromIndex, 1);
    newComponents.splice(toIndex, 0, movedComponent);
    
    console.log('🔄 Reordered components:', newComponents.map((c, i) => `${i}: ${c.type}`));
    setEmailComponents(newComponents);
    
    // Regenerate preview to show new component order
    const newPreviewHTML = generatePreviewHTML(newComponents);
    setRootEmailHTML(newPreviewHTML);
    
    console.log('✅ Component moved and preview regenerated');
  };

  const addComponent = (componentType) => {
    addComponentAtIndex(componentType);
  };

  const getDefaultContent = (componentType) => {
    let defaultContent = {};
    
    switch (componentType) {
      case 'hero':
        defaultContent = { 
          title: 'Welcome to Our Newsletter', 
          subtitle: 'Stay updated with the latest news and offers', 
          ctaText: 'Get Started',
          ctaUrl: 'https://example.com',
          backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          textColor: 'transparent',
          alignment: 'center'
        };
        break;
      case 'text_rich':
        defaultContent = { 
          text: '<p>Add your <strong>rich text</strong> content here. You can include <em>formatting</em>, <a href="#">links</a>, and more.</p>', 
          fontSize: '16px', 
          textColor: '#374151', 
          alignment: 'left',
          padding: '20px'
        };
        break;
      case 'freeform_editor':
        defaultContent = { 
          html: '<p>Start typing your email content here. You can insert components anywhere by dragging them from the sidebar.</p>', 
          fontSize: '16px', 
          textColor: '#374151',
          lineHeight: '1.6',
          padding: '20px'
        };
        break;
      case 'product_showcase':
        defaultContent = {
          imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop',
          title: 'Featured Product',
          description: 'Discover our latest offering with amazing features and benefits.',
          price: '$99.99',
          ctaText: 'Shop Now',
          ctaUrl: 'https://example.com/product',
          backgroundColor: 'transparent',
          borderColor: '#e5e7eb',
          titleColor: '#1f2937',
          textColor: '#6b7280',
          priceColor: '#059669',
          ctaBackgroundColor: '#00f0a0',
          ctaTextColor: 'transparent'
        };
        break;
      case 'cta_primary':
        defaultContent = { 
          text: 'Start Your Free Trial', 
          url: 'https://example.com/signup', 
          backgroundColor: '#00f0a0', 
          textColor: 'transparent',
          borderRadius: '8px',
          fontSize: '18px',
          padding: '16px 32px',
          alignment: 'center'
        };
        break;
      case 'button_group':
        defaultContent = {
          buttons: [
            { text: 'Learn More', url: '#', backgroundColor: '#6b7280', textColor: 'transparent' },
            { text: 'Contact Sales', url: '#', backgroundColor: '#00f0a0', textColor: 'transparent' }
          ],
          alignment: 'center',
          spacing: '12px'
        };
        break;
      case 'social_proof':
        defaultContent = {
          type: 'testimonial',
          content: 'This product has transformed our business operations completely.',
          author: 'John Smith',
          company: 'Tech Corp',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
          rating: 5,
          backgroundColor: 'transparent'
        };
        break;
      case 'spacer':
        defaultContent = { height: '40px', backgroundColor: 'transparent' };
        break;
      case 'divider_fancy':
        defaultContent = { 
          style: 'gradient', 
          color: 'linear-gradient(90deg, transparent, #00f0a0, transparent)', 
          thickness: '2px',
          width: '60%',
          alignment: 'center'
        };
        break;
      case 'footer_professional':
        defaultContent = { 
          companyName: 'Your Company Inc.',
          address: '123 Business Avenue, Suite 100, City, State 12345',
          phone: '+1 (555) 123-4567',
          email: 'contact@yourcompany.com',
          unsubscribeText: 'Unsubscribe from our emails',
          socialLinks: [
            { platform: 'LinkedIn', url: 'https://linkedin.com/company/yourcompany' },
            { platform: 'Twitter', url: 'https://twitter.com/yourcompany' },
            { platform: 'Facebook', url: 'https://facebook.com/yourcompany' }
          ],
          backgroundColor: 'transparent',
          textColor: '#6b7280'
        };
        break;
      default:
        defaultContent = { text: 'Sample content' };
    }
    
    return defaultContent;
  };

  const updateComponent = (componentId, updates) => {
    console.log('🔄 UPDATING COMPONENT:', componentId, updates);
    console.log('🔄 Current emailComponents length:', emailComponents.length);
    
    const updatedComponents = emailComponents.map(comp => {
      if (comp.id === componentId) {
        const updatedComp = { ...comp, content: { ...comp.content, ...updates } };
        console.log('🔄 Original component:', comp);
        console.log('🔄 Updated component:', updatedComp);
        return updatedComp;
      }
      return comp;
    });
    
    console.log('🔄 Updated components array length:', updatedComponents.length);
    console.log('🔄 First updated component:', updatedComponents.find(c => c.id === componentId));
    
    setEmailComponents(updatedComponents);
    
    // Regenerate preview HTML to reflect property changes
    const newPreviewHTML = generatePreviewHTML(updatedComponents);
    console.log('🔄 Generated new preview HTML length:', newPreviewHTML ? newPreviewHTML.length : 0);
    setRootEmailHTML(newPreviewHTML);
    
    // Don't force emailComponents re-render for regular components when inline components exist
    // This prevents destroying inline components in contenteditable areas
    
    console.log('✅ Component updated and preview regenerated');
    toast.success('Component updated!');
  };

  const removeComponent = (componentId) => {
    console.log('🔄 REMOVING COMPONENT:', componentId);
    
    const filteredComponents = emailComponents.filter(comp => comp.id !== componentId);
    setEmailComponents(filteredComponents);
    
    // Regenerate preview after removing component
    const newPreviewHTML = generatePreviewHTML(filteredComponents);
    setRootEmailHTML(newPreviewHTML);
    
    console.log('✅ Component removed and preview regenerated');
    toast.success('Component removed');
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const emailStructure = {
        subject,
        preheader: preheader,
        components: emailComponents,
        html: generatePreviewHTML(emailComponents) || rootEmailHTML
      };
      onSave?.(emailStructure);
      toast.success('Email saved successfully!');
    } catch (error) {
      toast.error('Save failed');
    }
    setLoading(false);
  };
  
  const handleSendCurrentEmail = async () => {
    if (loading) return;
    
    // Show template confirmation popup first
    setShowTemplateConfirmation(true);
  };

  const handleTemplateConfirmation = async (useTemplate) => {
    setShowTemplateConfirmation(false);
    
    if (!useTemplate) {
      // User chose not to use template, just send single email
      await sendSingleEmail();
      return;
    }
    
    // User chose to use template for all emails
    await sendWithTemplate();
  };

  const sendSingleEmail = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      
      // Get SMTP configuration from localStorage
      const smtpConfigString = localStorage.getItem('smtpConfig');
      console.log('📧 SMTP Config from localStorage (individual):', smtpConfigString);
      
      const smtpConfig = JSON.parse(smtpConfigString || '{}');
      console.log('📧 Parsed SMTP Config (individual):', smtpConfig);

      // Check for both old format (username/password) and new format (auth.user/auth.pass)
      const hasAuth = (smtpConfig.auth?.user && smtpConfig.auth?.pass) || (smtpConfig.username && smtpConfig.password);

      if (!smtpConfig.host || !smtpConfig.port || !hasAuth) {
        console.log('❌ Missing SMTP config fields for individual email');
        toast.error('Please configure SMTP settings first. Go to Settings page to set up SMTP.');

        // Show what's missing
        const missing = [];
        if (!smtpConfig.host) missing.push('host');
        if (!smtpConfig.port) missing.push('port');
        if (!hasAuth) missing.push('credentials (username/password or auth.user/auth.pass)');
        console.log('❌ Missing fields:', missing.join(', '));

        setLoading(false);
        return;
      }
      
      // Get current email recipient
      const currentEmail = availableEmails?.[currentEmailIndex] || pendingEmails?.[currentEmailIndex];
      const recipientEmail = currentEmail?.to || currentEmail?.email || currentEmail?.recipient_email || 'recipient@example.com';
      
      // Capture any unsaved edits from the DOM before sending
      const updatedComponents = captureCurrentEdits();
      
      // CRITICAL: Also update emailComponents state with captured content to ensure it's included
      if (updatedComponents.length > 0) {
        console.log('🔄 Updating emailComponents state with captured content');
        setEmailComponents(updatedComponents);
      }
      
      // Generate the final HTML from current components (including unsaved edits)
      const finalHTML = generatePreviewHTML(updatedComponents.length > 0 ? updatedComponents : emailComponents);
      
      // Debug what we're actually sending
      console.log('🐛 SEND DEBUG: Components to send:', updatedComponents.length > 0 ? updatedComponents : emailComponents);
      console.log('🐛 SEND DEBUG: Generated HTML length:', finalHTML?.length || 0);
      console.log('🐛 SEND DEBUG: First 200 chars of HTML:', finalHTML?.substring(0, 200));
      
      // Create email data with the edited content
      // CRITICAL FIX: Use rootEmailHTML if it contains more content (includes inline components)
      const useRootHTML = rootEmailHTML && rootEmailHTML.length > (finalHTML?.length || 0);
      let emailHTML = useRootHTML ? rootEmailHTML : (finalHTML || rootEmailHTML);
      
      // If using rootEmailHTML, clean it for email compatibility
      if (useRootHTML && rootEmailHTML) {
        console.log('🧹 Cleaning rootEmailHTML for email compatibility');
        
        // Convert inline components to email-friendly HTML
        emailHTML = rootEmailHTML.replace(
          /<div[^>]*data-component-type="cta_primary"[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>.*?<\/div>/g,
          '<div style="text-align: center; margin: 20px 0;"><a href="$1" style="display: inline-block; background: #00f0a0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">$2</a></div>'
        );
        
        // Remove all interactive attributes that don't work in email
        emailHTML = emailHTML.replace(/\s*(data-component-[^=]*="[^"]*"|\bclass="[^"]*inline-component[^"]*"|\bdraggable="[^"]*"|\bonmouse[^=]*="[^"]*"|\bstyle="[^"]*cursor:[^;"]*;?[^"]*border:[^;"]*;?[^"]*")/g, '');
        
        // Wrap in proper email structure if not already wrapped
        if (!emailHTML.includes('email-wrapper')) {
          emailHTML = `
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
              .email-wrapper { width: 600px; margin: 0 auto; background: white; padding: 20px; }
            </style>
            <div class="email-wrapper">
              ${emailHTML}
            </div>
          `;
        }
        
        console.log('🧹 Cleaned HTML length:', emailHTML?.length || 0);
        console.log('🧹 Cleaned HTML first 200 chars:', emailHTML?.substring(0, 200));
      }
      
      console.log('🐛 SEND DEBUG: Using', useRootHTML ? 'rootEmailHTML (cleaned)' : 'finalHTML', 'as email source');
      console.log('🐛 SEND DEBUG: rootEmailHTML length:', rootEmailHTML?.length || 0);
      console.log('🐛 SEND DEBUG: finalHTML length:', finalHTML?.length || 0);
      console.log('🐛 SEND DEBUG: Selected HTML length:', emailHTML?.length || 0);

      // Extract credentials from either format (auth.user/auth.pass or username/password)
      const smtpUser = smtpConfig.auth?.user || smtpConfig.username;
      const smtpPass = smtpConfig.auth?.pass || smtpConfig.password;

      const emailData = {
        subject: subject || 'Your Email Subject',
        html: emailHTML,
        from: smtpConfig.from || smtpUser,
        to: [recipientEmail],
        smtp: {
          host: smtpConfig.host,
          port: parseInt(smtpConfig.port),
          secure: smtpConfig.secure || (parseInt(smtpConfig.port) === 465),
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        }
      };
      
      console.log('📧 Sending individual email with data:', emailData);
      console.log('📊 Campaign ID from emailData prop:', props.emailData?.campaignId);
      console.log('🔍 DEBUG: Full props.emailData object:', props.emailData);
      console.log('🔍 DEBUG: emailData object keys:', Object.keys(props.emailData || {}));

      // Prepare request data in the format the backend expects
      const requestData = {
        emailData: {
          from: emailData.from,
          to: recipientEmail,  // Backend expects single email string
          subject: emailData.subject,
          html: emailData.html
        },
        campaignId: props.emailData?.campaignId,  // Include campaignId from props
        smtpConfig: {
          host: emailData.smtp?.host || smtpConfig.host,
          port: emailData.smtp?.port || smtpConfig.port,
          secure: emailData.smtp?.secure || smtpConfig.secure,
          username: emailData.smtp?.auth?.user || smtpUser,
          password: emailData.smtp?.auth?.pass || smtpPass,
          fromName: smtpConfig.fromName || smtpConfig.senderName || emailData.from?.split('<')[0]?.trim()
        },
        action: 'send_single',  // Indicate this is a single email send
        // 🔥 CRITICAL FIX: Include user template data for workflow resumption
        userTemplate: {
          subject: emailData.subject,
          html: emailData.html,
          body: emailData.html,
          components: emailComponents || [],  // Include the current components structure
          templateType: emailComponents?.length > 0 ? 'component_based' : 'html_based',
          senderName: smtpConfig.fromName || smtpConfig.senderName,
          senderEmail: smtpUser,
          smtpConfig: smtpConfig
        }
      };

      console.log('📧 Sending request with campaignId:', requestData.campaignId);

      // Send the email using the backend API
      const response = await fetch('/api/workflow/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(`Email sent to ${recipientEmail}!`);
          
          // Email sent successfully - parent component should handle status updates
          console.log('✅ Email sent successfully:', result);
          
        } else {
          toast.error(result.message || 'Failed to send email');
        }
      } else {
        const errorData = await response.text();
        console.error('❌ Server response:', errorData);
        toast.error('Failed to send email. Check console for details.');
      }
    } catch (error) {
      console.error('❌ Send email error:', error);
      toast.error('Error sending email: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendWithTemplate = async () => {
    if (loading) return;

    // Get SMTP configuration from localStorage (same as sendSingleEmail)
    const smtpConfigString = localStorage.getItem('smtpConfig');
    console.log('📧 SMTP Config from localStorage (template):', smtpConfigString);

    const smtpConfig = JSON.parse(smtpConfigString || '{}');
    let templateData = null;

    try {
      setLoading(true);
      console.log('📧 Parsed SMTP Config (template):', smtpConfig);

      // Check for both old format (username/password) and new format (auth.user/auth.pass)
      const hasAuth = (smtpConfig.auth?.user && smtpConfig.auth?.pass) || (smtpConfig.username && smtpConfig.password);

      if (!smtpConfig.host || !smtpConfig.port || !hasAuth) {
        console.log('❌ Missing SMTP config fields for template emails');
        toast.error('Please configure SMTP settings first. Go to Settings page to set up SMTP.');

        // Show what's missing
        const missing = [];
        if (!smtpConfig.host) missing.push('host');
        if (!smtpConfig.port) missing.push('port');
        if (!hasAuth) missing.push('credentials (username/password or auth.user/auth.pass)');
        console.log('❌ Missing fields:', missing.join(', '));

        setLoading(false);
        return;
      }

      // Extract credentials from either format (auth.user/auth.pass or username/password)
      const smtpUser = smtpConfig.auth?.user || smtpConfig.username;
      const smtpPass = smtpConfig.auth?.pass || smtpConfig.password;

      // CRITICAL FIX: Use the selected template from the modal instead of current editor state
      console.log('🎨 EMAIL GENERATION DEBUG: Using selected template:', selectedTemplate?.name || 'None selected');
      console.log('🎨 EMAIL GENERATION DEBUG: selectedTemplate exists?', !!selectedTemplate);
      console.log('🎨 EMAIL GENERATION DEBUG: selectedTemplate.html exists?', !!selectedTemplate?.html);
      console.log('🎨 EMAIL GENERATION DEBUG: selectedTemplate.html length:', selectedTemplate?.html?.length || 0);

      // Get recipients list
      const recipientsList = availableEmails?.length > 0 ? availableEmails :
                           pendingEmails?.length > 0 ? pendingEmails : [];

      console.log('🎨 EMAIL GENERATION DEBUG: Recipients list length:', recipientsList.length);

      // Use the selected template HTML and structure, or fallback to current editor state
      if (selectedTemplate && selectedTemplate.html) {
        console.log('✅ EMAIL GENERATION DEBUG: Using selectedTemplate HTML for email generation');
        console.log('✅ EMAIL GENERATION DEBUG: Template details:');
        console.log('   - Name:', selectedTemplate.name);
        console.log('   - ID:', selectedTemplate.id);
        console.log('   - Subject:', selectedTemplate.subject);
        console.log('   - HTML preview:', selectedTemplate.html.substring(0, 200) + '...');

        templateData = {
          subject: selectedTemplate.subject || subject,
          preheader: preheader,
          components: selectedTemplate.structure?.components || [],
          html: selectedTemplate.html,
          templateId: selectedTemplate.id,
          templateName: selectedTemplate.name,
          recipients: recipientsList
        };

        console.log('✅ EMAIL GENERATION DEBUG: templateData created with selectedTemplate');
        console.log('✅ EMAIL GENERATION DEBUG: templateData subject:', templateData.subject);
        console.log('✅ EMAIL GENERATION DEBUG: templateData templateName:', templateData.templateName);
      } else {
        console.log('⚠️ No selectedTemplate found, falling back to current editor state');
        // Capture current template components and settings as fallback
        const templateComponents = captureCurrentEdits();

        // Include inline components that were added via drag and drop
        const allInlineComponents = Array.from(inlineComponents.values());
        console.log('🧩 Found', allInlineComponents.length, 'inline components to include in template');

        // Combine all components for template
        const allTemplateComponents = [...templateComponents, ...allInlineComponents];
        console.log('🎨 Total template components:', allTemplateComponents.length, '(captured:', templateComponents.length, '+ inline:', allInlineComponents.length, ')');

        templateData = {
          subject: subject,
          preheader: preheader,
          components: allTemplateComponents.length > 0 ? allTemplateComponents : emailComponents,
          html: generatePreviewHTML(allTemplateComponents.length > 0 ? allTemplateComponents : emailComponents),
          recipients: recipientsList
        };
      }
      
      console.log(`📧 Sending template data for ${recipientsList.length} recipients with SMTP config:`, templateData);
      console.log(`📧 Recipients list:`, recipientsList.map(r => r.to || r.email || r.recipient_email));
      
      // Send user decision, template, and SMTP config to backend
      console.log('📤 Sending template data to backend:', {
        decision: 'continue',
        campaignId: campaignId,
        userTemplate: templateData,
        hasSmtpConfig: !!smtpConfig?.host,
        sendEmails: true
      });
      
      const response = await fetch('/api/workflow/user-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'continue',
          campaignId: campaignId,
          userTemplate: templateData,
          approvedTemplate: templateData, // Also send as approvedTemplate for backend compatibility
          emailTemplate: templateData.html, // Send HTML directly as emailTemplate
          templateComponents: templateData.components, // Send components separately
          smtpConfig: smtpConfig, // Include SMTP config for backend email sending
          sendEmails: true, // Flag to indicate backend should actually send emails
          useTemplate: true // Explicit flag that user wants to use template
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success('✅ Template applied! Sending emails to all remaining prospects...');
          console.log('✅ Template sent to backend with SMTP config:', result);
          
          // Always send emails directly to ensure template is used correctly
          console.log('📧 Automatically sending emails directly to ensure template compliance');
          toast('📧 Sending personalized emails with your template...', {
            icon: 'ℹ️',
            duration: 3000
          });

          // 🔄 Save template data for pause/resume functionality
          localStorage.setItem('current_template_data', JSON.stringify(templateData));

          await sendTemplateEmailsDirectly(templateData, smtpConfig);
          
          // Optionally close the email editor
          if (onSend) {
            onSend(templateData);
          }
        } else {
          toast.error(result.message || 'Failed to apply template to backend');

          // If backend fails, automatically try direct sending
          console.log('📧 Backend failed, automatically trying direct sending');
          toast('📧 Backend failed, sending emails directly...', {
            icon: 'ℹ️',
            duration: 3000
          });

          // 🔄 Save template data for pause/resume functionality
          localStorage.setItem('current_template_data', JSON.stringify(templateData));

          await sendTemplateEmailsDirectly(templateData, smtpConfig);
        }
      } else {
        toast.error('Failed to communicate with backend');

        // Automatically try direct sending if backend communication fails
        console.log('📧 Backend communication failed, automatically trying direct sending');
        toast('📧 Backend communication failed, sending emails directly...', {
          icon: 'ℹ️',
          duration: 3000
        });

        // 🔄 Save template data for pause/resume functionality
        localStorage.setItem('current_template_data', JSON.stringify(templateData));

        await sendTemplateEmailsDirectly(templateData, smtpConfig);
      }
    } catch (error) {
      console.error('❌ Template application error:', error);
      toast.error('Error applying template: ' + error.message);

      // Automatically try direct sending if there's an error and templateData exists
      if (templateData && smtpConfig) {
        console.log('📧 Error occurred, automatically trying direct sending as fallback');
        toast('📧 Error occurred, sending emails directly as fallback...', {
          icon: 'ℹ️',
          duration: 3000
        });
        await sendTemplateEmailsDirectly(templateData, smtpConfig);
      } else {
        console.log('❌ Cannot fallback to direct sending - missing templateData or smtpConfig');
        toast.error('Failed to send emails - missing configuration data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate personalized email content using AI and apply it to template structure
  const generatePersonalizedEmailContent = async (recipient, templateData) => {
    try {
      console.log('🤖 PERSONALIZATION DEBUG: Generating personalized content for:', recipient.to || recipient.email);
      console.log('📧 PERSONALIZATION DEBUG: Using template HTML:', templateData.html ? `${templateData.html.length} chars` : 'N/A');
      console.log('📧 PERSONALIZATION DEBUG: Template ID:', templateData.templateId || 'None');
      console.log('📧 PERSONALIZATION DEBUG: Template Name:', templateData.templateName || 'None');
      console.log('📧 PERSONALIZATION DEBUG: Template Subject:', templateData.subject || 'None');

      // CRITICAL FIX: Always use the complete edited HTML directly for all emails
      // This preserves the exact user-edited structure with components integrated at correct positions
      if (templateData.html) {
        console.log('✅ PERSONALIZATION DEBUG: Using complete template HTML for personalization');
        console.log('✅ PERSONALIZATION DEBUG: Template HTML preview:', templateData.html.substring(0, 300) + '...');
        return fallbackPersonalization(recipient, templateData);
      }

      // Only use component generation as absolute fallback if no complete HTML exists
      console.log('⚠️ No complete HTML found, attempting AI generation from components');

      // Call the new API endpoint to generate personalized content
      const response = await fetch('/api/email/generate-personalized-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: recipient,
          templateComponents: templateData.components,
          templateSubject: templateData.subject,
          templatePreheader: templateData.preheader
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('✅ AI generated personalized content:', result.data);

          // Apply the generated content to the template components structure
          const personalizedComponents = applyContentToTemplateComponents(
            templateData.components,
            result.data.content,
            recipient
          );

          // Generate new HTML from the personalized components
          const personalizedHTML = generatePreviewHTML(personalizedComponents);

          return {
            subject: result.data.subject,
            preheader: result.data.preheader,
            components: personalizedComponents,
            html: personalizedHTML
          };
        }
      }

      // Fallback to simple replacement if AI generation fails
      console.log('⚠️ AI generation failed, falling back to simple text replacement');
      return fallbackPersonalization(recipient, templateData);

    } catch (error) {
      console.error('❌ Error generating personalized content:', error);
      return fallbackPersonalization(recipient, templateData);
    }
  };

  // Apply generated content to template components while preserving structure
  const applyContentToTemplateComponents = (templateComponents, generatedContent, recipient) => {
    const personalizedComponents = JSON.parse(JSON.stringify(templateComponents)); // Deep clone

    // Split generated content into paragraphs for distribution
    const contentParagraphs = generatedContent.split('\n\n').filter(p => p.trim());
    let paragraphIndex = 0;

    // Apply content to components while preserving their positioning
    personalizedComponents.forEach(component => {
      if (component.type === 'freeform_editor' && component.content?.html) {
        // For freeform editor, replace with new content but keep structure
        if (paragraphIndex < contentParagraphs.length) {
          const newContent = contentParagraphs.slice(paragraphIndex, paragraphIndex + 2).join('\n\n');
          component.content.html = `<p>${newContent.replace(/\n\n/g, '</p><p>')}</p>`;
          paragraphIndex += 2;
        }
      } else if (component.type === 'text' && component.content?.text) {
        // For text components, use a paragraph
        if (paragraphIndex < contentParagraphs.length) {
          component.content.text = contentParagraphs[paragraphIndex];
          paragraphIndex++;
        }
      } else if (component.type === 'hero' && component.content) {
        // For hero components, personalize title/subtitle
        if (component.content.title) {
          component.content.title = component.content.title
            .replace(/\{name\}/gi, recipient.name || recipient.recipientName || 'there')
            .replace(/\{company\}/gi, recipient.company || recipient.companyName || 'your company');
        }
        if (component.content.subtitle && paragraphIndex < contentParagraphs.length) {
          component.content.subtitle = contentParagraphs[paragraphIndex];
          paragraphIndex++;
        }
      }
    });

    return personalizedComponents;
  };

  // Fallback personalization using simple text replacement
  const fallbackPersonalization = (recipient, templateData) => {
    console.log('🔄 FALLBACK PERSONALIZATION DEBUG: Starting personalization');
    console.log('🔄 FALLBACK PERSONALIZATION DEBUG: Recipient:', recipient.to || recipient.email);
    console.log('🔄 FALLBACK PERSONALIZATION DEBUG: Template Name:', templateData.templateName || 'None');

    // CRITICAL FIX: Use the complete edited HTML with integrated components at correct positions
    // This preserves the exact structure the user created in the editor
    let personalizedHTML = templateData.html || '';

    console.log('🔄 FALLBACK PERSONALIZATION DEBUG: Starting HTML length:', personalizedHTML.length);
    console.log('🔄 FALLBACK PERSONALIZATION DEBUG: Starting HTML preview:', personalizedHTML.substring(0, 200) + '...');

    // Extract recipient details with fallbacks
    const recipientName = recipient?.name || recipient?.recipientName ||
                         (recipient.to || recipient.email || '').split('@')[0] || 'there';
    const recipientCompany = recipient?.company || recipient?.companyName || 'your company';

    console.log('🔄 FALLBACK PERSONALIZATION DEBUG: Recipient name:', recipientName);
    console.log('🔄 FALLBACK PERSONALIZATION DEBUG: Recipient company:', recipientCompany);
    const recipientEmail = recipient.to || recipient.email || '';

    // Replace all common placeholder patterns
    personalizedHTML = personalizedHTML
      .replace(/\{name\}/gi, recipientName)
      .replace(/\[CONTACT_NAME\]/gi, recipientName)
      .replace(/\{company\}/gi, recipientCompany)
      .replace(/\[COMPANY_NAME\]/gi, recipientCompany)
      .replace(/\[PROSPECT_COMPANY\]/gi, recipientCompany)
      .replace(/\{email\}/gi, recipientEmail)
      .replace(/\[EMAIL\]/gi, recipientEmail);

    console.log(`✅ Personalized complete HTML for ${recipientEmail}: ${personalizedHTML.length} chars with components at correct positions`);

    console.log('🔄 FALLBACK PERSONALIZATION DEBUG: Final HTML length:', personalizedHTML.length);
    console.log('🔄 FALLBACK PERSONALIZATION DEBUG: Final HTML preview:', personalizedHTML.substring(0, 300) + '...');

    const finalEmail = {
      subject: (templateData.subject || 'Hello from our team')
        .replace(/\[COMPANY_NAME\]/gi, recipientCompany)
        .replace(/\{company\}/gi, recipientCompany),
      preheader: templateData.preheader,
      components: templateData.components,
      html: personalizedHTML
    };

    console.log('🔄 FALLBACK PERSONALIZATION DEBUG: Final email subject:', finalEmail.subject);
    console.log('🔄 FALLBACK PERSONALIZATION DEBUG: Template components count:', finalEmail.components?.length || 0);

    return finalEmail;
  };

  // Direct email sending fallback function
  const sendTemplateEmailsDirectly = async (templateData, smtpConfig) => {
    console.log('📧 Starting direct template email sending...');

    // Extract SMTP credentials
    const smtpUser = smtpConfig.auth?.user || smtpConfig.username;
    const smtpPass = smtpConfig.auth?.pass || smtpConfig.password;

    // Get campaign ID from emailData or availableEmails
    const campaignId = emailData?.campaignId ||
                      availableEmails?.[0]?.campaignId ||
                      pendingEmails?.[0]?.campaignId;

    console.log('🔍 DEBUG: Campaign ID for direct sending:', campaignId);

    // Get all remaining recipients - check all available sources
    const remainingEmails = availableEmails?.length > 0 ? availableEmails :
                           pendingEmails?.length > 0 ? pendingEmails :
                           templateData?.recipients || [];
    const currentRecipient = remainingEmails[currentEmailIndex]?.to || remainingEmails[currentEmailIndex]?.email;

    console.log(`📧 Found ${remainingEmails.length} total recipients from availableEmails(${availableEmails?.length}), pendingEmails(${pendingEmails?.length}), current: ${currentRecipient}`);

    // 🔄 Set generation state
    setIsGenerating(true);
    setTotalToProcess(remainingEmails.length);
    pauseRef.current = false; // Reset pause state

    let successCount = 0;
    let failureCount = 0;

    // Start from last processed index if resuming
    const startIndex = isPaused ? lastProcessedIndex : 0;
    console.log(`🔄 ${isPaused ? 'Resuming' : 'Starting'} from index ${startIndex}`);

    for (let i = startIndex; i < remainingEmails.length; i++) {
      // 🔄 Check if paused
      if (pauseRef.current) {
        console.log(`⏸️ Email generation paused at index ${i}`);
        setLastProcessedIndex(i);
        setIsPaused(true);
        setIsGenerating(false);
        toast('⏸️ Email generation paused', { icon: 'ℹ️' });
        return; // Exit the function
      }

      setLastProcessedIndex(i);
      const recipient = remainingEmails[i];
      const recipientEmail = recipient?.to || recipient?.email || recipient?.recipient_email;
      
      if (!recipientEmail) {
        console.log(`⏭️ Skipping recipient ${i} - no email address`);
        continue;
      }
      
      try {
        console.log(`📧 Sending to ${recipientEmail} (${i + 1}/${remainingEmails.length})...`);
        
        // Generate personalized content using AI instead of simple text replacement
        console.log(`🤖 Generating AI-powered personalized content for ${recipientEmail}...`);
        const personalizedData = await generatePersonalizedEmailContent(recipient, templateData);
        const personalizedHTML = personalizedData.html;
        
        // Send individual email
        const emailResponse = await fetch('/api/workflow/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            smtpConfig: smtpConfig,
            campaignId: campaignId, // Include campaignId for workflow continuation
            action: 'send_single',
            // 🔥 CRITICAL FIX: Include userTemplate for workflow resumption
            userTemplate: templateData,
            emailData: {
              from: `${smtpConfig.fromName || smtpConfig.senderName || 'Your Name'} <${smtpUser}>`,
              to: recipientEmail,
              subject: personalizedData.subject || 'Hello from our team',
              html: personalizedHTML
            }
          })
        });
        
        if (emailResponse.ok) {
          const emailResult = await emailResponse.json();
          if (emailResult.success) {
            successCount++;
            console.log(`✅ Email sent to ${recipientEmail}`);

            // Track email in analytics
            try {
              await fetch('/api/analytics/track/sent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  campaignId: campaignId || 'direct_send',
                  recipient: {
                    email: recipientEmail,
                    name: recipient.name || recipient.recipientName || recipientEmail.split('@')[0],
                    company: recipient.company || recipient.companyName || 'Unknown',
                    industry: recipient.industry || 'Technology',
                    location: recipient.location || 'North America'
                  },
                  subject: personalizedData.subject || 'Hello from our team',
                  content: personalizedHTML
                })
              });

              // Also track as delivered (assuming immediate delivery for direct sends)
              await fetch('/api/analytics/track/delivered', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  campaignId: campaignId || 'direct_send',
                  recipientEmail: recipientEmail,
                  messageId: emailResult.messageId || `direct_${Date.now()}`
                })
              });

              console.log('📈 Email tracked in analytics');
            } catch (analyticsError) {
              console.error('⚠️ Analytics tracking failed:', analyticsError);
            }

            // Add small delay between emails to avoid overwhelming SMTP server
            if (i < remainingEmails.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
            }
          } else {
            failureCount++;
            console.error(`❌ Failed to send to ${recipientEmail}:`, emailResult.error);
          }
        } else {
          failureCount++;
          console.error(`❌ HTTP error sending to ${recipientEmail}:`, emailResponse.status);
        }
      } catch (error) {
        failureCount++;
        console.error(`❌ Exception sending to ${recipientEmail}:`, error);
      }
    }
    
    // Show final results
    if (successCount > 0) {
      toast.success(`✅ Successfully sent ${successCount} emails! ${failureCount > 0 ? `(${failureCount} failed)` : ''}`);
    } else {
      toast.error(`❌ Failed to send emails. ${failureCount} failures.`);
    }

    console.log(`📧 Direct sending completed: ${successCount} success, ${failureCount} failures`);

    // 🔄 Reset generation state when complete
    setIsGenerating(false);
    setIsPaused(false);
    setLastProcessedIndex(0);
  };

  const handleSend = async () => {
    if (!subject.trim()) {
      toast.error('Please add a subject line');
      return;
    }

    setLoading(true);
    try {
      await handleSave(); // Save first

      const finalEmail = {
        subject,
        preheader: preheader,
        components: emailComponents,
        html: rootEmailHTML || generatePreviewHTML(emailComponents),
        changes
      };

      // Try to approve and continue workflow
      const response = await fetch('/api/workflow/approve-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailData: finalEmail,
          campaignId,
          prospectId,
          action: 'approve_and_send'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success('✅ Email approved! Campaign continuing...');
          onSend?.(finalEmail);
        } else {
          throw new Error(result.error || 'Failed to approve email');
        }
      } else {
        // Fallback to original onSend
        onSend?.(finalEmail);
        toast.success('Email campaign started!');
      }
    } catch (error) {
      toast.error(`Failed to start campaign: ${error.message}`);
    }
    setLoading(false);
  };

  const handleSendAll = async () => {
    if (!subject.trim()) {
      toast.error('Please add a subject line');
      return;
    }

    setLoading(true);
    try {
      await handleSave();

      const finalEmail = {
        subject,
        preheader: preheader,
        components: emailComponents,
        html: rootEmailHTML || generatePreviewHTML(emailComponents),
        changes
      };

      // Send to all pending emails
      const response = await fetch('/api/workflow/approve-all-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailData: finalEmail,
          campaignId,
          action: 'approve_and_send_all'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success('✅ All emails approved! Campaign continuing...');
          onSend?.(finalEmail);
        } else {
          throw new Error(result.error || 'Failed to approve all emails');
        }
      } else {
        onSend?.(finalEmail);
        toast.success('All emails sent!');
      }
    } catch (error) {
      toast.error(`Failed to send all emails: ${error.message}`);
    }
    setLoading(false);
  };

  const handleSendSingle = async (email) => {
    if (!subject.trim()) {
      toast.error('Please add a subject line');
      return;
    }

    setLoading(true);
    try {
      const finalEmail = {
        ...email,
        subject,
        preheader: preheader,
        components: emailComponents,
        html: rootEmailHTML || generatePreviewHTML(emailComponents),
        changes
      };

      console.log('📤 Sending email data:', {
        emailData: finalEmail,
        campaignId,
        prospectId: email.id || email.email,
        action: 'send_single'
      });

      // Try to send specific email
      const response = await fetch('/api/workflow/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailData: finalEmail,
          campaignId,
          prospectId: email.id || email.email,
          action: 'send_single'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(`✅ Email sent to ${email.recipient_name || email.name}!`);
          // Update the email status in the list
          const updatedEmails = availableEmails.map(e => 
            (e.id === email.id || e.email === email.email) 
              ? { ...e, sent: true, status: 'sent', sent_at: new Date().toISOString() }
              : e
          );
          // This would normally be handled by the parent component
        } else {
          throw new Error(result.error || 'Failed to send email');
        }
      } else {
        // Get more detailed error information
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error('❌ Server error details:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          console.error('❌ Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      toast.error(`Failed to send email: ${error.message}`);
    }
    setLoading(false);
  };

  const switchToEmailOld = (emailIndex) => {
    console.log('🔄 Switching to email index:', emailIndex);
    setCurrentEmailIndex(emailIndex);
    
    // Use pendingEmails if availableEmails is empty
    const emailsToUse = (availableEmails && availableEmails.length > 0) ? availableEmails : pendingEmails;
    const email = emailsToUse[emailIndex];
    
    if (email) {
      console.log('📧 Loading email:', email);
      console.log('📧 Email keys:', Object.keys(email));
      
      setSubject(email.subject || 'No Subject');
      setPreheader(email.preheader || '');
      
      // Try different content fields
      const content = email.body || email.html || email.content || email.message || email.text;
      if (content) {
        console.log('📧 Found email content:', typeof content, content.substring(0, 200));
        parseEmailToComponents(email);
      } else {
        console.log('❌ No content found in email object');
        // Create a default component if no content is found
        setEmailComponents([{
          id: 'default_' + Date.now(),
          type: 'text_rich',
          content: {
            text: '<p>No email content available. Click here to edit and add your email content.</p>',
            fontSize: '16px',
            textColor: '#374151',
            alignment: 'left',
            padding: '20px'
          }
        }]);
      }
    } else {
      console.log('❌ No email found at index:', emailIndex);
    }
  };

  // Helper function for dynamic drop position calculation
  const getDynamicDropPosition = () => {
    if (dragOverIndex === null) return 0;
    
    // Calculate position based on component index
    const basePosition = dragOverIndex * 120; // Estimated height per component
    return Math.max(0, basePosition);
  };

  const renderPropertiesPanel = () => {
    console.log('🔧 Rendering properties panel, selectedComponent:', selectedComponent);
    
    if (!selectedComponent) return null;
    
    // Check if it's a regular component or inline component
    let component = emailComponents.find(c => c.id === selectedComponent);
    
    // COMPLETELY BLOCK any freeform editor properties - multiple checks
    if (component && component.type === 'freeform_editor') {
      console.log('🚫 FORCE BLOCKING properties panel for freeform editor');
      // Force clear the selection
      setTimeout(() => setSelectedComponent(null), 0);
      return null;
    }
    
    // Additional safety check - if selectedComponent contains 'email_body' (freeform editor id pattern)
    if (selectedComponent && selectedComponent.includes('email_body')) {
      console.log('🚫 FORCE BLOCKING based on component ID pattern');
      setTimeout(() => setSelectedComponent(null), 0);
      return null;
    }
    let isInlineComponent = false;
    
    console.log('📧 Found in emailComponents:', component ? 'YES' : 'NO');
    console.log('📧 EmailComponents IDs:', emailComponents.map(c => c.id));
    
    if (!component) {
      component = inlineComponents.get(selectedComponent);
      isInlineComponent = true;
      console.log('📦 Found in inlineComponents:', component ? 'YES' : 'NO');
      console.log('📋 InlineComponents Map size:', inlineComponents.size);
      console.log('📋 InlineComponents keys:', Array.from(inlineComponents.keys()));
    }
    
    console.log('🎯 Final component to show properties for:', component);
    console.log('🔄 Is inline component:', isInlineComponent);
    
    if (!component) return null;

    const updateContent = (updates) => {
      console.log('🔥 updateContent called with:', updates);
      console.log('🔥 selectedComponent:', selectedComponent);
      console.log('🔥 inlineComponents.has(selectedComponent):', inlineComponents.has(selectedComponent));
      
      const isInlineComponent = inlineComponents.has(selectedComponent);
      if (isInlineComponent) {
        console.log('🔥 Calling updateInlineComponent');
        // Update inline component and regenerate HTML in freeform editor
        updateInlineComponent(selectedComponent, updates);
      } else {
        console.log('🔥 Calling updateComponent');
        // Regular component update
        updateComponent(selectedComponent, updates);
      }
    };

    return (
      <div className="fixed top-0 right-0 bottom-0 w-80 bg-white flex flex-col z-50">
        <div className="p-4 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  // Delete the component
                  if (inlineComponents.has(selectedComponent)) {
                    // Remove from inline components
                    setInlineComponents(prev => {
                      const newMap = new Map(prev);
                      newMap.delete(selectedComponent);
                      return newMap;
                    });
                    
                    // Remove from DOM
                    const element = document.querySelector(`[data-component-id="${selectedComponent}"]`);
                    if (element) {
                      element.remove();
                      toast.success('Component deleted!');
                    }
                  } else {
                    // Remove from regular components
                    setEmailComponents(prev => prev.filter(c => c.id !== selectedComponent));
                    toast.success('Component deleted!');
                  }
                  setSelectedComponent(null);
                }}
                className="text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full p-1 transition-colors"
                title="Delete Component"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSelectedComponent(null)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
                title="Back to Tools"
              >
                ✕
              </button>
            </div>
          </div>
          <p className="text-sm text-blue-600 font-medium mt-1">
            {component.type.replace('_', ' ').toUpperCase()}
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* HERO PROPERTIES */}
          {component.type === 'hero' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Content</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Main Title</label>
                    <input
                      type="text"
                      value={component.content.title}
                      onChange={(e) => updateContent({ title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Subtitle</label>
                    <textarea
                      value={component.content.subtitle}
                      onChange={(e) => updateContent({ subtitle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      rows="2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={component.content.ctaText}
                      onChange={(e) => updateContent({ ctaText: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Button URL</label>
                    <input
                      type="url"
                      value={component.content.ctaUrl}
                      onChange={(e) => updateContent({ ctaUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Design</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Background</label>
                    <select
                      value={component.content.backgroundColor.includes('gradient') ? 'gradient' : 'solid'}
                      onChange={(e) => updateContent({ 
                        backgroundColor: e.target.value === 'gradient' 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : '#00f0a0'
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="solid">Solid Color</option>
                      <option value="gradient">Gradient</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Text Color</label>
                    <input
                      type="color"
                      value={component.content.textColor}
                      onChange={(e) => updateContent({ textColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Text Alignment</label>
                    <select
                      value={component.content.alignment}
                      onChange={(e) => updateContent({ alignment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* RICH TEXT PROPERTIES */}
          {component.type === 'text_rich' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Typography</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
                    <select
                      value={component.content.fontSize}
                      onChange={(e) => updateContent({ fontSize: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="12px">Small (12px)</option>
                      <option value="14px">Normal (14px)</option>
                      <option value="16px">Medium (16px)</option>
                      <option value="18px">Large (18px)</option>
                      <option value="20px">X-Large (20px)</option>
                      <option value="24px">XX-Large (24px)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Text Color</label>
                    <input
                      type="color"
                      value={component.content.textColor}
                      onChange={(e) => updateContent({ textColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Text Alignment</label>
                    <select
                      value={component.content.alignment}
                      onChange={(e) => updateContent({ alignment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                      <option value="justify">Justify</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Spacing</label>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Padding</label>
                  <select
                    value={component.content.padding}
                    onChange={(e) => updateContent({ padding: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="10px">Small (10px)</option>
                    <option value="20px">Medium (20px)</option>
                    <option value="30px">Large (30px)</option>
                    <option value="40px">X-Large (40px)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* FREEFORM EDITOR PROPERTIES - DISABLED */}
          {false && component.type === 'freeform_editor' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Typography</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
                    <select
                      value={component.content.fontSize}
                      onChange={(e) => updateContent({ fontSize: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="12px">Small (12px)</option>
                      <option value="14px">Default (14px)</option>
                      <option value="16px">Medium (16px)</option>
                      <option value="18px">Large (18px)</option>
                      <option value="20px">X-Large (20px)</option>
                      <option value="24px">XX-Large (24px)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Text Color</label>
                    <input
                      type="color"
                      value={component.content.textColor}
                      onChange={(e) => updateContent({ textColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Line Height</label>
                    <select
                      value={component.content.lineHeight}
                      onChange={(e) => updateContent({ lineHeight: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="1.2">Tight (1.2)</option>
                      <option value="1.4">Snug (1.4)</option>
                      <option value="1.6">Normal (1.6)</option>
                      <option value="1.8">Relaxed (1.8)</option>
                      <option value="2.0">Loose (2.0)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Spacing</label>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Padding</label>
                  <select
                    value={component.content.padding}
                    onChange={(e) => updateContent({ padding: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="10px">Small (10px)</option>
                    <option value="20px">Medium (20px)</option>
                    <option value="30px">Large (30px)</option>
                    <option value="40px">X-Large (40px)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* PRIMARY CTA PROPERTIES */}
          {component.type === 'cta_primary' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Content</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={component.content.text}
                      onChange={(e) => updateContent({ text: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Button URL</label>
                    <input
                      type="url"
                      value={component.content.url}
                      onChange={(e) => updateContent({ url: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Style</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
                    <input
                      type="color"
                      value={component.content.backgroundColor}
                      onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Text Color</label>
                    <input
                      type="color"
                      value={component.content.textColor}
                      onChange={(e) => updateContent({ textColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
                    <select
                      value={component.content.fontSize}
                      onChange={(e) => updateContent({ fontSize: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="14px">Small (14px)</option>
                      <option value="16px">Medium (16px)</option>
                      <option value="18px">Large (18px)</option>
                      <option value="20px">X-Large (20px)</option>
                      <option value="24px">XX-Large (24px)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius</label>
                    <select
                      value={component.content.borderRadius}
                      onChange={(e) => updateContent({ borderRadius: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="0px">Square</option>
                      <option value="4px">Slightly Rounded</option>
                      <option value="8px">Rounded</option>
                      <option value="16px">Very Rounded</option>
                      <option value="32px">Pill Shape</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Button Size</label>
                    <select
                      value={component.content.padding}
                      onChange={(e) => updateContent({ padding: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="8px 16px">Small</option>
                      <option value="12px 24px">Medium</option>
                      <option value="16px 32px">Large</option>
                      <option value="20px 40px">X-Large</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Alignment</label>
                    <select
                      value={component.content.alignment}
                      onChange={(e) => updateContent({ alignment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* PRODUCT SHOWCASE PROPERTIES */}
          {component.type === 'product_showcase' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Product Content</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
                    <input
                      type="url"
                      value={component.content.imageUrl || component.content.image || ''}
                      onChange={(e) => updateContent({ imageUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Product Title</label>
                    <input
                      type="text"
                      value={component.content.title}
                      onChange={(e) => updateContent({ title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <textarea
                      value={component.content.description}
                      onChange={(e) => updateContent({ description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      rows="2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                    <input
                      type="text"
                      value={component.content.price}
                      onChange={(e) => updateContent({ price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={component.content.ctaText}
                      onChange={(e) => updateContent({ ctaText: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Button URL</label>
                    <input
                      type="url"
                      value={component.content.ctaUrl}
                      onChange={(e) => updateContent({ ctaUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Design</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
                    <input
                      type="color"
                      value={component.content.backgroundColor || 'transparent'}
                      onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Border Color</label>
                    <input
                      type="color"
                      value={component.content.borderColor || '#e5e7eb'}
                      onChange={(e) => updateContent({ borderColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Title Color</label>
                    <input
                      type="color"
                      value={component.content.titleColor || '#1f2937'}
                      onChange={(e) => updateContent({ titleColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description Color</label>
                    <input
                      type="color"
                      value={component.content.textColor || '#6b7280'}
                      onChange={(e) => updateContent({ textColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Price Color</label>
                    <input
                      type="color"
                      value={component.content.priceColor || '#059669'}
                      onChange={(e) => updateContent({ priceColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Button Background</label>
                    <input
                      type="color"
                      value={component.content.ctaBackgroundColor || '#00f0a0'}
                      onChange={(e) => updateContent({ ctaBackgroundColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Button Text Color</label>
                    <input
                      type="color"
                      value={component.content.ctaTextColor || 'transparent'}
                      onChange={(e) => updateContent({ ctaTextColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SPACER PROPERTIES */}
          {component.type === 'spacer' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Spacing</label>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Height</label>
                <select
                  value={component.content.height}
                  onChange={(e) => updateContent({ height: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="10px">10px</option>
                  <option value="20px">20px</option>
                  <option value="30px">30px</option>
                  <option value="40px">40px</option>
                  <option value="60px">60px</option>
                  <option value="80px">80px</option>
                  <option value="100px">100px</option>
                </select>
              </div>
            </div>
          )}

          {/* PRODUCT SHOWCASE PROPERTIES */}
          {component.type === 'product_showcase' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Content</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Product Image URL</label>
                    <input
                      type="url"
                      value={component.content.image}
                      onChange={(e) => updateContent({ image: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Product Title</label>
                    <input
                      type="text"
                      value={component.content.title}
                      onChange={(e) => updateContent({ title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                    <textarea
                      value={component.content.description}
                      onChange={(e) => updateContent({ description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                    <input
                      type="text"
                      value={component.content.price}
                      onChange={(e) => updateContent({ price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={component.content.ctaText}
                      onChange={(e) => updateContent({ ctaText: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Button URL</label>
                    <input
                      type="url"
                      value={component.content.ctaUrl}
                      onChange={(e) => updateContent({ ctaUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Design</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
                    <input
                      type="color"
                      value={component.content.backgroundColor}
                      onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Border Color</label>
                    <input
                      type="color"
                      value={component.content.borderColor}
                      onChange={(e) => updateContent({ borderColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* BUTTON GROUP PROPERTIES */}
          {component.type === 'button_group' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Buttons</label>
                <div className="space-y-4">
                  {(component.content.buttons || []).map((button, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-md p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-600">Button {idx + 1}</span>
                        {(component.content.buttons || []).length > 1 && (
                          <button
                            onClick={() => {
                              const currentButtons = component.content.buttons || [];
                              const newButtons = [...currentButtons];
                              newButtons.splice(idx, 1);
                              updateContent({ buttons: newButtons });
                            }}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Text</label>
                          <input
                            type="text"
                            value={button.text}
                            onChange={(e) => {
                              const currentButtons = component.content.buttons || [];
                              const newButtons = [...currentButtons];
                              newButtons[idx].text = e.target.value;
                              updateContent({ buttons: newButtons });
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                          <input
                            type="url"
                            value={button.url}
                            onChange={(e) => {
                              const currentButtons = component.content.buttons || [];
                              const newButtons = [...currentButtons];
                              newButtons[idx].url = e.target.value;
                              updateContent({ buttons: newButtons });
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Background</label>
                            <input
                              type="color"
                              value={button.backgroundColor}
                              onChange={(e) => {
                                const currentButtons = component.content.buttons || [];
                              const newButtons = [...currentButtons];
                                newButtons[idx].backgroundColor = e.target.value;
                                updateContent({ buttons: newButtons });
                              }}
                              className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Text Color</label>
                            <input
                              type="color"
                              value={button.textColor}
                              onChange={(e) => {
                                const currentButtons = component.content.buttons || [];
                              const newButtons = [...currentButtons];
                                newButtons[idx].textColor = e.target.value;
                                updateContent({ buttons: newButtons });
                              }}
                              className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => {
                      const newButtons = [...component.content.buttons, {
                        text: 'New Button',
                        url: '#',
                        backgroundColor: '#00f0a0',
                        textColor: 'transparent'
                      }];
                      updateContent({ buttons: newButtons });
                    }}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors text-sm"
                  >
                    + Add Button
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Layout</label>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Alignment</label>
                  <select
                    value={component.content.alignment}
                    onChange={(e) => updateContent({ alignment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* SOCIAL PROOF PROPERTIES */}
          {component.type === 'social_proof' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Testimonial</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Testimonial Text</label>
                    <textarea
                      value={component.content.content}
                      onChange={(e) => updateContent({ content: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Author Name</label>
                    <input
                      type="text"
                      value={component.content.author}
                      onChange={(e) => updateContent({ author: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Company</label>
                    <input
                      type="text"
                      value={component.content.company}
                      onChange={(e) => updateContent({ company: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Avatar URL</label>
                    <input
                      type="url"
                      value={component.content.avatar}
                      onChange={(e) => updateContent({ avatar: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Rating (1-5)</label>
                    <select
                      value={component.content.rating}
                      onChange={(e) => updateContent({ rating: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="1">1 Star</option>
                      <option value="2">2 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="5">5 Stars</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Design</label>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
                  <input
                    type="color"
                    value={component.content.backgroundColor}
                    onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                    className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                </div>
              </div>
            </>
          )}

          {/* FANCY DIVIDER PROPERTIES */}
          {component.type === 'divider_fancy' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Divider Style</label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Style</label>
                  <select
                    value={component.content.style}
                    onChange={(e) => {
                      const newColor = e.target.value === 'gradient' 
                        ? 'linear-gradient(90deg, transparent, #00f0a0, transparent)'
                        : '#00f0a0';
                      updateContent({ style: e.target.value, color: newColor });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="solid">Solid Line</option>
                    <option value="gradient">Gradient Line</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Thickness</label>
                  <select
                    value={component.content.thickness}
                    onChange={(e) => updateContent({ thickness: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="1px">Thin (1px)</option>
                    <option value="2px">Normal (2px)</option>
                    <option value="3px">Medium (3px)</option>
                    <option value="4px">Thick (4px)</option>
                    <option value="6px">X-Thick (6px)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Width</label>
                  <select
                    value={component.content.width}
                    onChange={(e) => updateContent({ width: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="30%">Short (30%)</option>
                    <option value="50%">Medium (50%)</option>
                    <option value="60%">Normal (60%)</option>
                    <option value="80%">Long (80%)</option>
                    <option value="100%">Full Width (100%)</option>
                  </select>
                </div>
                {component.content.style === 'solid' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                    <input
                      type="color"
                      value={component.content.color.startsWith('#') ? component.content.color : '#00f0a0'}
                      onChange={(e) => updateContent({ color: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROFESSIONAL FOOTER PROPERTIES */}
          {component.type === 'footer_professional' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Company Info</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={component.content.companyName}
                      onChange={(e) => updateContent({ companyName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                    <textarea
                      value={component.content.address}
                      onChange={(e) => updateContent({ address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      rows="2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={component.content.phone}
                      onChange={(e) => updateContent({ phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={component.content.email}
                      onChange={(e) => updateContent({ email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Unsubscribe Text</label>
                    <input
                      type="text"
                      value={component.content.unsubscribeText}
                      onChange={(e) => updateContent({ unsubscribeText: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Social Links</label>
                <div className="space-y-2">
                  {(component.content.socialLinks || []).map((link, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Platform"
                        value={link.platform}
                        onChange={(e) => {
                          const currentLinks = component.content.socialLinks || [];
                          const newLinks = [...currentLinks];
                          newLinks[idx].platform = e.target.value;
                          updateContent({ socialLinks: newLinks });
                        }}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="url"
                        placeholder="URL"
                        value={link.url}
                        onChange={(e) => {
                          const currentLinks = component.content.socialLinks || [];
                          const newLinks = [...currentLinks];
                          newLinks[idx].url = e.target.value;
                          updateContent({ socialLinks: newLinks });
                        }}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <button
                        onClick={() => {
                          const currentLinks = component.content.socialLinks || [];
                          const newLinks = [...currentLinks];
                          newLinks.splice(idx, 1);
                          updateContent({ socialLinks: newLinks });
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const currentLinks = component.content.socialLinks || [];
                      const newLinks = [...currentLinks, { platform: 'New Platform', url: '#' }];
                      updateContent({ socialLinks: newLinks });
                    }}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors text-sm"
                  >
                    + Add Social Link
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Design</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
                    <input
                      type="color"
                      value={component.content.backgroundColor}
                      onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Text Color</label>
                    <input
                      type="color"
                      value={component.content.textColor}
                      onChange={(e) => updateContent({ textColor: e.target.value })}
                      className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Template Management Functions
  const handleTemplateSelect = (template) => {
    console.log('🎨 TEMPLATE SELECTION DEBUG: Template selected:', template.name);
    console.log('🎨 TEMPLATE SELECTION DEBUG: Template ID:', template.id);
    console.log('🎨 TEMPLATE SELECTION DEBUG: Template HTML length:', template.html?.length || 'No HTML');
    console.log('🎨 TEMPLATE SELECTION DEBUG: Template structure:', template.structure);
    console.log('🎨 TEMPLATE SELECTION DEBUG: Full template object:', template);

    setSelectedTemplate(template);
    setCurrentTemplate(template.id);

    // Apply template structure to current email
    applyTemplateToEmail(template);

    console.log('🎨 TEMPLATE SELECTION DEBUG: selectedTemplate state updated');
    toast.success(`Applied ${template.name} template`);
  };

  const applyTemplateToEmail = (template) => {
    console.log('🎨 Applying template to email:', template.name);

    // Parse template HTML and extract components
    const parser = new DOMParser();
    const doc = parser.parseFromString(template.html, 'text/html');

    // Clear existing components
    setEmailComponents([]);

    // Set new HTML from template
    setRootEmailHTML(template.html);

    // Apply template-specific components
    if (template.components && template.components.length > 0) {
      const newComponents = template.components.map(comp => ({
        ...comp,
        id: comp.id + '_' + Date.now(), // Ensure unique IDs
        content: {
          ...comp.properties,
          text: comp.properties.text || comp.properties.title || ''
        }
      }));

      setEmailComponents(newComponents);
    }

    // Note: Subject is read-only in this component (comes from currentEmail?.subject)
    // Template subject will be applied when email is generated by backend

    console.log('🎨 Template applied successfully');
  };

  const openTemplateSelector = () => {
    setShowTemplateModal(true);
  };

  const closeTemplateSelector = () => {
    setShowTemplateModal(false);
  };

  const handleTemplateConfirm = () => {
    console.log('🎨 Template selection confirmed');
    setShowTemplateModal(false);

    // Save template selection to campaign
    if (campaignId && selectedTemplate) {
      localStorage.setItem(`campaign_${campaignId}_template`, selectedTemplate.id);
    }

    // Show template confirmation modal again after selecting new template
    // This allows user to decide whether to apply to all emails
    setShowTemplateConfirmation(true);
  };

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Top Toolbar - Horizontal */}
      <div className="w-full bg-white">
        <div className="flex items-center justify-between p-4">
          {/* Left Section - Title */}
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-black">Email Editor</h2>
            {/* Removed debug UI elements for clean interface */}
            {(availableEmails?.length > 0 || pendingEmails?.length > 0) && (
              <div className="text-sm text-black">
                Email {currentEmailIndex + 1} of {availableEmails?.length || pendingEmails?.length}
              </div>
            )}
          </div>

          {/* Center Section - Components (Hidden) */}
          <div className="hidden">
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-2">
            {(availableEmails?.length > 1 || pendingEmails?.length > 1) && (
              <>
                <button
                  onClick={() => {
                    const newIndex = currentEmailIndex > 0 ? currentEmailIndex - 1 : 0;
                    if (newIndex !== currentEmailIndex) switchToEmail(newIndex);
                  }}
                  disabled={currentEmailIndex <= 0}
                  className="px-3 py-2 text-sm bg-white border border-black rounded hover:bg-[#00f5a0] hover:text-black disabled:opacity-50 transition-colors"
                >
                  ← Prev
                </button>

                <button
                  onClick={() => {
                    const totalEmails = availableEmails?.length || pendingEmails?.length || 0;
                    const newIndex = currentEmailIndex < totalEmails - 1 ? currentEmailIndex + 1 : totalEmails - 1;
                    if (newIndex !== currentEmailIndex) switchToEmail(newIndex);
                  }}
                  disabled={currentEmailIndex >= (availableEmails?.length || pendingEmails?.length || 1) - 1}
                  className="px-3 py-2 text-sm bg-white border border-black rounded hover:bg-[#00f5a0] hover:text-black disabled:opacity-50 transition-colors"
                >
                  Next →
                </button>
              </>
            )}

            {/* Template Switcher */}
            <div className="flex items-center space-x-2">
              <div className="text-sm text-black">
                Template: <span className="font-medium text-black">
                  {EMAIL_TEMPLATES[currentTemplate]?.name || 'Professional Partnership'}
                </span>
              </div>
              <button
                onClick={openTemplateSelector}
                className="flex items-center px-3 py-2 bg-white border border-black rounded-lg text-sm font-medium text-black hover:bg-[#00f5a0] transition-all duration-200"
                title="Switch Email Template"
              >
                <SwatchIcon className="h-4 w-4 mr-1 text-black" />
                Switch Template
              </button>
            </div>

            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                previewMode
                  ? 'bg-[#00f5a0] text-black hover:bg-[#00e090]'
                  : 'bg-white border border-black text-black hover:bg-[#00f5a0]'
              }`}
            >
              {previewMode ? 'Exit Preview' : 'Preview'}
            </button>

            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-[#00f5a0] text-black rounded-lg text-sm font-medium hover:bg-[#00e090] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>

            {(availableEmails?.length > 0 || pendingEmails?.length > 0) && (
              <button
                onClick={handleSendCurrentEmail}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-[#00f5a0] text-black rounded-lg text-sm font-medium hover:bg-[#00e090] disabled:opacity-50 transition-colors"
              >
                <EnvelopeIcon className="h-4 w-4 mr-1" />
                {loading ? 'Sending...' : 'SEND'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area - Full Width */}
      <div className="flex-1 flex">
        {/* Email List Panel - Left Side - Only show if emails exist */}
        {((availableEmails && availableEmails.length > 0) || (pendingEmails && pendingEmails.length > 0)) && (
          <div className="w-56 bg-white flex flex-col mr-4">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-black">Email Campaign</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={async () => {
                    console.log('🔄 Manual refresh triggered - force fetching all data');
                    setRefreshing(true);
                    
                    // Force a complete re-fetch
                    try {
                      const refreshUrl = campaignId
                        ? `/api/workflow/results?campaignId=${campaignId}&force=true&t=${Date.now()}`
                        : `/api/workflow/results?force=true&t=${Date.now()}`;
                      const response = await fetch(refreshUrl);
                      const result = await response.json();
                      console.log('🔄 Force refresh results:', result);
                      
                      if (result.success && result.data) {
                        // Try all possible locations
                        const emails = 
                          result.data.campaignData?.emailCampaign?.emails ||
                          result.data.emailCampaign?.emails ||
                          result.data.emails ||
                          result.data.generatedEmails ||
                          [];
                        
                        console.log('🔄 Found', emails.length, 'emails in force refresh');
                        
                        if (emails.length > 0) {
                          setPendingEmails(emails);
                          setEmailsLoaded(false); // Reset to allow re-loading
                          setTimeout(() => {
                            // CRITICAL FIX: Check auto-save before force switching in refresh
                            if (!true) {
                              switchToEmail(0);
                            } else {
                              console.log('🛡️ Auto-save loaded, skipping force switchToEmail(0) in refresh');
                            }
                            setEmailsLoaded(true);
                          }, 100);
                        } else {
                          console.log('❌ Still no emails found, checking campaign manager data...');
                          // Try campaign manager endpoint
                          const campaignResponse = await fetch('/api/campaigns/list');
                          if (campaignResponse.ok) {
                            const campaigns = await campaignResponse.json();
                            console.log('📧 Campaign list:', campaigns);
                          }
                        }
                      }
                    } catch (error) {
                      console.error('❌ Force refresh failed:', error);
                    } finally {
                      setRefreshing(false);
                    }
                  }}
                  className="p-1 hover:bg-[#00f5a0] rounded transition-colors"
                  title="Force refresh emails"
                >
                  <ArrowPathIcon className={`h-4 w-4 text-black ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black text-white">
                  {availableEmails?.length || pendingEmails?.length || 0}
                </span>
              </div>
            </div>
            <p className="text-sm text-[#00f5a0] mt-1 font-medium">Ready for editing & sending</p>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto">
            <div>
              {(availableEmails?.length > 0 ? availableEmails : pendingEmails).map((email, index) => {
                const isCurrentlyEditing = currentEmailIndex === index;
                const status = email.status || (email.sent ? 'sent' : 'pending');

                return (
                  <div
                    key={email.id || index}
                    data-email-index={index}
                    onClick={() => {
                      console.log('📧 Clicked email', index, 'switching from', currentEmailIndex);
                      setCurrentEmailIndex(index);
                      switchToEmail(index);
                    }}
                    className={isCurrentlyEditing
                      ? 'p-4 cursor-pointer hover:bg-[#00f5a0]/10 transition-colors bg-[#00f5a0]/20 border-l-4 border-[#00f5a0]'
                      : 'p-4 cursor-pointer hover:bg-[#00f5a0]/10 transition-colors'
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-sm font-medium text-black truncate">
                            {email.recipient_name || email.name || `Recipient ${index + 1}`}
                          </h4>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            status === 'sent' ? 'bg-[#00f5a0] text-black' :
                            status === 'pending' ? 'bg-black/10 text-black' :
                            status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-[#00f5a0]/30 text-black'
                          }`}>
                            {status === 'sent' ? '✓ Sent' :
                             status === 'pending' ? '⏳ Pending' :
                             status === 'failed' ? '✗ Failed' :
                             '📧 Ready'}
                          </span>
                        </div>
                        <p className="text-xs text-black/70 font-mono mb-1">
                          {email.to || email.email || 'No email address'}
                        </p>
                        <p className="text-xs text-black/60 truncate">
                          {email.recipient_company || email.company || 'No company'}
                        </p>
                        {email.sent_at && (
                          <p className="text-xs text-black/50 mt-1">
                            Sent: {new Date(email.sent_at).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end space-y-1">
                        {isCurrentlyEditing && (
                          <div className="w-2 h-2 bg-[#00f5a0] rounded-full animate-pulse"></div>
                        )}
                        {status === 'sent' && email.opened && (
                          <div className="text-xs text-[#00f5a0] font-medium">📖 Opened</div>
                        )}
                        {status === 'sent' && email.clicked && (
                          <div className="text-xs text-[#00f5a0] font-medium">🔗 Clicked</div>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-3 flex items-center space-x-2">
                      {status === 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendSingle(email);
                          }}
                          className="inline-flex items-center px-2.5 py-1 bg-[#00f5a0] text-black text-xs rounded-md hover:bg-[#00e090] transition-colors"
                        >
                          <PlayIcon className="h-3 w-3 mr-1" />
                          SEND NOW
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          switchToEmail(index);
                        }}
                        className={`inline-flex items-center px-2.5 py-1 text-xs rounded-md transition-colors ${
                          isCurrentlyEditing
                            ? 'bg-[#00f5a0] text-black font-medium'
                            : 'bg-white border border-black text-black hover:bg-[#00f5a0]'
                        }`}
                      >
                        <PencilIcon className="h-3 w-3 mr-1" />
                        {isCurrentlyEditing ? 'Editing' : 'Edit'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-black">Campaign Status</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-[#00f5a0] font-medium">
                  {availableEmails.filter(e => e.sent || e.status === 'sent').length} Sent
                </span>
                <span className="text-xs text-black/60">
                  {availableEmails.filter(e => !e.sent && e.status !== 'sent').length} Pending
                </span>
              </div>
            </div>
            <button
              onClick={() => fetchPendingEmails()}
              disabled={refreshing}
              className="w-full flex items-center justify-center px-3 py-2 bg-white border border-black text-black rounded-md hover:bg-[#00f5a0] disabled:opacity-50 transition-colors text-sm"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Status
            </button>
          </div>
        </div>
      )}

        {/* Main Content - Email Editor - Full Width */}
        <div className="flex-1 bg-white overflow-y-auto ml-2">
        <div className="w-full h-full min-h-screen">
          {/* Email Header - Subject Only */}
          <div className="p-6 bg-white">
            <div className="space-y-3">
              {(availableEmails?.length > 0 || pendingEmails?.length > 0) && (
                <div className="flex items-center justify-between text-sm text-black">
                  <span><strong>To:</strong> {(availableEmails?.length > 0 ? availableEmails : pendingEmails)[currentEmailIndex]?.to || (availableEmails?.length > 0 ? availableEmails : pendingEmails)[currentEmailIndex]?.recipient_name || 'Recipient'}</span>
                  <span><strong>From:</strong> AI Marketing System</span>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <label className="text-sm font-medium text-black whitespace-nowrap">Subject:</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="flex-1 px-3 py-2 text-lg font-medium text-gray-900 bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter email subject..."
                />
              </div>
            </div>
          </div>

            {/* Content - Free Editing Area */}
            <div
              key={`email-editor-${autoSaveKey}`}
              className={`w-full h-full relative transition-all duration-300 ${
                previewMode
                  ? 'bg-white'
                  : ''
              }`}
              style={{ 
                background: !previewMode && isDragging ? 'rgba(59, 130, 246, 0.05)' : (previewMode ? 'white' : 'transparent'),
                border: !previewMode && isDragging ? '2px dashed rgba(59, 130, 246, 0.3)' : 'none',
                borderRadius: previewMode ? '0px' : '0px',
                maxWidth: 'none',
                margin: '0',
                boxShadow: previewMode ? '0 10px 25px rgba(0,0,0,0.1)' : 'none'
              }}
              onClick={(e) => {
                // Clicking on the background deselects components
                if (e.target === e.currentTarget) {
                  setSelectedComponent(null);
                }
              }}
              onDragOver={(e) => {
                if (previewMode) return; // Disable drag in preview mode
                e.preventDefault();
                e.stopPropagation();
                if (isDragging) {
                  // Get precise mouse position
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientY - rect.top;
                  const y = e.clientY - rect.top;
                  
                  // Find the closest insertion point
                  let insertionIndex = 0;
                  const elements = e.currentTarget.children;
                  
                  for (let i = 0; i < elements.length; i++) {
                    const element = elements[i];
                    if (element.classList.contains('email-component')) {
                      const elementRect = element.getBoundingClientRect();
                      const elementMiddle = elementRect.top + elementRect.height / 2 - rect.top;

                      console.log('🎯 [DRAGOVER] Element', i, 'middle:', elementMiddle, 'mouseY:', y);

                      if (y < elementMiddle) {
                        insertionIndex = i;
                        console.log('🎯 [DRAGOVER] Insert BEFORE element', i);
                        break;
                      } else {
                        insertionIndex = i + 1;
                        console.log('🎯 [DRAGOVER] Insert AFTER element', i);
                      }
                    }
                  }

                  console.log('🎯 [DRAGOVER] Final insertionIndex:', insertionIndex);
                  setDragOverIndex(insertionIndex);
                }
              }}
              onDragLeave={(e) => {
                if (previewMode) return;
                // Only clear if we're leaving the main container, not child elements
                if (!e.currentTarget.contains(e.relatedTarget)) {
                  setDragOverIndex(null);
                }
              }}
              onDrop={(e) => {
                if (previewMode) return;
                e.preventDefault();
                e.stopPropagation();
                const componentType = e.dataTransfer.getData('componentType');
                if (componentType) {
                  console.log('🚀 [DROP] Component type:', componentType);
                  console.log('🚀 [DROP] dragOverIndex:', dragOverIndex);
                  console.log('🚀 [DROP] emailComponents.length:', emailComponents.length);
                  console.log('🚀 [DROP] Final insertion index:', dragOverIndex || emailComponents.length);

                  // Insert at the calculated position
                  addComponentAtIndex(componentType, dragOverIndex || emailComponents.length);
                }
                setDragOverIndex(null);
                setIsDragging(false);
              }}
            >
              {/* Dynamic drop indicator - Only in edit mode */}
              {isDragging && !previewMode && (
                <div className="absolute left-0 right-0 pointer-events-none z-50">
                  <div 
                    className="h-0.5 bg-green-500 rounded-full shadow-lg transition-all duration-150"
                    style={{ 
                      top: `${getDynamicDropPosition()}px`,
                      boxShadow: '0 0 8px rgba(59, 130, 246, 0.8)'
                    }}
                  >
                    <div className="absolute -left-1 -top-1 w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="absolute -right-1 -top-1 w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              )}
              
              {(() => {
                // FORCE: Always show HTML preview instead of component interface
                const showComponentInterface = false; // DISABLED - show exact HTML
                console.log('🔥 FORCING HTML DISPLAY - Component interface disabled');
                return showComponentInterface;
              })() ? (
                <div key={`component-interface-${autoSaveKey}-${emailComponents.length}`} className=""
                >
                  {/* FORCE COMPONENT INTERFACE - BLOCK HTML PREVIEW */}
                  <div style={{display: 'block', position: 'relative', zIndex: 10}}>

                  {/* Initial drop zone at the top */}
                  {!previewMode && isDragging && (
                    <div 
                      className={`transition-all duration-200 ${
                        dragOverIndex === 0 
                          ? 'h-24 bg-green-100 border-2 border-dashed border-green-400 rounded-lg flex items-center justify-center' 
                          : 'h-8 hover:h-16 hover:bg-green-50 hover:border-2 hover:border-dashed hover:border-green-300 rounded-lg flex items-center justify-center'
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverIndex(0);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const componentType = e.dataTransfer.getData('componentType');
                        const componentIndex = e.dataTransfer.getData('componentIndex');
                        
                        if (componentType) {
                          addComponentAtIndex(componentType, 0);
                        } else if (componentIndex !== '') {
                          const fromIndex = parseInt(componentIndex);
                          if (fromIndex !== 0) {
                            moveComponent(fromIndex, 0);
                          }
                        }
                        setDragOverIndex(null);
                        setIsDragging(false);
                      }}
                    >
                      {dragOverIndex === 0 && (
                        <div className="text-sm text-blue-600 font-medium">
                          Drop component here
                        </div>
                      )}
                    </div>
                  )}
                  
                  {emailComponents.length === 0 && (
                    <div 
                      className="h-96 border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const componentType = e.dataTransfer.getData('componentType');
                        if (componentType) {
                          addComponentAtIndex(componentType, 0);
                        }
                      }}
                    >
                      <div className="text-center text-gray-500">
                        <div className="text-2xl mb-4">📧</div>
                        <div className="text-lg font-medium mb-2">Start Building Your Email</div>
                        <div className="text-sm">Drag components from the sidebar to get started</div>
                      </div>
                    </div>
                  )}
                  
                  {emailComponents.map((component, index) => (
                    <div key={`component-${component.id}`}>
                      
                      {/* The actual component */}
                      <div 
                        className={`email-component relative ${
                          previewMode 
                            ? '' 
                            : 'group cursor-move hover:shadow-lg transition-shadow'
                        } ${selectedComponent === component.id ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
                        draggable={!previewMode && component.type !== 'freeform_editor'}
                        onClick={(e) => {
                          if (!previewMode && component.type !== 'freeform_editor') {
                            e.stopPropagation();
                            setSelectedComponent(component.id);
                          } else if (component.type === 'freeform_editor') {
                            // Completely prevent selection of freeform editor
                            e.stopPropagation();
                            setSelectedComponent(null);
                          }
                        }}
                        onDragStart={(e) => {
                          if (!previewMode && component.type !== 'freeform_editor') {
                            e.dataTransfer.setData('componentIndex', index.toString());
                            e.dataTransfer.setData('componentId', component.id);
                            e.dataTransfer.effectAllowed = 'move';
                            setIsDragging(true);
                            // Add visual feedback
                            e.currentTarget.style.opacity = '0.5';
                          } else {
                            e.preventDefault();
                          }
                        }}
                        onDragEnd={(e) => {
                          setIsDragging(false);
                          setDragOverIndex(null);
                          // Reset visual feedback
                          e.currentTarget.style.opacity = '1';
                        }}
                      >
                    {/* Component Controls - Only show in edit mode */}
                    {!previewMode && component.type !== 'freeform_editor' && (
                      <div className="absolute -top-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                        <div className="flex items-center space-x-2 bg-white shadow-lg rounded-md px-3 py-1 border border-gray-200">
                          <span className="text-xs font-medium text-gray-600">{component.type.replace('_', ' ').toUpperCase()}</span>
                          <div className="text-xs text-gray-400">Drag to move</div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedComponent(component.id);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Edit properties"
                          >
                            <PencilIcon className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeComponent(component.id);
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete component"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* HERO COMPONENT */}
                    {component.type === 'hero' && (
                      <div 
                        className="text-center"
                        style={{ 
                          background: component.content.backgroundColor,
                          color: component.content.textColor,
                          textAlign: component.content.alignment,
                          padding: '0'
                        }}
                      >
                        <h1 
                          data-component-id={component.id}
                          contentEditable={!previewMode}
                          suppressContentEditableWarning={true}
                          onBlur={(e) => !previewMode && updateComponent(component.id, { title: e.target.textContent })}
                          className={`text-4xl font-bold mb-4 outline-none ${previewMode ? 'cursor-default' : 'cursor-text'}`}
                        >
                          {component.content.title}
                        </h1>
                        <p 
                          data-component-id={component.id}
                          contentEditable={!previewMode}
                          suppressContentEditableWarning={true}
                          onBlur={(e) => !previewMode && updateComponent(component.id, { subtitle: e.target.textContent })}
                          className={`text-xl mb-8 opacity-90 outline-none ${previewMode ? 'cursor-default' : 'cursor-text'}`}
                        >
                          {component.content.subtitle}
                        </p>
                        <a 
                          href={component.content.ctaUrl}
                          className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors"
                          data-component-id={component.id}
                          contentEditable={!previewMode}
                          suppressContentEditableWarning={true}
                          onBlur={(e) => !previewMode && updateComponent(component.id, { ctaText: e.target.textContent })}
                          style={{ outline: 'none' }}
                        >
                          {component.content.ctaText}
                        </a>
                      </div>
                    )}

                    {/* RICH TEXT COMPONENT */}
                    {component.type === 'text_rich' && (
                      <div 
                        className="relative"
                        style={{ padding: '0' }}
                      >
                        <div
                          contentEditable={!previewMode}
                          suppressContentEditableWarning={true}
                          onBlur={(e) => !previewMode && updateComponent(component.id, { text: e.target.innerHTML })}
                          onDragOver={(e) => !previewMode && handleTextDragOver(e, component.id)}
                          onDrop={(e) => !previewMode && handleTextDrop(e, component.id)}
                          onDragLeave={() => setTextDropPosition(null)}
                          className={`outline-none ${previewMode ? 'cursor-default' : 'cursor-text'} ${
                            textDropPosition?.componentId === component.id ? 'bg-green-50 border-2 border-green-300 border-dashed relative' : ''
                          }`}
                          style={{ 
                            fontSize: component.content.fontSize,
                            color: component.content.textColor,
                            textAlign: component.content.alignment,
                            lineHeight: component.content.lineHeight,
                            transform: 'none',
                            scale: 'none',
                            maxWidth: '100%',
                            width: 'auto',
                            height: 'auto',
                            minHeight: 'auto'
                          }}
                          dangerouslySetInnerHTML={{ 
                            __html: component.content.text
                          }}
                        />
                        {/* Visual indicator for drop position */}
                        {textDropPosition?.componentId === component.id && (
                          <>
                            {textDropPosition.position === 'before' && (
                              <div className="absolute -top-1 left-0 w-full h-1 bg-green-500 rounded pointer-events-none z-10" />
                            )}
                            {textDropPosition.position === 'middle' && (
                              <div className="absolute top-1/2 left-0 w-full h-1 bg-green-500 rounded pointer-events-none z-10 transform -translate-y-1/2" />
                            )}
                            {textDropPosition.position === 'after' && (
                              <div className="absolute -bottom-1 left-0 w-full h-1 bg-green-500 rounded pointer-events-none z-10" />
                            )}
                            <div className="absolute top-0 left-0 right-0 bottom-0 border-2 border-green-400 border-dashed rounded pointer-events-none z-10">
                              <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                                Drop {textDropPosition.position === 'before' ? 'Before' : textDropPosition.position === 'after' ? 'After' : 'In Middle'}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* FREEFORM EDITOR - Displays email HTML content */}
                    {component.type === 'freeform_editor' && (
                      <div 
                        className="w-full relative"
                        style={{ padding: '0' }}
                      >
                        <div
                          key={`${component.id}-${component.content.fontSize}-${component.content.textColor}-${component.content.lineHeight}`}
                          contentEditable={!previewMode}
                          suppressContentEditableWarning={true}
                          onBlur={(e) => {
                            if (!previewMode && inlineComponents.size === 0) {
                              // Only update if no inline components exist to prevent destruction
                              updateComponent(component.id, { html: e.target.innerHTML });
                            } else if (inlineComponents.size > 0) {
                              console.log('🚫 Blocked freeform onBlur update - inline components exist');
                            }
                          }}
                          onDragOver={(e) => !previewMode && handleFreeformDragOver(e, component.id)}
                          onDrop={(e) => !previewMode && handleFreeformDrop(e, component.id)}
                          onDragLeave={() => setTextDropPosition(null)}
                          onClick={(e) => {
                            console.log('🖱️ Freeform editor clicked, target:', e.target);
                            console.log('🖱️ Target classes:', e.target.className);
                            console.log('🖱️ Target closest inline-component:', e.target.closest('.inline-component'));
                            
                            // Handle inline component selection via event delegation
                            const inlineComponent = e.target.closest('.inline-component');
                            
                            if (inlineComponent) {
                              console.log('✅ Inline component detected!');
                              e.preventDefault();
                              e.stopPropagation();
                              
                              const componentId = inlineComponent.getAttribute('data-component-id');
                              const componentType = inlineComponent.getAttribute('data-component-type');
                              
                              console.log('📋 Component ID:', componentId);
                              console.log('📋 Component Type:', componentType);
                              
                              if (componentId && componentType) {
                                console.log('🎯 Setting selectedComponent to:', componentId);
                                setSelectedComponent(componentId);
                                
                                // Also store in inline components if not already there
                                if (!inlineComponents.has(componentId)) {
                                  console.log('💾 Adding to inlineComponents Map');
                                  // Parse current content from the HTML element
                                  const parsedContent = parseComponentContentFromElement(inlineComponent, componentType);
                                  setInlineComponents(prev => new Map(prev.set(componentId, {
                                    type: componentType,
                                    id: componentId,
                                    content: parsedContent || getDefaultComponentContent(componentType)
                                  })));
                                }
                                
                                // Ensure component remains draggable and show visual selection
                                inlineComponent.draggable = true;
                                inlineComponent.style.cursor = 'move';
                                
                                // Add visual selection indicator
                                document.querySelectorAll('.inline-component').forEach(el => {
                                  el.style.border = el.dataset.componentId === componentId 
                                    ? '2px solid #00f0a0' 
                                    : '2px solid transparent';
                                });
                              } else {
                                console.log('❌ Missing component ID or type');
                              }
                            } else {
                              console.log('📝 No inline component, clearing any selection');
                              // Clear any existing selection and don't select freeform editor
                              setSelectedComponent(null);
                              
                              // Clear all visual selections
                              document.querySelectorAll('.inline-component').forEach(el => {
                                el.style.border = '2px solid transparent';
                              });
                              
                              e.stopPropagation();
                            }
                          }}
                          className={`w-full outline-none ${
                            previewMode ? 'cursor-default' : 'cursor-text'
                          } ${
                            textDropPosition?.componentId === component.id ? 'bg-green-50 border-2 border-green-300 border-dashed relative' : ''
                          }`}
                          style={{ 
                            fontSize: component.content.fontSize || '16px',
                            color: component.content.textColor || '#374151',
                            lineHeight: component.content.lineHeight || '1.6'
                          }}
                          dangerouslySetInnerHTML={{ 
                            __html: component.content.html || '<p>Start typing your email content here...</p>'
                          }}
                        />
                        
                        {/* Drop indicators for freeform editor */}
                        {textDropPosition?.componentId === component.id && (
                          <div className="absolute inset-0 pointer-events-none z-10">
                            <div className="absolute bg-green-500 text-white px-3 py-1 rounded text-sm font-medium"
                                 style={{
                                   left: `${Math.max(0, Math.min(textDropPosition.x - 50, 300))}px`,
                                   top: `${Math.max(0, textDropPosition.y - 30)}px`
                                 }}>
                              Drop here
                            </div>
                            <div className="absolute w-1 h-6 bg-green-500 rounded"
                                 style={{
                                   left: `${textDropPosition.x}px`,
                                   top: `${textDropPosition.y - 3}px`
                                 }}>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* PRODUCT SHOWCASE */}
                    {component.type === 'product_showcase' && (
                      <div 
                        className="text-center"
                        style={{ 
                          backgroundColor: component.content.backgroundColor,
                          padding: '0'
                        }}
                      >
                        <img 
                          src={component.content.image} 
                          alt={component.content.title}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                        <h3 
                          contentEditable
                          suppressContentEditableWarning={true}
                          onBlur={(e) => updateComponent(component.id, { title: e.target.textContent })}
                          className="text-2xl font-bold mb-2 outline-none cursor-text"
                        >
                          {component.content.title}
                        </h3>
                        <p 
                          contentEditable
                          suppressContentEditableWarning={true}
                          onBlur={(e) => updateComponent(component.id, { description: e.target.textContent })}
                          className="text-gray-600 mb-4 outline-none cursor-text"
                        >
                          {component.content.description}
                        </p>
                        <div className="flex justify-center items-center space-x-4">
                          <span 
                            contentEditable
                            suppressContentEditableWarning={true}
                            onBlur={(e) => updateComponent(component.id, { price: e.target.textContent })}
                            className="text-2xl font-bold text-green-600 outline-none cursor-text"
                          >
                            {component.content.price}
                          </span>
                          <a 
                            href={component.content.ctaUrl}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                            contentEditable
                            suppressContentEditableWarning={true}
                            onBlur={(e) => updateComponent(component.id, { ctaText: e.target.textContent })}
                            style={{ outline: 'none' }}
                          >
                            {component.content.ctaText}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* PRIMARY CTA */}
                    {component.type === 'cta_primary' && (
                      <div className="text-center" style={{ textAlign: component.content.alignment }}>
                        <a
                          href={component.content.url}
                          className="inline-block font-semibold transition-all duration-200 hover:scale-105"
                          style={{
                            backgroundColor: component.content.backgroundColor,
                            color: component.content.textColor,
                            borderRadius: component.content.borderRadius,
                            fontSize: component.content.fontSize,
                            padding: component.content.padding,
                            textDecoration: 'none',
                            outline: 'none'
                          }}
                          contentEditable
                          suppressContentEditableWarning={true}
                          onBlur={(e) => updateComponent(component.id, { text: e.target.textContent })}
                        >
                          {component.content.text}
                        </a>
                      </div>
                    )}

                    {/* BUTTON GROUP */}
                    {component.type === 'button_group' && (
                      <div className="text-center" style={{ textAlign: component.content.alignment }}>
                        <div className="inline-flex space-x-4">
                          {(component.content.buttons || []).map((button, idx) => (
                            <a
                              key={idx}
                              href={button.url}
                              className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-105"
                              style={{
                                backgroundColor: button.backgroundColor,
                                color: button.textColor,
                                textDecoration: 'none'
                              }}
                            >
                              {button.text}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SOCIAL PROOF */}
                    {component.type === 'social_proof' && (
                      <div 
                        className=""
                        style={{ 
                          backgroundColor: component.content.backgroundColor,
                          padding: '0'
                        }}
                      >
                        <div className="flex items-center space-x-4">
                          <img 
                            src={component.content.avatar} 
                            alt={component.content.author}
                            className="w-12 h-12 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="flex mb-2">
                              {[...Array(component.content.rating)].map((_, i) => (
                                <span key={i} className="text-yellow-400">★</span>
                              ))}
                            </div>
                            <p 
                              contentEditable
                              suppressContentEditableWarning={true}
                              onBlur={(e) => updateComponent(component.id, { content: e.target.textContent })}
                              className="italic text-gray-700 mb-2 outline-none cursor-text"
                            >
                              "{component.content.content}"
                            </p>
                            <p className="text-sm text-gray-600">
                              <span 
                                contentEditable
                                suppressContentEditableWarning={true}
                                onBlur={(e) => updateComponent(component.id, { author: e.target.textContent })}
                                className="font-semibold outline-none cursor-text"
                              >
                                {component.content.author}
                              </span>
                              , {component.content.company}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SPACER */}
                    {component.type === 'spacer' && (
                      <div 
                        className="border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center"
                        style={{ 
                          height: component.content.height,
                          backgroundColor: component.content.backgroundColor
                        }}
                      >
                        <span className="text-gray-400 text-sm">Spacer ({component.content.height})</span>
                      </div>
                    )}

                    {/* FANCY DIVIDER */}
                    {component.type === 'divider_fancy' && (
                      <div className="py-8 flex justify-center">
                        <div 
                          className="h-1 rounded-full"
                          style={{
                            background: component.content.color,
                            width: component.content.width,
                            height: component.content.thickness
                          }}
                        />
                      </div>
                    )}

                    {/* PROFESSIONAL FOOTER */}
                    {component.type === 'footer_professional' && (
                      <div 
                        className="text-center"
                        style={{ 
                          backgroundColor: component.content.backgroundColor,
                          color: component.content.textColor,
                          padding: '0'
                        }}
                      >
                        <h3 
                          contentEditable={!previewMode}
                          suppressContentEditableWarning={true}
                          onBlur={(e) => !previewMode && updateComponent(component.id, { companyName: e.target.textContent })}
                          className={`text-lg font-bold mb-4 outline-none ${previewMode ? 'cursor-default' : 'cursor-text'}`}
                        >
                          {component.content.companyName}
                        </h3>
                        <div className="space-y-2 text-sm mb-6">
                          <p 
                            contentEditable={!previewMode}
                            suppressContentEditableWarning={true}
                            onBlur={(e) => !previewMode && updateComponent(component.id, { address: e.target.textContent })}
                            className={`outline-none ${previewMode ? 'cursor-default' : 'cursor-text'}`}
                          >
                            {component.content.address}
                          </p>
                          <p>
                            <span 
                              contentEditable={!previewMode}
                              suppressContentEditableWarning={true}
                              onBlur={(e) => !previewMode && updateComponent(component.id, { phone: e.target.textContent })}
                              className={`outline-none ${previewMode ? 'cursor-default' : 'cursor-text'}`}
                            >
                              {component.content.phone}
                            </span>
                            {' | '}
                            <span 
                              contentEditable={!previewMode}
                              suppressContentEditableWarning={true}
                              onBlur={(e) => !previewMode && updateComponent(component.id, { email: e.target.textContent })}
                              className={`outline-none ${previewMode ? 'cursor-default' : 'cursor-text'}`}
                            >
                              {component.content.email}
                            </span>
                          </p>
                        </div>
                        <div className="flex justify-center space-x-4 mb-6">
                          {(component.content.socialLinks || []).map((link, idx) => (
                            <a key={idx} href={link.url} className="text-blue-600 hover:text-blue-800 font-medium">
                              {link.platform}
                            </a>
                          ))}
                        </div>
                        <p className="text-xs">
                          <a 
                            href="#" 
                            className={previewMode ? 'cursor-default' : 'cursor-text hover:underline'}
                            contentEditable={!previewMode}
                            suppressContentEditableWarning={true}
                            onBlur={(e) => !previewMode && updateComponent(component.id, { unsubscribeText: e.target.textContent })}
                            style={{ outline: 'none' }}
                          >
                            {component.content.unsubscribeText}
                          </a>
                        </p>
                      </div>
                    )}
                      </div>
                      
                      {/* Drop zone after each component */}
                      {!previewMode && isDragging && (
                        <div 
                          className={`transition-all duration-200 mt-2 ${
                            dragOverIndex === index + 1 
                              ? 'h-24 bg-green-100 border-2 border-dashed border-green-400 rounded-lg flex items-center justify-center' 
                              : 'h-8 hover:h-16 hover:bg-green-50 hover:border-2 hover:border-dashed hover:border-green-300 rounded-lg flex items-center justify-center'
                          }`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOverIndex(index + 1);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const componentType = e.dataTransfer.getData('componentType');
                            const componentIdx = e.dataTransfer.getData('componentIndex');
                            
                            if (componentType) {
                              addComponentAtIndex(componentType, index + 1);
                            } else if (componentIdx !== '') {
                              const fromIndex = parseInt(componentIdx);
                              let toIndex = index + 1;
                              if (fromIndex < toIndex) {
                                toIndex = toIndex - 1;
                              }
                              if (fromIndex !== toIndex) {
                                moveComponent(fromIndex, toIndex);
                              }
                            }
                            setDragOverIndex(null);
                            setIsDragging(false);
                          }}
                        >
                          {dragOverIndex === index + 1 && (
                            <div className="text-sm text-blue-600 font-medium">
                              Drop component here
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
                </div>
              ) : (
                // Show HTML content (either preview mode or edit mode with HTML)
                (() => {
                  console.log('🎨 HTML PREVIEW SECTION DEBUG:');
                  console.log('  📍 rootEmailHTML exists:', !!rootEmailHTML);
                  console.log('  📍 rootEmailHTML length:', rootEmailHTML ? rootEmailHTML.length : 0);
                  console.log('  📍 previewMode:', previewMode);
                  if (rootEmailHTML) {
                    console.log('  📍 rootEmailHTML first 200 chars:', rootEmailHTML.substring(0, 200));
                  }
                })(),
                (() => {
                  // FORCE: Always use campaign HTML instead of persistence
                  const getEmailSpecificHTML = () => {
                    // FORCE: Always use the exact campaign HTML
                    console.log('🔥 FORCING campaign HTML for preview:', rootEmailHTML?.length || 0);
                    console.log('🔥 Campaign HTML preview:', rootEmailHTML?.substring(0, 200) + '...');

                    // Always use the current rootEmailHTML (which is now forced to campaign HTML)
                    return rootEmailHTML;
                  };

                  const emailSpecificHTML = getEmailSpecificHTML();
                  return emailSpecificHTML;
                })() ? (
                  previewMode ? (
                    // PREVIEW MODE - Show email-specific HTML in iframe
                    <iframe
                      srcDoc={(() => {
                        const getEmailSpecificHTML = () => {
                          if (hasMeaningfulData && persistedData.html) {
                            return persistedData.html;
                          }
                          return rootEmailHTML;
                        };
                        return getEmailSpecificHTML();
                      })()}
                      style={{
                        width: '100%',
                        height: '600px',
                        border: 'none',
                        background: 'white'
                      }}
                    />
                  ) : (
                    // EDIT MODE - Show editable HTML (preserve inline components)
                    <div 
                      ref={(el) => {
                        if (el) {
                          contentEditableRefs.current.set('main-editor', el);
                          
                          // Use frozen HTML if available, otherwise use rootEmailHTML
                          const frozenContent = frozenHTML.get('main-editor');
                          const shouldUseFrozen = frozenContent && inlineComponents.size > 0;
                          
                          if (shouldUseFrozen) {
                            console.log('🧊 Using frozen HTML to preserve inline components');
                            if (el.innerHTML !== frozenContent) {
                              el.innerHTML = frozenContent;
                            }
                          } else if (!el.hasChildNodes() || !preserveInlineComponents) {
                            console.log('❄️ Using fresh HTML content');
                            el.innerHTML = rootEmailHTML || '<div>Click here to edit your email content...</div>';
                          }
                        }
                      }}
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      className="outline-none bg-white min-h-96"
                      style={{
                        width: '100%',
                        padding: '20px'
                      }}
                      onBlur={(e) => {
                        setRootEmailHTML(e.target.innerHTML);
                      }}
                      // REMOVED: dangerouslySetInnerHTML destroys inline components
                    />
                  )
                ) : (
                  // No email content and not in preview mode - show empty state with drop zone
                  !previewMode ? (
                    <div 
                      className="h-96 border-4 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const componentType = e.dataTransfer.getData('componentType');
                        if (componentType) {
                          addComponentAtIndex(componentType, 0);
                        }
                      }}
                    >
                      <div className="text-center text-gray-500">
                        <div className="text-2xl mb-4">📧</div>
                        <div className="text-lg font-medium mb-2">Start Building Your Email</div>
                        <div className="text-sm">Drag components from the sidebar to get started</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <div className="text-center">
                        <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">Start building your email</p>
                        <p className="text-sm">Add components from the sidebar to get started</p>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
        </div>
        
      </div>

      </div>

      {/* Template Confirmation Popup */}
      {showTemplateConfirmation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-8">
          <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-[#00f5a0] rounded-3xl shadow-2xl shadow-[#00f5a0]/20 w-full max-w-2xl p-8">
            {/* Close Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowTemplateConfirmation(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>


            {/* Content */}
            <div className="text-center">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-[#00f5a0] rounded-xl flex items-center justify-center animate-pulse">
                  <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-3xl font-bold text-white mb-4">Apply Template to All Emails?</h2>
              <p className="text-lg text-gray-400 mb-8">
                Would you like to apply your current email template and components to all remaining emails in this campaign?
              </p>

              {/* Info Section */}
              <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-xl mb-8 text-left">
                <p className="text-base text-gray-300 flex items-start gap-2">
                  <svg className="w-5 h-5 text-[#00f5a0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                  </svg>
                  <span><strong>Batch Processing:</strong> This will apply your current email design and content structure to all remaining prospects in the campaign.</span>
                </p>
                <p className="text-sm text-gray-400 mt-3 flex items-start gap-2">
                  <svg className="w-5 h-5 text-[#00f5a0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span><strong>Not satisfied?</strong> You can choose a different template to regenerate this email.</span>
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => handleTemplateConfirmation(false)}
                    className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors border border-gray-700"
                  >
                    Send Single Email
                  </button>
                  <button
                    onClick={() => handleTemplateConfirmation(true)}
                    className="px-10 py-3 bg-black hover:bg-gray-900 border-2 border-[#00f5a0] rounded-lg text-[#00f5a0] font-semibold transition-colors"
                  >
                    Yes, Use Template
                  </button>
                </div>

                {/* Choose Different Template Button */}
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setShowTemplateConfirmation(false);
                      setShowTemplateModal(true);
                    }}
                    className="px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors border border-gray-700"
                  >
                    🎨 Choose Different Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Selection Modal */}
      <TemplateSelectionModal
        isOpen={showTemplateModal}
        onClose={closeTemplateSelector}
        onSelectTemplate={handleTemplateSelect}
        onConfirm={handleTemplateConfirm}
      />

      {/* 🔄 Pause/Resume Email Generation Button - Fixed at Bottom */}
      {isGenerating && (
        <div className="fixed bottom-8 right-8 z-50">
          <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-4 min-w-[300px]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {isPaused ? '⏸️ Email Generation Paused' : '🔄 Generating Emails'}
                </h3>
                <p className="text-sm text-gray-600">
                  {lastProcessedIndex} / {totalToProcess} emails processed
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(lastProcessedIndex / totalToProcess) * 100}%` }}
              />
            </div>

            {/* Pause/Resume Button */}
            <button
              onClick={() => {
                if (isPaused) {
                  // Resume generation
                  setIsPaused(false);
                  pauseRef.current = false;
                  // Re-trigger the generation with saved template and config
                  const savedTemplate = localStorage.getItem('current_template_data');
                  const savedSmtp = localStorage.getItem('smtpConfig');
                  if (savedTemplate && savedSmtp) {
                    sendTemplateEmailsDirectly(JSON.parse(savedTemplate), JSON.parse(savedSmtp));
                  }
                } else {
                  // Pause generation
                  pauseRef.current = true;
                  toast('⏸️ Pausing after current email...', { icon: 'ℹ️' });
                }
              }}
              className="w-full py-2 px-4 rounded-lg font-semibold text-white transition-colors"
              style={{
                background: isPaused
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
              }}
            >
              {isPaused ? '▶️ Resume Generation' : '⏸️ Pause Generation'}
            </button>
          </div>
        </div>
      )}

      {/* Properties Panel Overlay - Full Screen when component is selected */}
      {selectedComponent && renderPropertiesPanel()}
    </div>
  );
}
