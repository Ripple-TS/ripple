import type { Context } from './context.js';
import type { OutputInterface, Derived, Tracked } from './index.js';
import type { BlockFunction, CatchFunction, PendingFunction } from './blocks.js';

export { Tracked, Derived };

export type Component = {
	c: null | Map<Context<any>, any>;
	p: null | Component;
};

export type Dependency = {
	c: number;
	t: Tracked | Derived;
	n: null | Dependency;
};

export type Block = {
	co: Component | null;
	f: number;
	fn: BlockFunction;
	o: OutputInterface;
	p: Block | null;
	s: any;
	first: Block | null;
	last: Block | null;
	next: Block | null;
	prev: Block | null;
};

export type TryBlockState = {
	p?: PendingFunction | null;
	c?: CatchFunction | null;
};

export type TryBlock = Block & {
	s: TryBlockState;
};

export type TryBlockWithCatch = TryBlock & {
	s: TryBlockState & { c: CatchFunction };
};

export type TryBlockWithPending = TryBlock & {
	s: TryBlockState & { p: PendingFunction };
};
