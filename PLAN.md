# Performance & UX Smoothness Optimization Plan

## Overview
Optimize the Cursive marketing site for smooth, premium feel by fixing animations, reducing layout shifts, and improving loading performance. **Primary focus: Homepage**, then other key pages.

---

## Phase 1: Critical Performance Fixes (Homepage Priority)

### 1.1 Consolidate Demo Component Timers
**Problem:** Multiple `setInterval` calls causing performance issues
- `DemoVisitorTracking`: 3 separate intervals (1800ms, 400ms, 600ms)
- `DemoPipelineDashboard`: 4 separate intervals (30ms each)
- `DemoIntentHeatmap`: 1 interval but with infinite animations

**Files to modify:**
- `marketing/components/homepage/demo-visitor-tracking.tsx`
- `marketing/components/homepage/demo-pipeline-dashboard.tsx`
- `marketing/components/homepage/demo-intent-heatmap.tsx`

**Solution:**
- Consolidate all intervals into single `useEffect` per component
- Use single timer ticking at fastest needed rate
- Add proper cleanup on unmount
- Use `useRef` to track mounted state to prevent memory leaks

### 1.2 Lazy Load Hidden Demo Components
**Problem:** All 12 demo components initialize and run animations even when hidden

**Files to modify:**
- `marketing/components/human-home-page.tsx` (lines 189-207)

**Solution:**
- Implement lazy mounting: only initialize active demo component
- Use `useMemo` or conditional rendering to prevent hidden demos from running
- Keep demo state but defer animation initialization until component is active
- Add fade-in animation when demo becomes visible

### 1.3 Fix Number Animation Jitter (Stats Counter)
**Problem:** Scale animation on numbers causes layout shift (lines 149-151, 166-168)

**Files to modify:**
- `marketing/components/human-home-page.tsx`

**Solution:**
- Remove `scale` animation from number updates
- Use `tabular-nums` font feature for consistent width
- Animate only color change: `#007AFF` → `#111827`
- Add `font-variant-numeric: tabular-nums` to CSS
- Optionally use `motion.span` with `layoutId` for smoother transitions

### 1.4 Optimize Demo Switching Animation
**Problem:** 150ms transition too fast, feels abrupt (lines 197-207)

**Files to modify:**
- `marketing/components/human-home-page.tsx`

**Solution:**
- Increase duration to 300ms for smoother transition
- Add slight y-axis movement: `initial={{ opacity: 0, y: 10 }}`
- Use `mode="wait"` with better easing: `ease: [0.22, 1, 0.36, 1]`
- Add `min-height` to demo container to prevent layout shift

---

## Phase 2: Layout Shift Elimination

### 2.1 Add Fixed Dimensions to All Images
**Problem:** Images load without reserved space, causing CLS

**Files to modify:**
- `marketing/components/homepage/customer-logos.tsx` (lines 34-51)
- `marketing/components/homepage/integrations-showcase.tsx` (lines 71-94)
- `marketing/components/human-home-page.tsx` (dashboard previews)

**Solution:**
- Add explicit `width` and `height` props to all `Image` components
- Use `blurDataURL` for placeholder images
- Ensure `sizes` attribute matches actual rendered size
- Convert `<img>` tags to Next.js `Image` component

### 2.2 Fix FAQ Accordion Height Animation
**Problem:** No height animation, just display toggle (line 142)

**Files to modify:**
- `marketing/components/homepage/faq-section.tsx` (lines 129-151)

**Solution:**
- Remove `display: isOpen ? 'block' : 'none'`
- Implement proper height animation with Framer Motion:
  ```typescript
  <motion.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: "auto", opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
  >
  ```
- Add `overflow: hidden` to prevent content overflow during animation

### 2.3 Add Min-Height to Demo Content Container
**Problem:** Different demos have different heights, causing layout shift

**Files to modify:**
- `marketing/components/human-home-page.tsx` (lines 189-210)

**Solution:**
- Calculate tallest demo component height
- Add `min-height` to demo content wrapper
- Use `h-[400px] md:h-[500px]` or similar fixed height
- Ensure all demos fit within this height or scroll internally

### 2.4 Fix Hero Feature Pills Layout Shift
**Problem:** Pills resize when active state changes (font-weight difference)

