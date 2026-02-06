# BIM Viewer Toolbar Usage Guide

## Overview
The BIM viewer toolbar is located at the bottom of the viewer container and features expandable sections for better organization and space efficiency.

## Expandable Sections
The toolbar has three main sections:
1. **Visibility** - Control model visibility and clipping planes
2. **Selection** - Focus, hide, isolate, and colorize elements
3. **Measurement** - Create length and area measurements

## How to Use

### Expanding/Collapsing Sections
- Each section has a **chevron button** (▼) on the left
- Click the chevron to **expand** that section and show all tools
- The chevron rotates 180° when the section is expanded
- **Only one section can be expanded at a time** - expanding a new section automatically collapses others
- Click the chevron again to **collapse** the section

### Visibility Section Tools
When expanded, shows:
- **Show All** - Unhide all hidden elements
- **Toggle Ghost** - Make entire model semi-transparent (ghosted)
- **New Plane** - Create camera-oriented clipping plane
- **X Plane** - Create clipping plane perpendicular to X-axis
- **Y Plane** - Create clipping plane perpendicular to Y-axis (horizontal)
- **Z Plane** - Create clipping plane perpendicular to Z-axis (vertical)
- **Toggle Planes** - Show/hide all clipping planes
- **Clear Planes** - Delete all clipping planes

### Selection Section Tools
When expanded, shows:
- **Focus** - Zoom camera to selected elements
- **Hide** - Hide selected elements
- **Isolate** - Hide everything except selected elements
- **Colorize** - Apply custom color to selected elements

### Measurement Section Tools
When expanded, shows:
- **Length Measurement** - Measure distances between points
- **Area Measurement** - Measure surface areas
- **Delete All Measurements** - Remove all measurements

## Clipping Plane Orientations
The clipping planes follow **BIM/IFC conventions**:
- **X-axis** (1, 0, 0) - Side-to-side vertical planes
- **Y-axis** (0, 1, 0) - Front-to-back horizontal planes
- **Z-axis** (0, 0, 1) - Top-to-bottom vertical planes (UP direction)

### Manipulating Clipping Planes
Once created, clipping planes have built-in transform controls:
- **Move** - Click and drag the plane to reposition
- **Rotate** - Use the rotation gizmo to change plane angle
- **Scale** - Adjust plane size using the scale handles

## Design Features
- **No scroll bar** - Sections expand horizontally instead of scrolling
- **No screen blur** - Screen remains clear when selecting tools
- **Smooth animations** - Tools fade in/out when expanding/collapsing
- **Visual separation** - Sections have borders for clear organization

## Tips
- Keep sections collapsed when not in use to maximize viewer space
- Use keyboard shortcuts (if available) for frequently used tools
- The toolbar can be made floating by double-clicking (if enabled)
- Clipping planes are powerful for examining building interiors
