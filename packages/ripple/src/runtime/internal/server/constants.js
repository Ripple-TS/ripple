export var ROOT_BLOCK = 1 << 1;
export var REGULAR_BLOCK = 1 << 2;
export var TRY_CATCH_BLOCK = 1 << 3;
export var TRY_PENDING_BLOCK = 1 << 4;
export var COMPONENT_BLOCK = 1 << 5;
export var TRY_BLOCK = TRY_CATCH_BLOCK | TRY_PENDING_BLOCK;
export var CAUGHT_ERROR = 1 << 6;