**Files to modify:**
- `marketing/components/human-home-page.tsx` (lines 135-154)

**Solution:**
- Set fixed width for pill buttons or use `min-width`
- Ensure font-weight doesn't affect width (use `box-sizing: border-box`)
- Consider using `font-weight: 500` for all states instead of mixing normal/medium

---

## Phase 3: Animation Timing Standardization

### 3.1 Standardize Stagger Delays Across Sections
**Problem:** Inconsistent delays (0.03s, 0.05s, 0.1s) across different sections

**Files to modify:**
- `marketing/components/homepage/competitive-advantages-section.tsx`
- `marketing/components/homepage/core-features-section.tsx`
- `marketing/components/homepage/proven-results-section.tsx`
- All other sections with staggered animations

**Solution:**
- Set standard stagger delay: `0.05s` for all sections
- Use constant: `const STAGGER_DELAY = 0.05`
- Ensure child animations are `0.3s` duration with `ease: [0.22, 1, 0.36, 1]`

### 3.2 Adjust Hero Section Animation Timing
**Problem:** Uneven timing creates visual jank (lines 67-86)

**Files to modify:**
- `marketing/components/human-home-page.tsx`

**Solution:**
- Synchronize eyebrow, heading, and demo animations
- Use consistent duration: `0.4s` for all hero elements
- Stagger with `0.1s` delays instead of mixed timings
- Example:
  - Eyebrow: `delay: 0s, duration: 0.4s`
  - Heading: `delay: 0.1s, duration: 0.4s`
  - Demo: `delay: 0.2s, duration: 0.4s`

### 3.3 Optimize How It Works Carousel Animation
**Problem:** Aggressive slide animation (x: 100px) feels harsh

**Files to modify:**
- `marketing/components/homepage/how-it-works-section.tsx` (lines 156-161)

**Solution:**
- Reduce slide distance: `x: 100` → `x: 40`
- Keep opacity fade but make it subtle: `opacity: 0.3` → `opacity: 1` (instead of 0 → 1)
- Adjust auto-play interval: 5000ms → 6000ms for less frequent transitions
- Add `ease: [0.22, 1, 0.36, 1]` for smoother easing

### 3.4 Standardize Button Hover Effects
**Problem:** Inconsistent scaling (1.2 vs 1.05) across buttons

**Files to modify:**
- `marketing/components/homepage/how-it-works-section.tsx` (lines 202-240)
- All other sections with button hover effects

**Solution:**
- Use consistent hover scale: `1.05` for all buttons
- Use consistent tap scale: `0.95` for all buttons
- Add transition: `type: "spring", stiffness: 400, damping: 25`

---

## Phase 4: WhileInView Optimization

### 4.1 Adjust Viewport Margins for Consistent Triggering
**Problem:** `-100px` margin triggers animations too early on mobile

**Files to modify:**
- `marketing/components/homepage/competitive-advantages-section.tsx`
- `marketing/components/homepage/core-features-section.tsx`
- `marketing/components/homepage/faq-section.tsx`
- All sections using `whileInView`

**Solution:**
- Change margin from `-100px` to `-50px` for better timing
- Use responsive margins: `-50px` mobile, `-100px` desktop
- Ensure `once: true` is set to prevent re-triggering on scroll up

### 4.2 Remove FAQ Animation Timing Issue
**Problem:** FAQ items animate before entering viewport (margin: -100px at line 99-108)

**Files to modify:**
- `marketing/components/homepage/faq-section.tsx`

**Solution:**
- Reduce margin to `-20px` for FAQs (closer to viewport entry)
- Adjust animation to be faster: `duration: 0.2s` instead of 0.3s
- This creates snappier feel for FAQ expansion

---

## Phase 5: Infinite Animation Cleanup

### 5.1 Optimize Intent Heatmap Pulsing Rings
**Problem:** 16 infinite animations can cause jank

**Files to modify:**
- `marketing/components/homepage/demo-intent-heatmap.tsx` (lines 144-155)

**Solution:**
- Reduce number of pulsing rings from 2 per marker to 1
- Increase animation duration: 2s → 3s for less frequent updates
- Use `will-change: transform, opacity` CSS hint
- Add condition: only animate when demo is visible

