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
	const title = track('Initial Title');
	<>
		<head>
			<title>{title.value}</title>
		</head>
		<div>
			<span>{title.value}</span>
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
	const description = track('Initial description');
	<>
		<head>
			<title>{'My Page'}</title>
			<meta name="description" content={description.value} />
		</head>
		<div>{description.value}</div>
	</>
}

// Title with template literal
export function TitleWithTemplate() @{
	const name = track('World');
	<>
		<head>
			<title>{`Hello ${name.value}!`}</title>
		</head>
		<div>{name.value}</div>
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
	const showPrefix = track(true);
	const title = track('Main Page');
	<>
		<head>
			<title>
				{showPrefix.value ? 'App - ' + title.value : title.value}
			</title>
		</head>
		<div>{title.value}</div>
	</>
}

// Title with computed value
export function ComputedTitle() @{
	const count = track(0);
	let prefix = 'Count: ';
	<>
		<head>
			<title>{prefix + count.value}</title>
		</head>
		<div>
			<span>{count.value}</span>
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
