// Re-export acorn types with Ripple augmentations applied.
// Since this file lives inside the ripple package, TypeScript resolves
// '@types/acorn' from ripple's node_modules. Consumers can import from
// 'ripple/types/acorn' to get the full augmented types without needing
// @types/acorn in their own package.json.
//
// The relative import of './parser' loads the augmentation declarations
// (declare module 'acorn' { ... }) so the re-exported types include
// Ripple-specific nodes like Component, Element, TrackedExpression, etc.
import './parser.d.ts';
export * from 'acorn';
