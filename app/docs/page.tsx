import type { Metadata } from 'next';
import { DocsPage } from '@/src/screens/docs/docs-page';

export const metadata: Metadata = {
  title: 'Docs — TrackForge',
  description: 'Complete documentation for TrackForge: all features, architecture, data model, and roadmap.',
};

export default function Page() {
  return <DocsPage />;
}
