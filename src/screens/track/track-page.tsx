import { TrackViewWidget } from "@/src/widgets/track-view";

interface TrackPageProps {
  slug: string;
}

export function TrackPage({ slug }: TrackPageProps) {
  return <TrackViewWidget slug={slug} />;
}