### 5.2 Add Cleanup for All Infinite Animations
**Problem:** No cleanup on unmount, potential memory leaks

**Files to modify:**
- All demo components with infinite animations

**Solution:**
- Add `useEffect` cleanup functions
- Use `useRef` to track mounted state
- Stop animations when component unmounts or becomes inactive
- Example:
  ```typescript
  useEffect(() => {
    isMounted.current = true
    return () => { isMounted.current = false }
  }, [])
  ```

---

## Phase 6: Counter Animation Optimization

### 6.1 Replace setInterval Counters with useSpring or Reduce Frequency
**Problem:** 4 counters updating at 30ms intervals = heavy JS workload

**Files to modify:**
- `marketing/components/homepage/demo-pipeline-dashboard.tsx` (lines 23-43)

**Solution:**
- **Option A (Preferred):** Use Framer Motion's `useSpring` hook:
  ```typescript
  const animatedValue = useSpring(targetValue, { stiffness: 50, damping: 20 })
  ```
- **Option B:** Reduce update frequency to 60ms (still smooth, half the work)
- Use single interval for all 4 counters instead of separate intervals
- Add `will-change: contents` CSS hint

### 6.2 Optimize Visitor Tracking Counter Animation
**Problem:** Counter ticks every 600ms with scale animation (jitter)

**Files to modify:**
- `marketing/components/homepage/demo-visitor-tracking.tsx`

**Solution:**
- Remove scale animation from counter
- Use only color animation like main stats
- Add `tabular-nums` for consistent width
- Reduce tick frequency to 1000ms for less visual noise

---

## Phase 7: Image Loading Optimization

### 7.1 Add Priority Loading to Above-Fold Images
**Problem:** Hero images load without priority

**Files to modify:**
- `marketing/components/human-home-page.tsx` (hero demo preview)
- `marketing/components/homepage/customer-logos.tsx`

**Solution:**
- Add `priority` prop to above-fold `Image` components
- Use `loading="eager"` for critical images
- Ensure hero images have `priority={true}`

### 7.2 Implement Blur Placeholders for Integration Logos
**Problem:** Integration logos pop in without placeholder

**Files to modify:**
- `marketing/components/homepage/integrations-showcase.tsx`

**Solution:**
- Convert `<img>` to Next.js `Image` component
- Add `placeholder="blur"` with `blurDataURL`
- Or use simple background color placeholder
- Ensure `sizes` attribute is accurate

### 7.3 Optimize Dashboard Preview Image Loading
**Problem:** No dimensions specified for dashboard screenshots

**Files to modify:**
- All components with dashboard/screenshot images

**Solution:**
- Add explicit dimensions to all screenshots
- Use `fill` with proper `sizes` attribute
- Add aspect ratio wrapper: `aspect-[16/9]` or similar
- Consider lazy loading for below-fold screenshots

---

## Phase 8: Additional Performance Improvements

### 8.1 Add Loading States for Demo Components
**Problem:** Demos render immediately without loading state

**Files to modify:**
- `marketing/components/human-home-page.tsx`

**Solution:**
- Add skeleton loader for demo content during switch
- Show loading state for first 200ms of demo initialization
- Prevents flash of empty content

### 8.2 Implement Scroll Performance Optimizations
**Problem:** Multiple scroll listeners may cause jank

**Files to modify:**
- Check all components for scroll listeners
- Look for parallax or scroll-based animations

**Solution:**
- Use `passive: true` for scroll event listeners
- Throttle scroll handlers to max 60fps (16.67ms)
- Use `IntersectionObserver` instead of scroll listeners where possible
- Framer Motion's `whileInView` already uses IntersectionObserver ✓

### 8.3 Add CSS Performance Hints
**Problem:** No will-change hints for animated elements

**Files to modify:**
- Global CSS or component-specific styles

**Solution:**
- Add `will-change: transform` to elements with motion animations
- Add `transform: translateZ(0)` to force GPU acceleration
- Use `contain: layout` for self-contained components
- Example in Tailwind: Add custom utilities

---

## Phase 9: Testing & Validation

