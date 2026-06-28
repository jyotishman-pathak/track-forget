import type { Metadata } from 'next';
import { LoginPage } from '@/src/screens/login/login-page';

export const metadata: Metadata = {
  title: 'Login — TrackForge',
};

export default function Page() {
  return <LoginPage />;
}
