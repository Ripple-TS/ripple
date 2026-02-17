import * as _$_ from 'ripple/internal/server';

export function StaticText(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push('>');

	{
		__output.push('Hello World');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function MultipleElements(__output) {
	_$_.push_component();
	__output.push('<h1');
	__output.push('>');

	{
		__output.push('Title');
	}

	__output.push('</h1>');
	__output.push('<p');
	__output.push('>');

	{
		__output.push('Paragraph text');
	}

	__output.push('</p>');
	__output.push('<span');
	__output.push('>');

	{
		__output.push('Span text');
	}

	__output.push('</span>');
	_$_.pop_component();
}

export function NestedElements(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push(' class="outer"');
	__output.push('>');

	{
		__output.push('<div');
		__output.push(' class="inner"');
		__output.push('>');

		{
			__output.push('<span');
			__output.push('>');

			{
				__output.push('Nested content');
			}

			__output.push('</span>');
		}

		__output.push('</div>');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function WithAttributes(__output) {
	_$_.push_component();
	__output.push('<input');
	__output.push(' type="text"');
	__output.push(' placeholder="Enter text"');
	__output.push(' disabled');
	__output.push(' />');
	__output.push('<a');
	__output.push(' href="/link"');
	__output.push(' target="_blank"');
	__output.push('>');

	{
		__output.push('Link');
	}

	__output.push('</a>');
	_$_.pop_component();
}

export function ChildComponent(__output) {
	_$_.push_component();
	__output.push('<span');
	__output.push(' class="child"');
	__output.push('>');

	{
		__output.push('Child content');
	}

	__output.push('</span>');
	_$_.pop_component();
}

export function ParentWithChild(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push(' class="parent"');
	__output.push('>');

	{
		{
			const comp = ChildComponent;
			const args = [__output, {}];

			comp(...args);
		}
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function FirstSibling(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push(' class="first"');
	__output.push('>');

	{
		__output.push('First');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function SecondSibling(__output) {
	_$_.push_component();
	__output.push('<div');
	__output.push(' class="second"');
	__output.push('>');

	{
		__output.push('Second');
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function SiblingComponents(__output) {
	_$_.push_component();

	{
		const comp = FirstSibling;
		const args = [__output, {}];

		comp(...args);
	}

	{
		const comp = SecondSibling;
		const args = [__output, {}];

		comp(...args);
	}

	_$_.pop_component();
}

export function Greeting(__output, props) {
	_$_.push_component();
	__output.push('<div');
	__output.push('>');

	{
		__output.push(_$_.escape('Hello ' + String(props.name)));
	}

	__output.push('</div>');
	_$_.pop_component();
}

export function WithGreeting(__output) {
	_$_.push_component();

	{
		const comp = Greeting;
		const args = [__output, { name: 'World' }];

		comp(...args);
	}

	_$_.pop_component();
}

export function ExpressionContent(__output) {
	_$_.push_component();

	const value = 42;
	const text = 'computed';

	__output.push('<div');
	__output.push('>');

	{
		__output.push(_$_.escape(value));
	}

	__output.push('</div>');
	__output.push('<span');
	__output.push('>');

	{
		__output.push(_$_.escape(text.toUpperCase()));
	}

	__output.push('</span>');
	_$_.pop_component();
}
