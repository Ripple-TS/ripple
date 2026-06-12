import { Context, track, type Tracked } from 'ripple';

// Balanced binary tree: depth D=10 → 1024 leaves, 2047 components.
//
// Two harness measurements:
//   __updateRoot()    — mutates the root context; ALL 1024 leaves re-read.
//   __updatePartial() — mutates state on a single mid-node at depth M=5; only
//                       leaves in that subtree (2^(D-M) = 32) re-read.

const D = 10;
const M = 5;
const MID_PATH = 'L'.repeat(M);

// Context holds the TRACKED OBJECT itself (a Tracked<number>), not the scalar.
// Descendants do `Ctx.get()` to retrieve the Tracked, then read `.value` to
// subscribe via the runtime's get_tracked() dependency hook. Default is null
// — leaves outside the Mid subtree never get a LocalCtx provider, so Leaf
// must null-check before reading `.value`.
const RootCtx = new Context<Tracked<number> | null>(null);
const LocalCtx = new Context<Tracked<number> | null>(null);

let _bumpRoot: any = null;
let _bumpLocal: any = null;
export function bumpRoot() { if (_bumpRoot) _bumpRoot(); }
export function bumpPartial() { if (_bumpLocal) _bumpLocal(); }

function Mid(props) @{
  // track() requires an active block — create inside the component body and
  // share the *reference* via Context so descendants subscribe to writes.
  const localT = track(0);
  LocalCtx.set(localT);
  _bumpLocal = () => { localT.value += 1; };
  <div class='mid'>
    <Node depth={props.depth - 1} path={props.path + 'L'} />
    <Node depth={props.depth - 1} path={props.path + 'R'} />
  </div>
}

function Node(props) @{
  if (props.depth > 0) {
    if (props.path === MID_PATH) {
      <Mid depth={props.depth} path={props.path} />
    } else {
      <div class='n'>
        <Node depth={props.depth - 1} path={props.path + 'L'} />
        <Node depth={props.depth - 1} path={props.path + 'R'} />
      </div>
    }
  } else {
    <Leaf path={props.path} />
  }
}

function Leaf(props) @{
  const rootT = RootCtx.get();
  const localT = LocalCtx.get();
  // Reading `.value` inside the template invokes the getter → get_tracked() →
  // registers this leaf as a dependency. Non-Mid leaves get null for localT
  // and harmlessly fall back to 0 (they don't subscribe to anything local).
  <span class='leaf'>{props.path + '|' + (rootT ? rootT.value : 0) + ':' + (localT ? localT.value : 0)}</span>
}

export default function App(props) @{
  const rootT = track(0);
  RootCtx.set(rootT);
  _bumpRoot = () => { rootT.value += 1; };
  <Node depth={props.depth} path={''} />
}
