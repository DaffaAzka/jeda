import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const baseProps = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
  strokeWidth: "1.8",
  viewBox: "0 0 24 24",
};

export function CheckIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

export function CloseIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}

export function HeartIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <path d="M12 21l-7.5-7.5C2.5 11.5 2.5 8 4.5 6s5.5-.5 7.5 2c2-2.5 5.5-4 7.5-2s2 5.5 0 7.5L12 21z" />
    </svg>
  );
}

export function SproutIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <path d="M12 22V10M12 10C12 5 7 4 4 5c0 5 4 8 8 5zm0 0c0-5 5-6 8-5 0 5-4 8-8 5z" />
    </svg>
  );
}

export function WindIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <path d="M3 8h12a3 3 0 0 0 0-6H14M2 13h16a3 3 0 0 1 0 6H17M4 18h7a2 2 0 0 0 0-4H10" />
    </svg>
  );
}

export function BulbIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <path d="M9 18h6M10 22h4M9 14h6m-3-12a7 7 0 0 0-4 12v2h8v-2a7 7 0 0 0-4-12z" />
    </svg>
  );
}

export function PencilIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <path d="M17 3l4 4L7 21H3v-4L17 3z" />
    </svg>
  );
}

export function SparkleIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <path d="M12 2v20M2 12h20M6 6l12 12M6 18L18 6" />
    </svg>
  );
}

export function TargetIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 3v2m0 14v2M3 12h2m14 0h2" />
    </svg>
  );
}

export function ThoughtIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <path d="M4 15h14a3 3 0 0 0 3-3 4 4 0 0 0-4-4 5 5 0 0 0-9-1 4 4 0 0 0-4 4 3 3 0 0 0 0 4zm4 4h.01M6 21h.01" />
    </svg>
  );
}

export function EyeIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function HandIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <path d="M18 11V6a2 2 0 0 0-4 0v4m-3-6a2 2 0 0 0-4 0v7m-3-4a2 2 0 0 0-4 0v8a9 9 0 0 0 9 9h3a7 7 0 0 0 7-7v-6a2 2 0 0 0-4 0" />
    </svg>
  );
}

export function EarIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <path d="M6 10a6 6 0 1 1 12 0c0 4-3 6-4 8a3 3 0 0 1-5-2m3-6a2 2 0 0 1 2 2c0 2-2 3-2 3" />
    </svg>
  );
}

export function NoseIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <path d="M8 3v11a4 4 0 0 0 4 4 4 4 0 0 0 4-4M6 18h3m6 0h3" />
    </svg>
  );
}

export function TasteIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <path d="M4 10a8 8 0 0 0 16 0H4zm5 4v3a3 3 0 0 0 6 0v-3" />
    </svg>
  );
}

export function PhoneIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <path d="M5 3h4l2 5-3 2a13 13 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2C10 21 3 14 3 5a2 2 0 0 1 2-2z" />
    </svg>
  );
}

export function PinIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
    </svg>
  );
}

export function WarningIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <path d="M12 3l10 18H2L12 3zm0 7v5m0 3h.01" />
    </svg>
  );
}

export function InfoIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <rect x="3" y="3" width="18" height="18" />
      <path d="M12 8h.01M12 12v5" />
    </svg>
  );
}

export function MoonIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export function CoffeeIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3m4-3v3m4-3v3" />
    </svg>
  );
}

export function ChartBarIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <path d="M4 20V10h4v10zm6 0V4h4v16zm6 0v-7h4v7z" />
    </svg>
  );
}

export function TrendUpIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <path d="M3 17l6-6 4 4 8-8m0 0h-5m5 0v5" />
    </svg>
  );
}

export function ArrowRightIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <path d="M5 12h14m-6-6l6 6-6 6" />
    </svg>
  );
}

export function CopyIcon({ className = "size-4", ...props }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} {...baseProps} {...props}>
      <rect x="8" y="8" width="13" height="13" />
      <path d="M4 16H3V3h13v1" />
    </svg>
  );
}
