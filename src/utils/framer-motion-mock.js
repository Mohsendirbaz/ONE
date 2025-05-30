// Mock implementation of framer-motion to avoid build issues
import React from 'react';

// Motion components - return regular divs
export const motion = new Proxy({}, {
  get: (target, prop) => {
    // Return a component that just renders the element without animations
    return React.forwardRef(({ children, ...props }, ref) => {
      // Remove motion-specific props
      const {
        initial, animate, exit, transition, variants, whileHover, whileTap, 
        whileDrag, whileFocus, whileInView, drag, dragConstraints, dragElastic,
        onAnimationComplete, layout, layoutId, ...htmlProps
      } = props;
      
      return React.createElement(prop, { ...htmlProps, ref }, children);
    });
  }
});

// AnimatePresence - just render children
export const AnimatePresence = ({ children }) => children;

// useAnimation hook
export const useAnimation = () => {
  return {
    start: () => Promise.resolve(),
    stop: () => {},
    set: () => {}
  };
};

// useMotionValue hook
export const useMotionValue = (initial) => {
  return {
    get: () => initial,
    set: () => {},
    onChange: () => () => {},
    destroy: () => {}
  };
};

// useTransform hook
export const useTransform = (value, input, output) => {
  return useMotionValue(output?.[0] || 0);
};

// useSpring hook
export const useSpring = (value) => value;

// useViewportScroll hook
export const useViewportScroll = () => ({
  scrollX: useMotionValue(0),
  scrollY: useMotionValue(0),
  scrollXProgress: useMotionValue(0),
  scrollYProgress: useMotionValue(0)
});

// useScroll hook
export const useScroll = () => useViewportScroll();

// animate function
export const animate = () => ({
  stop: () => {}
});

// Common variants
export const AnimateSharedLayout = ({ children }) => children;
export const LayoutGroup = ({ children }) => children;
export const LazyMotion = ({ children }) => children;
export const domAnimation = {};
export const domMax = {};
export const m = motion;