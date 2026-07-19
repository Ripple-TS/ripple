import { track } from 'ripple';

// Static title
export function StaticTitle() @{
	<>
		<head>
			<title>{'Static Test Title'}</title>
		</head>
		<div>{'Content'}</div>
	</>
}

// Reactive title
export function ReactiveTitle() @{
	let &[title] = track('Initial Title');
	<>
		<head>
			<title>{title}</title>
		</head>
		<div>
			<span>{title}</span>
		</div>
	</>
}

// Multiple head elements
export function MultipleHeadElements() @{
	<>
		<head>
			<title>{'Page Title'}</title>
			<meta name="description" content="Page description" />
			<link rel="stylesheet" href="/styles.css" />
		</head>
		<div>{'Page content'}</div>
	</>
}

// Head with reactive meta tags
export function ReactiveMetaTags() @{
	let &[description] = track('Initial description');
	<>
		<head>
			<title>{'My Page'}</title>
			<meta name="description" content={description} />
		</head>
		<div>{description}</div>
	</>
}

// Title with template literal
export function TitleWithTemplate() @{
	let &[name] = track('World');
	<>
		<head>
			<title>{`Hello ${name}!`}</title>
		</head>
		<div>{name}</div>
	</>
}

// Empty title
export function EmptyTitle() @{
	<>
		<head>
			<title>{''}</title>
		</head>
		<div>{'Empty title test'}</div>
	</>
}

// Title with conditional content
export function ConditionalTitle() @{
	let &[showPrefix] = track(true);
	let &[title] = track('Main Page');
	<>
		<head>
			<title>
				{showPrefix ? 'App - ' + title : title}
			</title>
		</head>
		<div>{title}</div>
	</>
}

// Title with computed value
export function ComputedTitle() @{
	let &[count] = track(0);
	let prefix = 'Count: ';
	<>
		<head>
			<title>{prefix + count}</title>
		</head>
		<div>
			<span>{count}</span>
		</div>
	</>
}

// Multiple head blocks (edge case)
export function MultipleHeadBlocks() @{
	<>
		<head>
			<title>{'First Head'}</title>
		</head>
		<div>{'Content'}</div>
		<head>
			<meta name="author" content="Test Author" />
		</head>
	</>
}

// Head with style tag
export function HeadWithStyle() @{
	<>
		<head>
			<title>{'Styled Page'}</title>
		</head>
		<div>{'Styled content'}</div>
	</>
}
