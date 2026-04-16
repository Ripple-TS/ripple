import type { Context } from './context.js';
import type { OutputInterface } from './index.js';
import type { BlockFunction, CatchFunction, PendingFunction } from './blocks.js';

export type Component = {
	c: null | Map<Context<any>, any>;
	p: null | Component;
};

export type Dependency = {
	c: number;
	t: Tracked | Derived;
	n: null | Dependency;
};

export type Derived = {
	a: { get?: Function; set?: Function };
	b: Block;
	c: number;
	co: null | Component;
	d: null | Dependency;
	f: number;
	fn: Function;
	v: any;
	readonly [0]: any;
	[1]: Derived;
	value: any;
	readonly length: 2;
	[Symbol.iterator](): Iterator<any | Derived>;
};

export type Tracked = {
	a: { get?: Function; set?: Function };
	c: number;
	f: number;
	v: any;
	aa: AbortController | null;
	ap: PromiseLike<any> | null;
	readonly [0]: any;
	[1]: Tracked;
	value: any;
	readonly length: 2;
	[Symbol.iterator](): Iterator<any | Tracked>;
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
