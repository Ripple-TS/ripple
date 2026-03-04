// Re-export estree types with Ripple augmentations applied.
// Since this file lives inside the ripple package, TypeScript resolves
// '@types/estree' from ripple's node_modules. Consumers can import from
// 'ripple/types/estree' to get the full augmented types without needing
// @types/estree in their own package.json.
//
// The relative import of './index' loads the augmentation declarations
// (declare module 'estree' { ... }) so the re-exported types include
// Ripple-specific nodes like Component, Element, TrackedExpression, etc.
import './index';
export * from 'estree';
