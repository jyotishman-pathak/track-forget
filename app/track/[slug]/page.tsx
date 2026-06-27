import { TrackPage } from '@/src/screens/track/track-page';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <TrackPage slug={slug} />;
}
