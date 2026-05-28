import { track } from 'ripple';

// Return statement components for hydration testing

// Basic return - skips content after direct return
export function DirectReturn() {
	return <>
		<div class="before">{'before'}</div>
		return;
		<div class="after">{'after'}</div>
	</>;
}

// Conditional return - condition is true, skips rest
export function ConditionalReturnTrue() {
	return <>
		let condition = true;
		if (condition) {
			<div class="guard">{'guard hit'}</div>
			return;
		}
		<div class="rest">{'rest'}</div>
	</>;
}

// Conditional return - condition is false, shows rest
export function ConditionalReturnFalse() {
	return <>
		let condition = false;
		if (condition) {
			<div class="guard">{'guard hit'}</div>
			return;
		}
		<div class="rest">{'rest'}</div>
	</>;
}

// Content before and after return guard
export function ContentBeforeAfterReturn() {
	return <>
		let shouldReturn = true;
		<div class="before">{'before'}</div>
		if (shouldReturn) {
			<div class="guard">{'guard'}</div>
			return;
		}
		<div class="after">{'after'}</div>
	</>;
}

// Multiple elements after guard when condition is false
export function MultipleElementsAfterGuard() {
	return <>
		let shouldReturn = false;
		if (shouldReturn) {
			<div class="guard">{'guard'}</div>
			return;
		}
		<div class="first">{'first'}</div>
		<div class="second">{'second'}</div>
	</>;
}

// Multiple sequential returns - first hits
export function MultipleReturnsFirstHits() {
	return <>
		let a = true;
		let b = true;
		if (a) {
			<div class="first">{'first guard'}</div>
			return;
		}
		if (b) {
			<div class="second">{'second guard'}</div>
			return;
		}
		<div class="rest">{'rest'}</div>
	</>;
}

// Multiple sequential returns - second hits
export function MultipleReturnsSecondHits() {
	return <>
		let a = false;
		let b = true;
		if (a) {
			<div class="first">{'first guard'}</div>
			return;
		}
		if (b) {
			<div class="second">{'second guard'}</div>
			return;
		}
		<div class="rest">{'rest'}</div>
	</>;
}

// Multiple sequential returns - none hit
export function MultipleReturnsNoneHit() {
	return <>
		let a = false;
		let b = false;
		if (a) {
			<div class="first">{'first guard'}</div>
			return;
		}
		if (b) {
			<div class="second">{'second guard'}</div>
			return;
		}
		<div class="rest">{'rest'}</div>
	</>;
}

// Nested returns - both conditions true
export function NestedReturnsAllTrue() {
	return <>
		let a = true;
		let b = true;
		if (a) {
			<div class="a">{'a is true'}</div>
			if (b) {
				<div class="b">{'b is true'}</div>
				return;
			}
		}
		<div class="rest">{'rest'}</div>
	</>;
}

// Nested returns - inner condition false
export function NestedReturnsInnerFalse() {
	return <>
		let a = true;
		let b = false;
		if (a) {
			<div class="a">{'a is true'}</div>
			if (b) {
				<div class="b">{'b is true'}</div>
				return;
			}
		}
		<div class="rest">{'rest'}</div>
	</>;
}

// Nested returns - outer condition false
export function NestedReturnsOuterFalse() {
	return <>
		let a = false;
		let b = true;
		if (a) {
			<div class="a">{'a is true'}</div>
			if (b) {
				<div class="b">{'b is true'}</div>
				return;
			}
		}
		<div class="rest">{'rest'}</div>
	</>;
}

// Deeply nested returns (3 levels) - all true
export function DeeplyNestedReturnsAllTrue() {
	return <>
		let a = true;
		let b = true;
		let c = true;
		if (a) {
			<div class="a">{'a'}</div>
			if (b) {
				<div class="b">{'b'}</div>
				if (c) {
					<div class="c">{'c'}</div>
					return;
				}
			}
		}
		<div class="rest">{'rest'}</div>
	</>;
}

// Deeply nested returns (3 levels) - innermost false
export function DeeplyNestedReturnsInnermostFalse() {
	return <>
		let a = true;
		let b = true;
		let c = false;
		if (a) {
			<div class="a">{'a'}</div>
			if (b) {
				<div class="b">{'b'}</div>
				if (c) {
					<div class="c">{'c'}</div>
					return;
				}
			}
		}
		<div class="rest">{'rest'}</div>
	</>;
}

