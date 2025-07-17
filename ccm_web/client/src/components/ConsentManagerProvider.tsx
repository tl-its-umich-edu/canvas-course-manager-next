import React, { useCallback, useEffect, useState } from 'react';
import * as ReactGA from 'react-ga4';
import { AnalyticsConsentContext, AnalyticsConsentContextType } from '../context/AnalyticsConsentContext.js';
import { Globals } from '../models/models.js';

interface ConsentChangeEvent {
  cookie: {
    categories: string[];
  }
}

interface UmConsentCustomManager {
  enabled: boolean;
  alwaysShow: boolean;
  rootDomain: string | false;
  preferencePanel: {
    beforeCategories: boolean;
    afterCategories: boolean;
  };
}

interface UmConsentManagerConfig {
  onConsentChange: (event: ConsentChangeEvent) => void;
  mode: string;
  customManager: UmConsentCustomManager;
  googleAnalyticsCustom: {
    streamConfig: {
      cookie_flags: string;
    };
  }
  privacyUrl: string | false;
  externalLinkBlank: boolean;
  googleAnalyticsID: string | false;
  cookies: {
    necessary: Array<{ name: string; domain: string; regex: string }>;
    analytics: Array<{ name: string; domain: string; regex: string }>;
  };
}

declare global {
  interface Window {
    umConsentManager: UmConsentManagerConfig;
  }
}

interface ConsentManagerProviderProps {
  children: React.ReactNode;
  globals: Globals;
  alwaysShow?: boolean;
  rootDomain?: string;
  mode?: 'prod' | 'dev';
  privacyUrl?: string | false;
  externalLinkBlank?: boolean; // open privacy link in a new tab
}

export function ConsentManagerProvider({
  children,
  globals,
  alwaysShow = false,
  rootDomain = '',
  mode = 'prod',
  privacyUrl = false,
  externalLinkBlank = true
}: ConsentManagerProviderProps) {
  const { 
    umConsentManagerScriptUrl, 
    googleAnalyticsId,
    course
  } = globals;

  const [analyticsConsentGiven, setAnalyticsConsentGiven] = useState<boolean | null>(null);

  const handleConsentChange = useCallback(({cookie}: ConsentChangeEvent) => {
    if (cookie && cookie.categories.includes('analytics')) {
      setAnalyticsConsentGiven(true);
      // Initialize ReactGA when consent is given
      if (googleAnalyticsId) {
        (ReactGA as any).default.initialize(googleAnalyticsId);
      }
    } else {
      setAnalyticsConsentGiven(false);
    }
  }, [googleAnalyticsId]);

  useEffect(() => {
    if (!umConsentManagerScriptUrl || !googleAnalyticsId) {
      !googleAnalyticsId && console.warn('Google Analytics ID is not provided, analytics tracking not initialized.');
      !umConsentManagerScriptUrl && console.warn('Consent manager script URL is not provided, analytics tracking not initialized.');
      return;
    }

    const enabledCustomManager = alwaysShow !== false || rootDomain !== '';
    const consentConfig: UmConsentManagerConfig = {
      onConsentChange: handleConsentChange,
      mode: mode,
      customManager: {
        enabled: enabledCustomManager,
        alwaysShow: alwaysShow,
        rootDomain: enabledCustomManager ? rootDomain : false,
        preferencePanel: {
          beforeCategories: false,
          afterCategories: false
        }
      },
      googleAnalyticsCustom: {
        streamConfig: { cookie_flags: 'SameSite=None; Secure' }
      },
      privacyUrl: privacyUrl,
      externalLinkBlank: externalLinkBlank,
      googleAnalyticsID: googleAnalyticsId,
      cookies: {
        necessary: [],
        analytics: [],
      }
    };
    window.umConsentManager = consentConfig;

    const script = document.createElement('script');
    script.src = umConsentManagerScriptUrl;
    script.async = true;
    script.id = 'um-consent-manager-script';

    script.onerror = (error: Event | string) => {
      console.error('Failed to load consent manager script:', error);
    };
    document.head.appendChild(script);

    return () => {
      console.log('Cleaning up ConsentManagerProvider');
      const existingScript = document.getElementById('um-consent-manager-script');
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };

  }, [handleConsentChange, googleAnalyticsId, umConsentManagerScriptUrl, alwaysShow, rootDomain, mode, privacyUrl, externalLinkBlank]);

  const contextValue: AnalyticsConsentContextType = {
    analyticsConsentGiven: analyticsConsentGiven,
    courseIdForEvents: course?.id || null
  };

  return (
    <AnalyticsConsentContext.Provider value={contextValue}>
      {children}
    </AnalyticsConsentContext.Provider>
  );
}
