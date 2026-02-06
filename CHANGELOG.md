# Changelog - ThatOpen Compatibility Updates

## [2024-02-06] - Sectioning Tools Implementation

### Added

#### Clipper Component for Model Sectioning
- **New File**: `src/bim-components/setup/src/clipper.ts`
  - Initializes ThatOpen Clipper component for creating sectioning planes
  - Enables users to slice through 3D BIM models to inspect interiors
  - Implements double-click interaction for creating clipping planes at cursor position
  - Adds Delete key support for removing clipping planes
  - Uses singleton pattern to prevent memory leaks from duplicate event listeners
  - Comprehensive JSDoc documentation for future developers

#### Enhanced User Interface
- **Updated**: `src/ui-templates/containers/viewport-toolbar.ts`
  - Added new "Sectioning" toolbar section with 4 action buttons:
    1. **Create Plane** - Manually create a clipping plane at cursor
    2. **Delete Plane** - Remove the clipping plane under cursor
    3. **Toggle Planes** - Show/hide all clipping planes
    4. **Delete All** - Remove all clipping planes from the scene
  - Uses Material Design Icons for consistent UI
  - Integrates seamlessly with existing Visibility and Selection toolbars

#### Component Integration Updates
- **Updated**: `src/bim-components/setup/index.ts`
  - Modified `setupComponents()` to initialize clipper component
  - Now returns `world` object for proper component interaction
  
- **Updated**: `src/bim-components/setup/src/index.ts`
  - Added export for `setupClipper` function
  
- **Updated**: `src/bim-components/setup/src/create-world.ts`
  - Ensured Raycaster is properly initialized for clipper interaction
  
- **Updated**: `src/react-components/ProjectDetailsPage.tsx`
  - Modified to handle `world` parameter from `setupComponents()`

### User Features

#### Keyboard Shortcuts
- **Delete** - Remove clipping plane at cursor position (when clipper is enabled)

#### Mouse Interactions
- **Double-Click** - Create a new clipping plane at the clicked position on a model

### Technical Details

#### ThatOpen Components Compatibility
- ✅ Fully compatible with ThatOpen v3.1.0
- ✅ Uses modern `components.get()` pattern (no deprecated APIs)
- ✅ Proper Raycaster integration for plane creation
- ✅ Fragment and World management follows best practices

#### Code Quality
- ✅ Zero security vulnerabilities (CodeQL scan passed)
- ✅ Memory leak prevention with singleton pattern
- ✅ Accessibility improvements (removed Backspace key to avoid navigation conflicts)
- ✅ Comprehensive documentation and comments

### Migration Notes

This update is **fully backward compatible**. No changes required to existing code.

The clipper functionality is automatically initialized when `setupComponents()` is called.

### Dependencies

No new dependencies added. Uses existing packages:
- `@thatopen/components` ~3.1.0
- `@thatopen/components-front` ~3.1.0
- `@thatopen/fragments` ~3.1.0
- `@thatopen/ui` ~3.1.0

### Usage Example

```typescript
// Clipper is automatically initialized in setupComponents()
const { components, viewport, world } = await setupComponents();

// Users can then:
// 1. Double-click on a model to create a clipping plane
// 2. Press Delete to remove a clipping plane
// 3. Use toolbar buttons to manage planes
```

### Known Limitations

- Clipping planes are created at the point of intersection with the model
- Requires a model to be loaded before clipping planes can be created
- Delete key only works when clipper is enabled

### Future Enhancements

Potential future improvements:
- Add configurable plane size and opacity controls
- Support for saving/loading clipping plane configurations
- Multiple plane presets (top, side, front views)
- Plane manipulation handles for fine-tuning position
