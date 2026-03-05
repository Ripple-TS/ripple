// Re-export estree-jsx types with Ripple augmentations applied.
// Since this file lives inside the ripple package, TypeScript resolves
// '@types/estree-jsx' from ripple's node_modules. Consumers can import from
// 'ripple/types/estree-jsx' to get the full augmented types without needing
// @types/estree-jsx in their own package.json.
//
// The relative import of './index' loads the augmentation declarations
// (declare module 'estree-jsx' { ... }) so the re-exported types include
// Ripple-specific extensions like JSXAttribute.shorthand, etc.
import './index';
export * from 'estree-jsx';
