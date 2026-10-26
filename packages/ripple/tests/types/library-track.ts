import type { Tracked } from 'ripple';
import { create_library_value } from '../client/library-value.js';

const count: Tracked<number> = create_library_value(0);
count.value = 1;
const numeric: number = count.value;
// @ts-expect-error The tracked value's type is preserved on assignment.
count.value = '1';
// @ts-expect-error Reads retain the numeric type.
const text: string = count.value;

const callback = (value: number) => value + 1;
const stored = create_library_value(callback);
const result: number = stored.value(1);
// @ts-expect-error Functions are stored as values, not invoked as computations.
const computed: number = stored.value;

void numeric;
void text;
void result;
void computed;
