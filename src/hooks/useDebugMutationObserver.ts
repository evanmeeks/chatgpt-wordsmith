import { useEffect, useCallback, useContext, useRef } from 'react';
import { debounce } from 'lodash';
import { DebugContext } from '../context/DebugContext';

interface DebugMutationObserverOptions {
  targetSelector: string;
  attributeFilter?: string[];
  debounceTime?: number;
  logToConsole?: boolean;
  logToService?: boolean;
  logToStorage?: boolean;
  serviceUrl?: string;
  trackUserEvents?: boolean;
  userEventTypes?: string[];
}

interface UserEvent {
  type: string;
  target: string;
  timestamp: number;
}

const useDebugMutationObserver = (options: DebugMutationObserverOptions) => {
  const { isDebugEnabled } = useContext(DebugContext);
  const observerRef = useRef<MutationObserver | null>(null);
  const recentUserEventsRef = useRef<UserEvent[]>([]);
  const isInitializedRef = useRef(false);

  const logToStorage = useCallback(
    (logData: any) => {
      if (!isDebugEnabled) return;
      chrome.storage.local.get(['debugLogs'], (result) => {
        const logs = result.debugLogs || [];
        logs.push({ timestamp: new Date().toISOString(), ...logData });
        chrome.storage.local.set({ debugLogs: logs });
      });
    },
    [isDebugEnabled],
  );

  const handleUserEvent = useCallback(
    (event: Event) => {
      if (!isDebugEnabled) return;
      const userEvent: UserEvent = {
        type: event.type,
        target: describeDOMElement(event.target as Element),
        timestamp: Date.now(),
      };
      recentUserEventsRef.current = [
        ...recentUserEventsRef.current,
        userEvent,
      ].filter((e) => e.timestamp > Date.now() - 5000);

      if (options.logToConsole) {
        console.log('User Event:', userEvent);
        logToStorage({ type: 'UserEvent', event: userEvent });
      }
    },
    [isDebugEnabled, options.logToConsole, logToStorage],
  );

  const handleMutations = useCallback(
    (mutations: MutationRecord[]) => {
      if (!isDebugEnabled) return;
      const timestamp = Date.now();
      const relevantEvents = recentUserEventsRef.current.filter(
        (e) => e.timestamp > timestamp - (options.debounceTime ?? 1000) - 100,
      );
      const logs = mutations
        .map((mutation) => formatMutation(mutation, relevantEvents))
        .filter((log): log is string => log !== undefined); // Filter out any undefined logs

      if (options.logToConsole && logs.length > 0) {
        console.group(`Mutations for ${options.targetSelector}`);
        if (relevantEvents.length > 0) {
          console.log('Associated User Events:', relevantEvents);
        }
        logs.forEach((log) => console.log(log));
        console.groupEnd();
        logToStorage({
          type: 'Mutations',
          targetSelector: options.targetSelector,
          mutations: logs,
          associatedEvents: relevantEvents,
        });
      }

      if (options.logToService && logs.length > 0) {
        sendLogsToService(logs, relevantEvents);
      }
    },
    [isDebugEnabled, options, logToStorage],
  );

  useEffect(() => {
    const setupObserver = () => {
      if (!isDebugEnabled || isInitializedRef.current) return;

      const target = document.querySelector(options.targetSelector);
      if (!target) {
        console.warn(`Target element not found: ${options.targetSelector}`);
        return;
      }

      if (!observerRef.current) {
        observerRef.current = new MutationObserver(
          debounce(handleMutations, options.debounceTime ?? 1000),
        );
      }

      observerRef.current.observe(target, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
        attributeOldValue: true,
        characterDataOldValue: true,
        attributeFilter: options.attributeFilter,
      });

      if (options.trackUserEvents) {
        options.userEventTypes?.forEach((eventType) => {
          document.addEventListener(eventType, handleUserEvent, true);
        });
      }

      isInitializedRef.current = true;
      console.log(`Started observing: ${options.targetSelector}`);
      logToStorage({
        type: 'ObserverStart',
        targetSelector: options.targetSelector,
      });
    };

    const cleanupObserver = () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (options.trackUserEvents) {
        options.userEventTypes?.forEach((eventType) => {
          document.removeEventListener(eventType, handleUserEvent, true);
        });
      }
      isInitializedRef.current = false;
      console.log(`Stopped observing: ${options.targetSelector}`);
      logToStorage({
        type: 'ObserverStop',
        targetSelector: options.targetSelector,
      });
    };

    setupObserver();

    return cleanupObserver;
  }, [isDebugEnabled, options, handleMutations, handleUserEvent, logToStorage]);

  return null;
};

function describeDOMElement(element: Element): string {
  if (!element) return 'Unknown Element';
  const tagName = element.tagName;
  const id = element.id ? `#${element.id}` : '';
  if (!element.classList) return `${tagName}${id}`;
  const classes = Array.from(element?.classList)
    .map((c) => `.${c}`)
    .join('');
  return `${tagName}${id}${classes}`;
}

function formatMutation(
  mutation: MutationRecord,
  relevantEvents: UserEvent[],
): string | undefined {
  const target = describeDOMElement(mutation.target as Element);
  let details = '';

  switch (mutation.type) {
    case 'childList':
      details = `Added nodes: ${mutation.addedNodes.length}, Removed nodes: ${mutation.removedNodes.length}`;
      break;
    case 'attributes':
      details = `Changed attribute: ${mutation.attributeName}, New value: ${(mutation.target as Element).getAttribute(mutation.attributeName ?? '')}`;
      break;
    case 'characterData':
      details = `New text: ${mutation.target.textContent}`;
      break;
    default:
      return undefined; // Skip unknown mutation types
  }

  return `${mutation.type} mutation on ${target}: ${details}`;
}

async function sendLogsToService(
  logs: string[] | undefined,
  events: UserEvent[],
) {
  // Implementation depends on your logging service
  console.log('Sending logs to service:', { logs, events });
}

export default useDebugMutationObserver;
