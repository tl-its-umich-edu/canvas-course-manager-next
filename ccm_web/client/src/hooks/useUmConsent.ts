import { useEffect } from "react";

// Types necessary for the U-M consent manager object
// See https://vpcomm.umich.edu/resources/cookie-disclosure/ under Banner Integration 
// Define base cookie type with required name field
interface BaseCookie {
    name: string;  // Required: The name of the cookie
}
// Extended cookie type with optional domain and regex
interface ExtendedCookie extends BaseCookie {
    domain?: string;  // Optional: The domain the cookie is set to
    regex?: string;   // Optional: Regular expression for auto-deletion matching
}
type UmConsentManager = {
    mode: 'prod' | 'dev',
    customManager: {
        enabled: boolean,
        alwaysShow: boolean,
        rootDomain: boolean | string,
        preferencePanel: {
            beforeCategories: boolean | string,
            afterCategories: boolean | string
        }
    },
    privacyUrl: string,
    onConsentChange: (({ cookie }: { cookie: string }) => void) | undefined,
    googleAnalyticsID: boolean | string
    cookies: {
        necessary: (BaseCookie | ExtendedCookie)[],
        analytics: (BaseCookie | ExtendedCookie)[]
    }
}
declare global {
    interface Window {
      umConsentManager: UmConsentManager
    }
};

// Utility function to append script to document head
const appendScript = (srcUrl: string, nonce?: string) => {
    const scriptElement = document.createElement('script');
    scriptElement.src = srcUrl;
    if (nonce) {
        scriptElement.nonce = nonce;
    }
    document.head.appendChild(scriptElement);
}

// Parameters needed for returned umConsentInitialize function
export type InitializeConsentManagerParams = {
    developmentMode?: boolean,
    alwaysShow?: boolean,
    privacyUrl?: string,
    rootDomain?: string,
    googleAnalyticsID?: string,
    onConsentApprove?: () => void,
    onConsentReject?: () => void,
}

export function useUmConsent(params: InitializeConsentManagerParams) : void {
    const umConsentSrcUrl = 'https://umich.edu/apis/umconsentmanager/consentmanager.js'
    useEffect(() => {
        console.log('params', params)
        console.log('useUmConsent hook called, effect runs')
        let onConsentChange;
        if (params.onConsentApprove !== undefined && params.onConsentReject !== undefined) {
            onConsentChange = ({ cookie }: { cookie: any }) => {
                if (cookie.categories.includes('analytics') ) {
                    params.onConsentApprove!()
                } else {
                    params.onConsentReject!()
                }
            }
        }
        const customManagerEnabled = (params.alwaysShow || params.rootDomain) ? true : false
        window.umConsentManager = {
            mode: params.developmentMode ? 'dev' : 'prod',
            customManager: {
                enabled: customManagerEnabled, 
                alwaysShow: params.alwaysShow ?? false,
                rootDomain: params.rootDomain ?? false,
                preferencePanel: {
                    beforeCategories: false,
                    afterCategories: false
                }
            },
            privacyUrl: params.privacyUrl ?? '',
            onConsentChange,
            googleAnalyticsID: params.googleAnalyticsID ?? false,
            cookies: {
                necessary: [],
                analytics: []
            }
        }
        appendScript(umConsentSrcUrl)

        return () => {
            const scriptElements = document.querySelectorAll(`script[src="${umConsentSrcUrl}"]`);
            scriptElements.forEach(script => script.parentNode?.removeChild(script));
        };
    },[params]);
}