// Return with else-if chain - first condition
export function ElseIfChainFirst() {
	return <>
		let value = 1;
		if (value === 1) {
			<div class="one">{'one'}</div>
			return;
		} else if (value === 2) {
			<div class="two">{'two'}</div>
			return;
		} else {
			<div class="other">{'other'}</div>
			return;
		}
		<div class="never">{'never reached'}</div>
	</>;
}

// Return with else-if chain - second condition
export function ElseIfChainSecond() {
	return <>
		let value = 2;
		if (value === 1) {
			<div class="one">{'one'}</div>
			return;
		} else if (value === 2) {
			<div class="two">{'two'}</div>
			return;
		} else {
			<div class="other">{'other'}</div>
			return;
		}
		<div class="never">{'never reached'}</div>
	</>;
}

// Return with else-if chain - else condition
export function ElseIfChainElse() {
	return <>
		let value = 3;
		if (value === 1) {
			<div class="one">{'one'}</div>
			return;
		} else if (value === 2) {
			<div class="two">{'two'}</div>
			return;
		} else {
			<div class="other">{'other'}</div>
			return;
		}
		<div class="never">{'never reached'}</div>
	</>;
}

// Return with else branch that does not return
export function ReturnWithElseNoReturn() {
	return <>
		let condition = false;
		if (condition) {
			<div class="true">{'condition true'}</div>
			return;
		} else {
			<div class="false">{'condition false'}</div>
		}
		<div class="after">{'after if-else'}</div>
	</>;
}

// Return with else branch that also returns
export function ReturnWithElseBothReturn() {
	return <>
		let condition = false;
		if (condition) {
			<div class="true">{'condition true'}</div>
			return;
		} else {
			<div class="false">{'condition false'}</div>
			return;
		}
		<div class="never">{'never reached'}</div>
	</>;
}

// Reactive return - starts true, can toggle to false
export function ReactiveReturnTrueToFalse() {
	return <>
		let &[condition] = track(true);
		<button
			class="toggle"
			onClick={() => {
				condition = !condition;
			}}
		>
			{'Toggle'}
		</button>
		if (condition) {
			<div class="guard">{'guard hit'}</div>
			return;
		}
		<div class="rest">{'rest'}</div>
	</>;
}

// Reactive return - starts false, can toggle to true
export function ReactiveReturnFalseToTrue() {
	return <>
		let &[condition] = track(false);
		<button
			class="toggle"
			onClick={() => {
				condition = !condition;
			}}
		>
			{'Toggle'}
		</button>
		if (condition) {
			<div class="guard">{'guard hit'}</div>
			return;
		}
		<div class="rest">{'rest'}</div>
	</>;
}

// Reactive nested return - only inner condition (b) is tracked
export function ReactiveNestedReturn() {
	return <>
		let a = true;
		let &[b] = track(true);
		<button
			class="toggle"
			onClick={() => {
				b = !b;
			}}
		>
			{'Toggle'}
		</button>
		if (a) {
			<div class="a">{'a'}</div>
			if (b) {
				<div class="b">{'b'}</div>
				return;
			}
		}
		<div class="rest">{'rest'}</div>
	</>;
}

// Return inside nested element scope
export function ReturnInNestedElement() {
	return <>
		let show = true;
		<div class="outer">
			<span class="label">{'outer'}</span>
			if (show) {
				<p class="inner">{'inner'}</p>
				return;
			}
		</div>
		<div class="after">{'after'}</div>
	</>;
}

// Return with multiple elements before and after
export function ReturnWithMultipleElements() {
	return <>
		let shouldReturn = true;
		<h1 class="title">{'title'}</h1>
		<p class="desc">{'description'}</p>
		if (shouldReturn) {
			<div class="guard">{'guard'}</div>
			<span class="guard-span">{'guard span'}</span>
			return;
		}
		<footer class="footer">{'footer'}</footer>
		<nav class="nav">{'nav'}</nav>
	</>;
}

// Return at the beginning of component
export function ReturnAtBeginning() {
	return <>
		if (true) {
			<div class="early">{'early exit'}</div>
			return;
		}
		<div class="never1">{'never reached 1'}</div>
		<div class="never2">{'never reached 2'}</div>
	</>;
}

// Return at the end of function(after all content)
export function ReturnAtEnd() {
	return <>
		<div class="first">{'first'}</div>
		<div class="second">{'second'}</div>
		if (true) {
			<div class="third">{'third'}</div>
			return;
		}
	</>;
}

