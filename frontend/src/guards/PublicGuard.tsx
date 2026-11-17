import { Navigate, Outlet } from 'react-router';
import { useAppSelector } from '@/redux/store';
import { ROUTES } from '@/constants/routes';

export function PublicGuard() {
  const token = useAppSelector((s) => s.auth.token);
  if (token) return <Navigate to={ROUTES.readings} replace />;
  return <Outlet />;
}
