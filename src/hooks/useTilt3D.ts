'use client';

import { useRef, useState, useCallback, CSSProperties } from 'react';

export interface Tilt3DOptions {
  maxTilt?: number;        // Maximum tilt angle in degrees (default: 15)
  perspective?: number;    // CSS perspective value in px (default: 1000)
  scale?: number;          // Scale on hover (default: 1.02)
  speed?: number;          // Transition speed in ms (default: 300)
  glare?: boolean;         // Enable glare effect (default: false)
  glareOpacity?: number;   // Maximum glare opacity (default: 0.2)
  disabled?: boolean;      // Disable the tilt effect (default: false)
}

export interface Tilt3DReturn {
  ref: React.RefObject<HTMLDivElement | null>;
  style: CSSProperties;
  onMouseEnter: () => void;
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: () => void;
  glareStyle: CSSProperties;
}

/**
 * Custom hook for 3D tilt effect based on mouse movement
 *
 * @example
 * ```tsx
 * const tilt = useTilt3D({ maxTilt: 20, glare: true });
 *
 * <div ref={tilt.ref} style={tilt.style} {...tilt}>
 *   <div style={tilt.glareStyle} />
 *   Content
 * </div>
 * ```
 */
export function useTilt3D(options: Tilt3DOptions = {}): Tilt3DReturn {
  const {
    maxTilt = 15,
    perspective = 1000,
    scale = 1.02,
    speed = 300,
    glare = false,
    glareOpacity = 0.2,
    disabled = false,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [transform, setTransform] = useState({
    rotateX: 0,
    rotateY: 0,
    glareX: 50,
    glareY: 50,
    glareOpacity: 0,
  });

  const onMouseEnter = useCallback(() => {
    if (disabled) return;
    setIsHovered(true);
  }, [disabled]);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !ref.current) return;

      const rect = ref.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Calculate mouse position relative to element center
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate tilt angles (-maxTilt to +maxTilt)
      const rotateY = ((mouseX / width) - 0.5) * 2 * maxTilt;
      const rotateX = ((mouseY / height) - 0.5) * -2 * maxTilt;

      // Calculate glare position (percentage)
      const glareX = (mouseX / width) * 100;
      const glareY = (mouseY / height) * 100;

      setTransform({
        rotateX,
        rotateY,
        glareX,
        glareY,
        glareOpacity: glare ? glareOpacity : 0,
      });
    },
    [disabled, maxTilt, glare, glareOpacity]
  );

  const onMouseLeave = useCallback(() => {
    if (disabled) return;
    setIsHovered(false);
    setTransform({
      rotateX: 0,
      rotateY: 0,
      glareX: 50,
      glareY: 50,
      glareOpacity: 0,
    });
  }, [disabled]);

  const style: CSSProperties = {
    transform: isHovered && !disabled
      ? `perspective(${perspective}px) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg) scale(${scale})`
      : `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`,
    transition: `transform ${speed}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
    transformStyle: 'preserve-3d',
    willChange: 'transform',
  };

  const glareStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: 'inherit',
    background: `radial-gradient(circle at ${transform.glareX}% ${transform.glareY}%, rgba(255, 255, 255, ${transform.glareOpacity}), transparent 60%)`,
    pointerEvents: 'none',
    transition: `opacity ${speed}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
    opacity: isHovered && glare ? 1 : 0,
    willChange: 'opacity',
  };

  return {
    ref,
    style,
    onMouseEnter,
    onMouseMove,
    onMouseLeave,
    glareStyle,
  };
}
