import type { Context } from './context.js';

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
	readonly [0]: any;
	[1]: Tracked;
	value: any;
	readonly length: 2;
	[Symbol.iterator](): Iterator<any | Tracked>;
};
