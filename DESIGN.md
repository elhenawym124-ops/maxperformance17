---
name: Academy Stage 3D — Glazier Colorfield Partition System
description: Architectural steel-mullioned frosted limestone and backlit stained-glass UI system for Arabic-first STEM & entrepreneurship academies.
colors:
  primary: "#0a3380"
  primary-deep: "#072661"
  accent: "#9e1f63"
  accent-deep: "#7f174f"
  amber: "#e5b72f"
  emerald: "#2bb673"
  cyan: "#29a8df"
  mullion: "#111827"
  neutral-ground: "#efece6"
  neutral-clear: "#f7f5f0"
  neutral-frosted: "#e6e2da"
  ink: "#111827"
  ink-muted: "#334155"
  chamber: "#0b1120"
  white: "#f8fafc"
typography:
  display:
    fontFamily: "Alexandria, IBM Plex Sans Arabic, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 700
    lineHeight: 1.28
    letterSpacing: "0em"
  body:
    fontFamily: "IBM Plex Sans Arabic, Cairo, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "0em"
  mono:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0em"
rounded:
  none: "0px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "40px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
  button-primary-hover:
    backgroundColor: "{colors.accent-deep}"
  button-secondary:
    backgroundColor: "{colors.neutral-clear}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "16px 20px"
  tab-active:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    padding: "16px"
---

## Overview

**Creative North Star: "Glazier Colorfield Partition Wall"**

Built cleanly on warm frosted limestone glass partitioned by matte steel glazing bars, where content stays quiet at rest and active tracks illuminate from behind with saturated Cobalt, Berry Magenta, Amber, and Emerald light. Zero floating cards, zero blurred SaaS boxes, and zero corner radii unify landing storytelling, interactive lab simulation, and registration paths under one daylight architectural facade.

**Key Characteristics:**

- **Structural Glazing Chassis:** Uniform `2px` matte dark structural glazing bars (`#111827`) separate flush cells across full-width containers (`max-w-7xl`), with zero box-shadows and strict `0px` radii.
- **Selective Stained-Glass Illumination:** Most cells rest in frosted limestone (`#efece6`) or calm clear glass (`#f7f5f0`), reserving full Cobalt (`#0a3380`), Berry (`#9e1f63`), Amber (`#e5b72f`), Cyan (`#29a8df`), and Emerald (`#2bb673`) strictly for interactive selection state, primary actions, and vertical pier anchors.
- **RTL Arabic Discipline:** Display copy uses self-hosted geometric Arabic `Alexandria` (`leading-[1.28]` to `1.38`), body uses `IBM Plex Sans Arabic`, and numeric codes/levels wrap explicitly in LTR `<bdi dir="ltr">` with `IBM Plex Mono` (`tabular-nums`).

## Colors

**The Restraint-Through-Pigment Rule.** Reserve primary stained-glass saturation exclusively for backlit interactive controls, active stage bays, the vertical hero pier divider, and the primary booking bar; keep reading copy planes on neutral limestone `#efece6` (`ink #111827`).

**The Contrast-by-Light Rule.** White ink (`#f8fafc`) sits exclusively on Cobalt (`#0a3380`), Berry (`#9e1f63`), and the darkroom Chamber (`#0b1120`); dark charcoal ink (`#111827`) is mandatory on Amber (`#e5b72f`), Emerald (`#2bb673`), Cyan (`#29a8df`), and frosted neutrals.

## Typography

**The Balanced Display Rule.** Every headline under `.glazier-heading` uses `Alexandria` (`400–800`) with `letter-spacing: 0` and `text-wrap: balance` to prevent single-word Arabic orphans and protect tall Arabic diacritics (`leading-[1.38]` on mobile viewports).

**The Tabular Telemetry Rule.** Level ranges (`01–15`, `LVL 06–11`), cohort caps (`8–10`), ages (`6–17`), and promo codes (`EARLY10`) render inside `<bdi dir="ltr">` using `IBM Plex Mono` (`font-variant-numeric: tabular-nums`) anchored to the RTL inline start edge.

## Layout

**The Mullion Flush Grid Rule.** Avoid `gap-*` spacing between architectural bays; separate adjacent horizontal and vertical compartments strictly through structural borders (`border-block-start`, `border-block-end`, `border-inline-start`, `border-inline-end` at `2px`). On xl desktop viewports, `.glazier-xl-x` closes the outer perimeter.

On `390px` viewports, multi-column architectural bays collapse smoothly into stacked horizontal steel rows while interactive age/mode tab groups preserve horizontal tactile access (`min-h-[54px]`+ tap targets, zero horizontal overflow).

## Elevation & Depth

**The Plane-Over-Shadow Rule.** Depth comes from translucency contrast (`glazier-seeded` subtle radial refraction vs backlit stained glass inner luminosity and hardware macro plates), never via blurred elevation drop-shadows or rounded borders.

## Shapes

Every button, navigation bay, photo frame, tab tile, input control, and card adheres to sharp `0px` architectural corners (`border-radius: 0px`) bounded cleanly inside dark glazing mullions.

## Components

- **Flush Steel Header (`AcademyStageHeader`):** Edge-to-edge top strip partitioned between brand frame cell, rectangular clear/Cobalt nav panes, and full-height Berry booking pane (`min-h-[54px]`).
- **Stained-Glass Hero Pier & Age Track Grid (`Academy3DWaveHero`):** `6 / 1 / 5` desktop split joining display copy + interactive 3-tab age switcher (`6–9`, `10–13`, `14–17`) with a `1`-col Cobalt/Amber/Berry vertical pier strip alongside hardware studio imagery (`microbit-kit.jpg`) and dual telemetry bays.
- **Curriculum Partition Corridor (`AcademyStoryStage`):** Horizontal interactive 4-pane illuminated progression (`LVL 01–04` Emerald through `LVL 12–15` Cobalt) paired with live practical code preview darkroom cell and `arduino-uno.jpg` Proof Bay.
- **Darkroom Optical Chamber (`AcademyInteractiveLab`):** Steel-mullioned `#0b1120` Canvas chamber paired beside frosted interactive controls (`PictoBlox AI` Classifier & `Python` Physics simulation).
- **Ground-Floor Partition Footer (`AcademyStageFooter`):** Multi-bay daytime footer capped beneath a backlit Cobalt copyright sill.

## Do's and Don'ts

- **Do** anchor all pure numeric ranges (`01–15`, `8–10`, `6–17`) inside `<bdi dir="ltr">` within `items-start` RTL flex parents.
- **Do** keep `headingFont` leading with an Arabic-capable family (`Alexandria`, `IBM Plex Sans Arabic`) and self-host local WOFF2 assets in CSS.
- **Don't** place kickers/eyebrows above section headings, add gradient text spans, use SVG noise filters (`feTurbulence`), or add floating e-commerce shipping bars/rounded pills over `academy-stage-3d`.
