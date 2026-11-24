---
name: Ivory Atelier
description: "Superior Salon. A light-filled couture salon: ivory walls, warm cream linen, deep ink type, one champagne line of brass."
colors:
  ivory: "#FBF8F3"
  linen: "#F3EDE4"
  ink: "#2B2724"
  taupe: "#675E55"
  bronze: "#7A5D3C"
  porcelain: "#FFFFFF"
  champagne: "#8F7048"
  seam: "#E3D9CB"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(2.25rem, 4vw + 1rem, 4rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  heading:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(1.75rem, 2vw + 1rem, 2.5rem)"
    fontWeight: 400
    lineHeight: 1.15
  subhead:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1.25
  body:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  sm: "2px"
  md: "2px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.bronze}"
    textColor: "{colors.porcelain}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "12px 32px"
    height: "52px"
  button-secondary:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "12px 32px"
    height: "52px"
---

# Design System: Ivory Atelier

## Overview

**Creative North Star: "The Atelier at Ten in the Morning."**

A couture salon in soft daylight: ivory walls, cream linen, a brass mirror frame, deep ink
type. The page is calm, airy and easy to read. Luxury comes from space, a fine serif and one
quiet champagne line, never from decoration.

**Key Characteristics:**

- Ivory and linen grounds, deep ink text, one bronze for action, champagne for fine lines.
- Fraunces at 400 for every heading, Instrument Sans for reading text.
- Near-square corners (2px). Hairline champagne rules; generous white space.
- No glow, no gradients, no heavy shadows.

## Colors

### Primary

- **Bronze** (#7A5D3C): primary buttons, links, the banner. It means "book / call / go".

### Tertiary

- **Champagne** (#8F7048): the accent. Hairlines, section marks, focus rings, hover edges.

### Neutral

- **Ivory** (#FBF8F3): the page.
- **Linen** (#F3EDE4): alternate bands and cards.
- **Ink** (#2B2724): headings and body text.
- **Taupe** (#675E55): captions, trust lines, labels.
- **Porcelain** (#FFFFFF): text on Bronze.
- **Seam** (#E3D9CB): hairline dividers only.

### Named Rules

**The One Line of Brass Rule.** Champagne appears as thin lines and small marks only, never
as a fill behind text.

## Typography

**Display Font:** Fraunces (400, high optical size)
**Body Font:** Instrument Sans

### Hierarchy

- **Display** (400, clamp(2.25rem, 4vw + 1rem, 4rem), 1.05): the hero heading only.
- **Headline** (400, clamp(1.75rem, 2vw + 1rem, 2.5rem), 1.15): section headings.
- **Title** (400, 24px, 1.25): card and column titles.
- **Body** (400, 18px, 1.65): reading text, capped at 68ch.

## Layout

Layout belongs to the platform. Every block is full width; only the columns block splits.

## Elevation & Depth

Flat. Depth comes from the two light grounds and hairlines, never from heavy shadows.

## Shapes

Radius 2px. Photos are plain rectangles. Dividers are 1px Seam hairlines; section marks are a
short champagne rule.

## Components

### Buttons

- **Primary:** Bronze fill, Porcelain label in tracked small caps, 52px tall.
- **Secondary:** transparent with a 1px Ink border; hover fills with Linen.
- **Focus:** a 2px Champagne ring with a 2px offset.

## Do's and Don'ts

### Do:

- **Do** keep Ivory (#FBF8F3) as the ground for most of every page.
- **Do** keep Bronze (#7A5D3C) for things a visitor can press.
- **Do** leave room: white space is the luxury.

### Don't:

- **Don't** put text on Champagne.
- **Don't** add glow, gradients or drop shadows to text.
- **Don't** use more than one serif weight on a page.
