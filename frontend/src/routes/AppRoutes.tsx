import { Route, Routes } from 'react-router';
import { AuthGuard } from '@/guards/AuthGuard';
import { PublicGuard } from '@/guards/PublicGuard';
import { ROUTES } from '@/constants/routes';
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import ReadingsPage from '@/pages/readings/ReadingsPage';
import NotFoundPage from '@/pages/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicGuard />}>
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.signup} element={<SignupPage />} />
      </Route>
      <Route element={<AuthGuard />}>
        <Route path={ROUTES.readings} element={<ReadingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
