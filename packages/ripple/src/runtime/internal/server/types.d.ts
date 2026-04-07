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
	c: number;
	co: null | Component;
	d: null | Dependency;
	f: number;
	fn: Function;
	v: any;
	ia: boolean;
	aa: AbortController | null;
	ap: PromiseLike<any> | null;
	dr: ((value?: any) => void) | null;
	dj: ((reason?: any) => void) | null;
};

export type Tracked = {
	a: { get?: Function; set?: Function };
	c: number;
	f: number;
	v: any;
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

export type TryBlock = Block & {
	s: {
		p: PendingFunction | null;
		c: CatchFunction | null;
	};
};