// Multiple sibling returns at same level
export function MultipleSiblingReturns() {
	return <>
		let mode = 'b';
		if (mode === 'a') {
			<div class="mode-a">{'mode A'}</div>
			return;
		}
		if (mode === 'b') {
			<div class="mode-b">{'mode B'}</div>
			return;
		}
		if (mode === 'c') {
			<div class="mode-c">{'mode C'}</div>
			return;
		}
		<div class="default">{'default mode'}</div>
	</>;
}

// Reactive sibling returns - cycles first -> second -> fallback
export function ReactiveSiblingReturns() {
	return <>
		let &[mode] = track('first');
		<button
			class="toggle"
			onClick={() => {
				if (mode === 'first') {
					mode = 'second';
				} else if (mode === 'second') {
					mode = 'none';
				} else {
					mode = 'first';
				}
			}}
		>
			{'Toggle'}
		</button>
		if (mode === 'first') {
			<div class="first">{'first guard'}</div>
			return;
		}
		if (mode === 'second') {
			<div class="second">{'second guard'}</div>
			return;
		}
		<div class="rest">{'rest'}</div>
	</>;
}

// Reactive nested returns with tracked outer and inner conditions
export function ReactiveOuterInnerReturns() {
	return <>
		let &[a] = track(true);
		let &[b] = track(true);
		<button
			class="toggle-a"
			onClick={() => {
				a = !a;
			}}
		>
			{'Toggle A'}
		</button>
		<button
			class="toggle-b"
			onClick={() => {
				b = !b;
			}}
		>
			{'Toggle B'}
		</button>
		if (a) {
			<div class="a">{'a'}</div>
			if (b) {
				<div class="b">{'b'}</div>
				return;
			}
		}
		<div class="rest">{a ? 'a-on rest' : 'a-off rest'}</div>
	</>;
}

// Reactive else-if return chain that transitions between return and non-return states
export function ReactiveElseIfReturns() {
	return <>
		let &[status] = track(0);
		<button
			class="toggle"
			onClick={() => {
				status = (status + 1) % 3;
			}}
		>
			{'Toggle'}
		</button>
		if (status === 0) {
			<div class="zero">{'zero'}</div>
			return;
		} else if (status === 1) {
			<div class="one">{'one'}</div>
			return;
		}
		<div class="rest">{'rest'}</div>
		<div class="tail">{'tail'}</div>
	</>;
}

// Deeply nested independent return guards with multiple root-level siblings
export function ReactiveDeepNestedIndependentReturns() {
	return <>
		let &[c1] = track(false);
		let &[c2] = track(false);
		let &[c3] = track(false);
		let &[c4] = track(false);
		<button
			class="toggle-c1"
			onClick={() => {
				c1 = !c1;
			}}
		>
			{'Toggle C1'}
		</button>
		<button
			class="toggle-c2"
			onClick={() => {
				c2 = !c2;
			}}
		>
			{'Toggle C2'}
		</button>
		<button
			class="toggle-c3"
			onClick={() => {
				c3 = !c3;
			}}
		>
			{'Toggle C3'}
		</button>
		<button
			class="toggle-c4"
			onClick={() => {
				c4 = !c4;
			}}
		>
			{'Toggle C4'}
		</button>
		<div class="top">{'top'}</div>
		if (c1) {
			<div class="hit-1">{'hit-1'}</div>
			return;
		}
		<div class="middle">{'middle'}</div>
		<section class="nest-1">
			<div class="nest-1-a">{'nest-1-a'}</div>
			if (c2) {
				<div class="hit-2">{'hit-2'}</div>
				return;
			}

			<div class="nest-1-b">{'nest-1-b'}</div>
			<section class="nest-2">
				<div class="nest-2-a">{'nest-2-a'}</div>
				if (c3) {
					<div class="hit-3">{'hit-3'}</div>
					return;
				}

				<div class="nest-2-b">{'nest-2-b'}</div>
				if (c4) {
					<div class="hit-4">{'hit-4'}</div>
					return;
				}
			</section>
		</section>
		<div class="root-1">{'root-1'}</div>
		<div class="root-2">{'root-2'}</div>
		<div class="root-3">{'root-3'}</div>
		<div class="root-4">{'root-4'}</div>
	</>;
}
