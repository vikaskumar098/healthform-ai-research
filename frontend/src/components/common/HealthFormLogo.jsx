import React from 'react';
import fullLogoWebp from '../../assets/healthform-logo.webp';
import fullLogoPng from '../../assets/healthform-logo.png';
import iconWebp from '../../assets/healthform-icon.webp';
import iconPng from '../../assets/healthform-icon.png';

/**
 * HealthFormLogo — Centralized source of truth for the official HealthForm AI brand asset.
 * 
 * Props:
 * - variant: 'default' | 'compact' | 'iconOnly' (default: 'default')
 * - size: 'sm' | 'md' | 'lg' | 'xl' | string (default: 'md')
 * - className: string (additional styling/classes)
 * - alt: string (default: 'HealthForm AI')
 */

const SIZE_PRESETS = {
  // Height in pixels / tailwind classes
  sm: {
    full: 'h-6',        // 24px
    icon: 'h-6 w-6',
  },
  md: {
    full: 'h-8 sm:h-9', // 32px - 36px (standard navbar height)
    icon: 'h-8 w-8 sm:h-9 sm:w-9',
  },
  lg: {
    full: 'h-11 sm:h-12', // 44px - 48px (auth screens)
    icon: 'h-11 w-11 sm:h-12 sm:w-12',
  },
  xl: {
    full: 'h-14 sm:h-16', // 56px - 64px
    icon: 'h-14 w-14 sm:h-16 sm:w-16',
  },
};

export const HealthFormLogo = ({
  variant = 'default',
  size = 'md',
  className = '',
  alt = 'HealthForm AI',
  priority = true,
}) => {
  const isIconOnly = variant === 'iconOnly';
  const isCompact = variant === 'compact';

  const sizeClass = SIZE_PRESETS[size] 
    ? (isIconOnly ? SIZE_PRESETS[size].icon : SIZE_PRESETS[size].full)
    : (typeof size === 'string' ? size : 'h-8');

  // If iconOnly, render the exact blue rounded-square ECG icon
  if (isIconOnly) {
    return (
      <picture className={`inline-flex items-center flex-shrink-0 select-none ${className}`}>
        <source srcSet={iconWebp} type="image/webp" />
        <img
          src={iconPng}
          alt={alt}
          className={`${sizeClass} w-auto object-contain transition-transform duration-200`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          draggable="false"
        />
      </picture>
    );
  }

  // If compact, we can show full logo on sm+ and icon on mobile, or compact sizing
  if (isCompact) {
    return (
      <picture className={`inline-flex items-center flex-shrink-0 select-none ${className}`}>
        {/* On very small mobile screens (< 400px), optionally swap to icon if space is constrained */}
        <source media="(max-width: 380px)" srcSet={iconWebp} type="image/webp" />
        <source media="(max-width: 380px)" srcSet={iconPng} type="image/png" />
        <source srcSet={fullLogoWebp} type="image/webp" />
        <img
          src={fullLogoPng}
          alt={alt}
          className={`${sizeClass} w-auto object-contain transition-transform duration-200`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          draggable="false"
        />
      </picture>
    );
  }

  // Default: Full official HealthForm AI brand logo [Icon + HealthForm + AI]
  return (
    <picture className={`inline-flex items-center flex-shrink-0 select-none ${className}`}>
      <source srcSet={fullLogoWebp} type="image/webp" />
      <img
        src={fullLogoPng}
        alt={alt}
        className={`${sizeClass} w-auto object-contain transition-transform duration-200`}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        draggable="false"
      />
    </picture>
  );
};

export default HealthFormLogo;
