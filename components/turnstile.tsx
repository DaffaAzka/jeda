"use client";

import { useEffect, useRef } from "react";

interface TurnstileProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

/**
 * Cloudflare Turnstile anti-bot verification widget.
 * If NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY is not defined, this component renders nothing.
 */
export function Turnstile({ onSuccess, onError, onExpire }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) {
      return;
    }

    let isMounted = true;

    function renderWidget() {
      if (!window.turnstile || !containerRef.current || !isMounted) return;
      if (widgetIdRef.current) return;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey!,
        theme: "auto",
        callback: (token: string) => {
          if (isMounted) onSuccess(token);
        },
        "error-callback": () => {
          if (isMounted && onError) onError();
        },
        "expired-callback": () => {
          if (isMounted && onExpire) onExpire();
        },
      });
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      const existingScript = document.querySelector(
        'script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]',
      );

      if (!existingScript) {
        const script = document.createElement("script");
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback";
        script.async = true;
        script.defer = true;
        window.onloadTurnstileCallback = () => {
          renderWidget();
        };
        document.head.appendChild(script);
      } else {
        const prevOnload = window.onloadTurnstileCallback;
        window.onloadTurnstileCallback = () => {
          if (prevOnload) prevOnload();
          renderWidget();
        };
      }
    }

    return () => {
      isMounted = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore cleanup errors on unmount
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onSuccess, onError, onExpire]);

  if (!siteKey) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="my-3 flex justify-center min-h-[65px]"
    />
  );
}
