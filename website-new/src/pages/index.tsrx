import { Layout } from '../components/layout.tsrx';
import { Header } from '../components/header.tsrx';
import { Actions } from '../components/actions.tsrx';
import { Editor } from '../components/editor.tsrx';
import { Content } from '../components/content.tsrx';

export function IndexPage() {
	return <>
		<Layout>
			<Header />
			<Actions playgroundVisible={true} />
			<Editor />
			<Content />
			<Actions playgroundVisible={false} />
		</Layout>
	</>;
}
