// components/TawkToChat.tsx
'use client';

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

declare global {
    interface Window {
        Tawk_API?: {
            onLoad?: () => void;
            onStatusChange?: (status: string) => void;
            onChatStarted?: () => void;
            onChatEnded?: () => void;
            onChatMaximized?: () => void;
            onChatMinimized?: () => void;
            onPrechatSubmit?: (data: any) => void;
            onOfflineSubmit?: (data: any) => void;
            showWidget?: () => void;
            hideWidget?: () => void;
            maximize?: () => void;
            minimize?: () => void;
            toggle?: () => void;
            setAttributes?: (attributes: Record<string, any>, callback?: (error: any) => void) => void;
            addTags?: (tags: string[], callback?: (error: any) => void) => void;
            addEvent?: (event: string, metadata?: Record<string, any>, callback?: (error: any) => void) => void;
        };
        Tawk_LoadStart?: Date;
        dataLayer?: any[];
    }
}

interface TawkToChatProps {
    propertyId?: string;
    widgetId?: string;
    // Hide on specific pages
    hiddenRoutes?: string[];
}

export default function TawkToChat({
    propertyId = '6933d367b9834e1979824f5c',
    widgetId = '1jbp73jtn',
    hiddenRoutes = []
}: TawkToChatProps) {
    const pathname = usePathname();

    // Track chat events for analytics
    const trackEvent = useCallback((eventName: string, metadata?: Record<string, any>) => {
        // Google Analytics 4
        if (typeof window !== 'undefined' && window.dataLayer) {
            window.dataLayer.push({
                event: eventName,
                ...metadata
            });
        }

        // Console log for debugging
        console.log(`[Tawk.to Event] ${eventName}`, metadata);
    }, []);

    // Set visitor context
    const setVisitorContext = useCallback(() => {
        if (!window.Tawk_API) return;

        // Add page and device context (use camelCase, no underscores)
        const attributes: Record<string, any> = {
            page: pathname,
            referrer: document.referrer || 'direct',
            device: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
        };

        if (window.Tawk_API.setAttributes) {
            window.Tawk_API.setAttributes(attributes, (error) => {
                if (error) {
                    console.error('[Tawk.to] Error setting attributes:', error);
                } else {
                    console.log('[Tawk.to] Attributes set successfully');
                }
            });
        }

        // Add tags for better organization
        const tags: string[] = [];

        // Tag based on page
        if (pathname.includes('pricing')) tags.push('Viewing Pricing');
        if (pathname.includes('designs')) tags.push('Viewing Designs');
        if (pathname.includes('contact')) tags.push('On Contact Page');

        // Tag based on device
        tags.push(/Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile User' : 'Desktop User');

        if (tags.length > 0 && window.Tawk_API.addTags) {
            window.Tawk_API.addTags(tags, (error) => {
                if (error) {
                    console.error('[Tawk.to] Error adding tags:', error);
                }
            });
        }
    }, [pathname]);

    useEffect(() => {
        // Check if widget should be hidden on current route
        if (hiddenRoutes.some(route => pathname.includes(route))) {
            if (window.Tawk_API?.hideWidget) {
                window.Tawk_API.hideWidget();
            }
            return;
        }

        // Prevent loading if already loaded
        if (window.Tawk_API) {
            setVisitorContext();
            if (window.Tawk_API.showWidget) {
                window.Tawk_API.showWidget();
            }
            return;
        }

        // Initialize Tawk.to
        window.Tawk_API = {} as Window['Tawk_API'];
        window.Tawk_LoadStart = new Date();

        // Event: Widget loaded
        if (window.Tawk_API) {
            window.Tawk_API.onLoad = function () {
                console.log('[Tawk.to] Widget loaded successfully');
                trackEvent('tawk_loaded');
                setVisitorContext();
            };

            // Event: Agent status changed
            window.Tawk_API.onStatusChange = function (status) {
                console.log('[Tawk.to] Status changed:', status);
                trackEvent('tawk_status_change', { status });
            };

            // Event: Chat started
            window.Tawk_API.onChatStarted = function () {
                console.log('[Tawk.to] Chat started');
                trackEvent('tawk_chat_started', {
                    page: pathname,
                    timestamp: new Date().toISOString()
                });
            };

            // Event: Chat ended
            window.Tawk_API.onChatEnded = function () {
                console.log('[Tawk.to] Chat ended');
                trackEvent('tawk_chat_ended', {
                    page: pathname,
                    timestamp: new Date().toISOString()
                });
            };

            // Event: Chat maximized (opened)
            window.Tawk_API.onChatMaximized = function () {
                console.log('[Tawk.to] Chat maximized');
                trackEvent('tawk_chat_opened');
            };

            // Event: Chat minimized (closed)
            window.Tawk_API.onChatMinimized = function () {
                console.log('[Tawk.to] Chat minimized');
                trackEvent('tawk_chat_closed');
            };

            // Event: Pre-chat form submitted
            window.Tawk_API.onPrechatSubmit = function (data) {
                console.log('[Tawk.to] Pre-chat form submitted:', data);
                trackEvent('tawk_prechat_submit', { data });
            };

            // Event: Offline message submitted
            window.Tawk_API.onOfflineSubmit = function (data) {
                console.log('[Tawk.to] Offline message submitted:', data);
                trackEvent('tawk_offline_message', { data });
            };
        }

        // Load the Tawk.to script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
        script.charset = 'UTF-8';
        script.setAttribute('crossorigin', '*');

        // Error handling
        script.onerror = () => {
            console.error('[Tawk.to] Failed to load widget');
            trackEvent('tawk_load_error');
        };

        document.body.appendChild(script);

        // Cleanup on unmount
        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, [propertyId, widgetId, pathname, hiddenRoutes, trackEvent, setVisitorContext]);

    return null;
}

// ============================================
// HELPER HOOK: useTawkTo for programmatic control
// ============================================

export function useTawkTo() {
    const openChat = useCallback(() => {
        if (window.Tawk_API?.maximize) {
            window.Tawk_API.maximize();
        }
    }, []);

    const closeChat = useCallback(() => {
        if (window.Tawk_API?.minimize) {
            window.Tawk_API.minimize();
        }
    }, []);

    const toggleChat = useCallback(() => {
        if (window.Tawk_API?.toggle) {
            window.Tawk_API.toggle();
        }
    }, []);

    const hideWidget = useCallback(() => {
        if (window.Tawk_API?.hideWidget) {
            window.Tawk_API.hideWidget();
        }
    }, []);

    const showWidget = useCallback(() => {
        if (window.Tawk_API?.showWidget) {
            window.Tawk_API.showWidget();
        }
    }, []);

    const setAttributes = useCallback((attributes: Record<string, any>) => {
        if (window.Tawk_API?.setAttributes) {
            window.Tawk_API.setAttributes(attributes, (error) => {
                if (error) console.error('[Tawk.to] Error setting attributes:', error);
            });
        }
    }, []);

    const addEvent = useCallback((eventName: string, metadata?: Record<string, any>) => {
        if (window.Tawk_API?.addEvent) {
            window.Tawk_API.addEvent(eventName, metadata, (error) => {
                if (error) console.error('[Tawk.to] Error adding event:', error);
            });
        }
    }, []);

    return {
        openChat,
        closeChat,
        toggleChat,
        hideWidget,
        showWidget,
        setAttributes,
        addEvent,
        isLoaded: typeof window !== 'undefined' && !!window.Tawk_API
    };
}

// ============================================
// USAGE EXAMPLES
// ============================================

/*
// 1. Basic usage in layout (app/layout.tsx):
import TawkToChat from '@/components/TawkToChat';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <TawkToChat />
      </body>
    </html>
  );
}

// 2. Hide chat on specific pages:
<TawkToChat 
  hiddenRoutes={['/checkout', '/payment', '/admin']}
/>

// 3. Programmatic control in a component:
import { useTawkTo } from '@/components/TawkToChat';

export default function ContactButton() {
  const { openChat, setAttributes } = useTawkTo();
  
  const handleClick = () => {
    setAttributes({
      interest: 'Wooden Houses',
      budget: 'KES 500,000'
    });
    openChat();
  };

  return (
    <button onClick={handleClick}>
      Chat with Us About Wooden Houses
    </button>
  );
}

// 4. Track custom events on pricing page:
import { useTawkTo } from '@/components/TawkToChat';

export default function PricingCard({ houseType, price }) {
  const { openChat, setAttributes, addEvent } = useTawkTo();

  const handleGetQuote = () => {
    // Track which house they're interested in
    addEvent('quote_clicked', {
      house_type: houseType,
      price: price,
      page: 'pricing'
    });

    // Set context for agent
    setAttributes({
      interest: houseType,
      budget: `KES ${price}`,
      stage: 'Quote Requested'
    });

    // Open chat automatically
    openChat();
  };

  return (
    <button onClick={handleGetQuote}>
      Get Quote - {houseType}
    </button>
  );
}
*/