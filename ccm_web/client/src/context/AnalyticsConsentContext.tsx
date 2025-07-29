import { createContext } from 'react';

export interface AnalyticsConsentContextType {
    analyticsConsentGiven: boolean | null;
    courseIdForEvents: number | null;
}

export const AnalyticsConsentContext = createContext<AnalyticsConsentContextType | undefined>(undefined);
