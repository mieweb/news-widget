import { Avatar as MieAvatar } from '@mieweb/ui';

/** Map legacy size names to @mieweb/ui Avatar sizes */
const SIZE_MAP = {
  small: 'sm',
  medium: 'md',
  large: 'lg',
} as const;

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function Avatar({ name, src, size = 'medium', className = '' }: AvatarProps) {
  return (
    <MieAvatar
      name={name}
      src={src}
      size={SIZE_MAP[size]}
      className={className}
      aria-label={name}
    />
  );
}
