import './Avatar.css';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Generate a consistent color based on a string (name)
 */
function stringToColor(str: string): string {
  const colors = [
    '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
    '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a',
    '#cddc39', '#ffc107', '#ff9800', '#ff5722', '#795548',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Get initials from a name (up to 2 characters)
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({ name, src, size = 'medium', className = '' }: AvatarProps) {
  const initials = getInitials(name);
  const backgroundColor = stringToColor(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`avatar avatar-${size} ${className}`}
        onError={(e) => {
          // Hide broken image and show initials fallback
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) {
            fallback.style.display = 'flex';
          }
        }}
      />
    );
  }

  return (
    <div
      className={`avatar avatar-${size} avatar-initials ${className}`}
      style={{ backgroundColor }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
