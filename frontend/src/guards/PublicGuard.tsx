import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { RotateCw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { userVerified } from '@/redux/slices/auth.slice';
import useMeQuery from '@/hooks/apis/auth/useMeQuery';
import { useDelayed } from '@/hooks/useDelayed';
import { describeError, getStatus } from '@/lib/errors';
import { endSession } from '@/lib/session';
import { ROUTES } from '@/constants/routes';
import { FullScreenState } from '@/components/common/FullScreenState';
import { SlowNotice } from '@/components/common/Notice';

export function PublicGuard() {
  const { token, verified } = useAppSelector((s) => s.auth);
  const location = useLocation();
  const dispatch = useAppDispatch();
  const me = useMeQuery(token, !verified);
  const slow = useDelayed(Boolean(token) && !verified && me.isFetching);

  useEffect(() => {
    if (me.data && !verified) {
      dispatch(userVerified(me.data));
    }
  }, [me.data, verified, dispatch]);

  if (!token) return <Outlet />;

  if (verified) {
    const destination = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
    const to = destination?.pathname ? `${destination.pathname}${destination.search ?? ''}` : ROUTES.readings;
    return <Navigate to={to} replace />;
  }

  if (me.isError && getStatus(me.error) !== 401) {
    return (
      <FullScreenState testId="status-session-error">
        <h1 className="fs-title">We couldn't confirm your session</h1>
        <p className="fs-copy" data-testid="text-session-error">{describeError(me.error)}</p>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={() => endSession(null)} data-testid="button-session-logout">
            Log out
          </button>
          <button className="btn btn-primary" onClick={() => me.refetch()} disabled={me.isFetching} data-testid="button-session-retry">
            <RotateCw size={15} aria-hidden /> {me.isFetching ? 'Trying...' : 'Try again'}
          </button>
        </div>
      </FullScreenState>
    );
  }

  return (
    <FullScreenState testId="status-session-checking">
      <h1 className="fs-title">Opening your journal</h1>
      <p className="fs-copy">Checking your session with the server.</p>
      <div className="pulse-bar" aria-hidden><span /></div>
      <SlowNotice show={slow} />
    </FullScreenState>
  );
}
