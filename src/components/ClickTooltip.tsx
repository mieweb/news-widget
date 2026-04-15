import { Tooltip } from '@mieweb/ui';

interface ClickTooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function ClickTooltip({ content, children, className = '', ariaLabel }: ClickTooltipProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      (e.target as HTMLElement).click();
    }
  };

  return (
    <Tooltip content={content} placement="top">
      <span
        className={className}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
      >
        {children}
      </span>
    </Tooltip>
  );
}