### 9.1 Performance Testing Checklist
- [ ] Run Lighthouse audit on homepage (target: 90+ performance score)
- [ ] Check CLS score (target: < 0.1)
- [ ] Verify FCP < 1.5s (First Contentful Paint)
- [ ] Verify LCP < 2.5s (Largest Contentful Paint)
- [ ] Test on mobile devices (actual hardware)
- [ ] Test on slow 3G throttling
- [ ] Profile with Chrome DevTools Performance tab

### 9.2 Animation Smoothness Testing
- [ ] Verify all demos run at 60fps (check DevTools FPS meter)
- [ ] Test demo switching feels smooth (300ms transition)
- [ ] Verify no layout shifts when switching features
- [ ] Test FAQ accordion expands smoothly
- [ ] Verify carousel transitions feel natural
- [ ] Test hover effects are consistent across all buttons
- [ ] Check infinite animations don't cause jank

### 9.3 Cross-Browser Testing
- [ ] Chrome (primary)
- [ ] Safari (Mac & iOS)
- [ ] Firefox
- [ ] Edge
- [ ] Mobile Safari (iOS)
- [ ] Chrome Android

---

## Implementation Order (Priority)

### **CRITICAL (Do First):**
1. ✅ Consolidate demo component timers (1.1)
2. ✅ Lazy load hidden demos (1.2)
3. ✅ Fix number animation jitter (1.3)
4. ✅ Optimize demo switching (1.4)
5. ✅ Fix FAQ accordion animation (2.2)

### **HIGH (Next):**
6. ✅ Add image dimensions (2.1)
7. ✅ Standardize stagger delays (3.1)
8. ✅ Fix hero animation timing (3.2)
9. ✅ Add min-height to demo container (2.3)
10. ✅ Optimize counter animations (6.1, 6.2)

### **MEDIUM:**
11. ✅ Adjust viewport margins (4.1, 4.2)
12. ✅ Optimize carousel animation (3.3)
13. ✅ Standardize button hovers (3.4)
14. ✅ Fix feature pills layout (2.4)
15. ✅ Add priority image loading (7.1)

### **LOW (Polish):**
16. ✅ Infinite animation cleanup (5.1, 5.2)
17. ✅ Image placeholder optimization (7.2, 7.3)
18. ✅ CSS performance hints (8.3)
19. ✅ Loading states for demos (8.1)
20. ✅ Final performance testing (9.1, 9.2, 9.3)

---

## Expected Outcomes

### Performance Metrics:
- **Lighthouse Performance Score:** 85+ → 95+
- **CLS (Cumulative Layout Shift):** 0.2+ → < 0.05
- **FPS during animations:** 45-50fps → 60fps
- **Time to Interactive:** 3s → 2s
- **Bundle size impact:** Minimal (code optimization, not bloat)

### UX Improvements:
- ✅ Smooth, consistent animations across all sections
- ✅ No layout shifts during page load or interactions
- ✅ Premium feel with coordinated motion
- ✅ Fast, responsive interactions (< 100ms perceived delay)
- ✅ Stable, predictable behavior

### Technical Improvements:
- ✅ Reduced timer intervals from 10+ to 3-4
- ✅ Eliminated unnecessary re-renders
- ✅ Proper cleanup preventing memory leaks
- ✅ GPU-accelerated animations
- ✅ Optimized image loading

---

## Git Workflow

### Commit Strategy:
- Commit after each phase is complete
- Use conventional commit messages:
  - `perf: consolidate demo component timers`
  - `fix: remove layout shift from number animations`
  - `style: standardize animation timing across sections`
  - `refactor: optimize image loading with proper dimensions`

### Branch:
- **Push to:** `main` (as specified - marketing site only)
- **No feature branch** since this is marketing site improvements

### Final Push:
- After all phases complete and tested
- Push all commits to `main`
- Verify Vercel deployment succeeds
- Test live site for performance improvements

---

## Notes

- **Focus:** 80% of effort on homepage, 20% on other pages
- **Philosophy:** Smooth, premium feel over flashy effects
- **Principle:** Reduce motion complexity, increase motion quality
- **Testing:** Real device testing is critical (not just DevTools)
- **Rollback plan:** Each phase is independent, can revert individually if needed

---

**Estimated Time:** 3-4 hours for full implementation + testing
**Risk Level:** Low (mostly animation tuning, no breaking changes)
**Impact:** High (significantly improves perceived performance and premium feel)
