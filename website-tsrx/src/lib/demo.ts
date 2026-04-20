export const DEFAULT_DEMO_SOURCE = `export component FeatureCard({
  title,
  items,
  ready,
}: {
  title: string;
  items: string[];
  ready: boolean;
}) {
  <section class="feature-card">
    <h2>{title}</h2>

    if (ready) {
      <ul>
        for (const item of items; index index) {
          <li>{item}</li>
        }
      </ul>
    } else {
      <p>{'Loading output...'}</p>
    }
  </section>

  <style>
    .feature-card {
      padding: 1rem;
      border: 1px solid rgba(90, 108, 255, 0.2);
      background: rgba(255, 255, 255, 0.78);
    }

    .feature-card h2 {
      margin: 0 0 0.75rem;
      font-size: 1.15rem;
    }

    .feature-card ul {
      margin: 0;
      padding-left: 1.1rem;
    }
  </style>
}`;

export const HERO_POINTS = [
	'TSRX keeps templates, styles, and UI logic closer together, so intent survives the file instead of getting buried in ceremony.',
	'The syntax is easier to scan than large TSX trees filled with callbacks, wrappers, and incidental control-flow glue.',
	'Clearer structure helps both humans and AI agents understand, refactor, and generate UI code with less ambiguity.',
	'Existing TypeScript and TSX codebases can adopt it incrementally instead of starting over with a new runtime model.',
];

export const DRAWBACK_POINTS = [
	'TS + TSX often scatters markup, conditions, loops, styles, and helper code across different constructs.',
	'Large JSX trees become noisy fast, especially once you add wrapper components, inline callbacks, and styling indirection.',
	'Co-locating related UI concerns usually means stitching together multiple conventions rather than using one language surface.',
	'AI-assisted editing works best when structure is explicit and predictable, not hidden behind framework-specific ceremony.',
];

export const IMPROVEMENT_POINTS = [
	'TSRX makes control flow and declarative UI structure part of the language rather than incidental JavaScript around JSX.',
	'It improves co-location by letting component structure, style, and behavior live in one readable unit.',
	'Because the syntax is more direct, code review and agentic assistance both spend less time reconstructing intent.',
	'The output remains target-specific, so framework compilers still decide how semantics land in React, Ripple, or future runtimes.',
];

export const READABILITY_POINTS = [
	'The source reads closer to the interface you are trying to build, not the framework glue required to produce it.',
	'Explicit template control flow reduces the mental overhead of nested ternaries, map chains, and render helpers.',
	'Code concerns stay closer together, which makes refactors, onboarding, and AI collaboration less brittle.',
	'That readability matters even more in an agentic era, where code is increasingly interpreted and transformed by tools.',
];

export const TOOLING_POINTS = [
	'Language server support provides editor features such as diagnostics, navigation, and completion for the language.',
	'Prettier plugin support keeps formatting consistent without forcing teams back into string-based template workflows.',
	'ESLint parser and plugin support make it practical inside real repositories with existing quality gates.',
	'The broader toolchain is designed so the language can be used seriously, not just as a compiler experiment.',
];

export const INTEROP_POINTS = [
	'TSRX can interoperate with existing TypeScript and TSX-heavy codebases rather than demanding a full rewrite.',
	'React and Ripple targets already demonstrate that one source language can serve different framework semantics.',
	'Teams can adopt it where ergonomics matter most while keeping the surrounding codebase familiar.',
	'That makes the language easier to evaluate for engineers who need incremental change, not ideological migration.',
];

export const CURRENT_TARGETS = [
	'@tsrx/react lowers TSRX into React-oriented output that stays close to existing JSX expectations.',
	'@tsrx/ripple lowers the same source into Ripple runtime calls and SSR-aware output paths.',
	'The language layer stays stable while target compilers remain free to own framework-specific semantics.',
];

export const RESOURCE_LINKS = [
	{
		label: 'Read the core package',
		href: 'https://github.com/Ripple-TS/ripple/tree/main/packages/tsrx',
		detail: 'Parser extensions, AST shapes, analysis, and transform helpers.',
	},
	{
		label: 'Inspect the React target',
		href: 'https://github.com/Ripple-TS/ripple/tree/main/packages/tsrx-react',
		detail: 'How the language lowers into React-oriented output.',
	},
	{
		label: 'Inspect the Ripple target',
		href: 'https://github.com/Ripple-TS/ripple/tree/main/packages/tsrx-ripple',
		detail: 'How the same source lowers into Ripple runtime and SSR output.',
	},
];
