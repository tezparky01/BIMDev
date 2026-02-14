# Clipping Plane Rotation Guide

## Overview
The clipping planes in this BIM viewer application **already support rotation** through built-in ThatOpen Components functionality. This guide explains how to use the rotation feature.

## Built-in Rotation Controls

### What's Already Implemented
The ThatOpen Components `SimplePlane` class (used by the `Clipper` component) comes with built-in `TransformControls` from Three.js. This means:

✅ **Rotation is already available** - No additional code needed  
✅ **Translation (moving) is already available**  
✅ **Scaling is already available**  

### How to Rotate Clipping Planes

When you create a clipping plane using any of these buttons:
- **New Plane** - Camera-oriented plane
- **X Plane** - X-axis perpendicular plane
- **Y Plane** - Y-axis perpendicular plane (horizontal in BIM convention)
- **Z Plane** - Z-axis perpendicular plane (vertical in BIM convention)

The plane will appear with **interactive transform controls** (gizmos) that allow you to:

1. **ROTATE** - Click and drag the curved arc handles around the plane
   - Red arc: Rotate around X-axis
   - Green arc: Rotate around Y-axis
   - Blue arc: Rotate around Z-axis

2. **TRANSLATE** - Click and drag the arrow handles to move the plane
   - Red arrow: Move along X-axis
   - Green arrow: Move along Y-axis
   - Blue arrow: Move along Z-axis

3. **SCALE** - Use the corner handles to resize the plane visualization

### API Details

The rotation functionality comes from ThatOpen Components:

```typescript
// Internally, when you create a plane:
const clipper = components.get(OBC.Clipper);
const plane = clipper.create(world);

// The plane has built-in transform controls:
// plane.controls - TransformControls instance
// plane.draggingStarted - Event fired when user starts dragging
// plane.draggingEnded - Event fired when user finishes dragging
```

### Transform Control Modes

The SimplePlane's TransformControls support three modes:
- **'translate'** - Move the plane (default)
- **'rotate'** - Rotate the plane around its center
- **'scale'** - Resize the plane visualization

The controls automatically switch between modes based on which handle you grab.

## How to Use Clipping Planes

### Step-by-Step Guide

1. **Create a Clipping Plane**
   - Expand the "Visibility" section in the toolbar
   - Click one of the plane creation buttons:
     - "New Plane" for camera-oriented
     - "X/Y/Z Plane" for axis-aligned

2. **The plane appears with transform gizmos**
   - You'll see colored handles (red, green, blue)
   - These handles allow manipulation

3. **Rotate the Plane**
   - Look for the curved arc handles (rotation gizmos)
   - Click and drag any arc to rotate around that axis
   - The model will be clipped according to the new orientation

4. **Move the Plane**
   - Click and drag the straight arrow handles
   - The plane will translate along the selected axis

5. **Toggle Visibility**
   - Click "Toggle Planes" to hide/show all planes without deleting them
   - Useful for temporarily viewing the full model

6. **Delete Planes**
   - Click "Clear Planes" to remove all clipping planes
   - Or click individual delete buttons in the Clipper panel (if available)

## Advanced Usage

### Programmatic Rotation

If you need to rotate a plane programmatically (for custom UI or automation):

```typescript
import * as THREE from "three";

// Get the clipper component
const clipper = components.get(OBC.Clipper);

// Get a specific plane (e.g., the first one)
const planes = clipper.list;
if (planes.length > 0) {
  const plane = planes[0];
  
  // Access the underlying THREE.Plane
  // Rotate by changing the normal vector
  const newNormal = new THREE.Vector3(0.707, 0.707, 0); // 45° between X and Y
  newNormal.normalize();
  plane.helper.plane.normal.copy(newNormal);
  
  // Or use the transform controls
  const controls = plane.controls;
  controls.setMode('rotate'); // Switch to rotation mode
}
```

### Rotation Events

You can listen to rotation events:

```typescript
const plane = clipper.create(world);

plane.draggingStarted.on(() => {
  console.log("User started manipulating the plane");
});

plane.draggingEnded.on(() => {
  console.log("User finished manipulating the plane");
  // You can read the final orientation here
  console.log("Plane normal:", plane.helper.plane.normal);
});
```

## Technical Details

### Coordinate System
The application uses the **IFC/BIM coordinate convention**:
- **X-axis** (Red): Horizontal, left-right
- **Y-axis** (Green): Horizontal, front-back  
- **Z-axis** (Blue): Vertical, up-down

### Normal Vectors
A clipping plane is defined by a **normal vector** (perpendicular to the plane surface) and a **coplanar point** (any point on the plane).

Example normals:
- `(1, 0, 0)` - X-plane (perpendicular to X-axis)
- `(0, 1, 0)` - Y-plane (perpendicular to Y-axis)
- `(0, 0, 1)` - Z-plane (perpendicular to Z-axis, vertical)

When you rotate a plane, you're changing its normal vector.

### ThatOpen Components Integration

The rotation feature is part of the official ThatOpen Components library:
- Package: `@thatopen/components` v3.1.x
- Class: `SimplePlane`
- Property: `controls` (TransformControls instance)
- Base: Three.js TransformControls

## Troubleshooting

### Q: I don't see rotation handles
**A:** Make sure:
- The plane is selected (click on it)
- Planes visibility is enabled (not toggled off)
- You're using a compatible version of @thatopen/components

### Q: Rotation feels imprecise
**A:** 
- Try zooming the camera closer to the plane
- Use keyboard modifiers (if supported) for constrained rotation
- Consider axis-aligned planes (X/Y/Z buttons) for precise orientations

### Q: Can I rotate multiple planes at once?
**A:** No, transform controls work on one plane at a time. You must:
1. Rotate the first plane
2. Select the second plane
3. Rotate the second plane
4. Repeat for each plane

## References

- [ThatOpen Components Documentation](https://docs.thatopen.com/)
- [SimplePlane API Reference](https://docs.thatopen.com/api/@thatopen/components/classes/SimplePlane)
- [Clipper API Reference](https://docs.thatopen.com/api/@thatopen/components/classes/Clipper)
- [Three.js TransformControls](https://threejs.org/docs/#examples/en/controls/TransformControls)

## Summary

**The rotation capability already exists in the application!** 

No additional implementation is needed. Simply:
1. Create a clipping plane
2. Use the curved arc handles (gizmos) to rotate it
3. The plane will clip the model according to its new orientation

The rotation feature is part of the core ThatOpen Components library and is automatically available on all clipping planes created through the toolbar.
