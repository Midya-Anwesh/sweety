import { Link } from 'react-router';
import { useAppSelector } from '@/redux/store';
import { ROUTES } from '@/constants/routes';
import { FullScreenState } from '@/components/common/FullScreenState';

export default function NotFoundPage() {
  const token = useAppSelector((s) => s.auth.token);
  return (
    <FullScreenState testId="page-not-found">
      <p className="eyebrow">404</p>
      <h1 className="fs-title">This page isn't in the journal</h1>
      <p className="fs-copy">The address may be mistyped, or the page was never here. Your readings are safe.</p>
      <Link to={token ? ROUTES.readings : ROUTES.login} className="btn btn-primary" data-testid="link-home">
        {token ? 'Back to my readings' : 'Go to log in'}
      </Link>
    </FullScreenState>
  );
}
