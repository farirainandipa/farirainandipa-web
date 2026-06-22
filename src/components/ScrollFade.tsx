import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { ReactNode } from 'react';

type ScrollFadeProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'left' | 'right' | 'none';
};

export default function ScrollFade({
  children,
  className = '',
  delay = 0,
  direction = 'up'
}: ScrollFadeProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>(0.1, delay);

  const baseClass = 'transition-all duration-700 ease-out';

  let initialTransform = '';
  switch (direction) {
    case 'up':
      initialTransform = 'translate-y-8';
      break;
    case 'left':
      initialTransform = '-translate-x-8';
      break;
    case 'right':
      initialTransform = 'translate-x-8';
      break;
    default:
      initialTransform = '';
  }

  return (
    <div
      ref={ref}
      className={`${baseClass} ${className} ${
        isVisible
          ? 'opacity-100 translate-y-0 translate-x-0'
          : `opacity-0 ${initialTransform}`
      }`}
    >
      {children}
    </div>
  );
}
