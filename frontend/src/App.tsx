import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import { store } from '@/redux/store';
import { queryClient } from '@/lib/queryClient';
import { AppRoutes } from '@/routes/AppRoutes';
import { HAS_CONFIG_ERRORS } from '@/constants/env';
import ConfigErrorPage from '@/pages/ConfigErrorPage';

function App() {
  if (HAS_CONFIG_ERRORS) return <ConfigErrorPage />;
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
