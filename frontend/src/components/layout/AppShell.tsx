import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { BookOpenText, LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { useAppSelector } from '@/redux/store';
import { endSession } from '@/lib/session';
import { cx, initials } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { BrandMark } from '@/components/common/Brand';
import { STORAGE_AVAILABLE } from '@/lib/localStorage';
import { Modal } from '@/components/common/Modal';

export function AppShell({ children }: { children: ReactNode }) {
  const user = useAppSelector((s) => s.auth.user);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    endSession(null);
    navigate(ROUTES.login, { replace: true });
  };

  return (
    <div className={cx('shell', collapsed && 'is-collapsed', mobileOpen && 'is-mobile-open')}>
      <header className="mobilebar">
        <button className="icon-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu" data-testid="button-open-menu">
          <Menu size={20} />
        </button>
        <span className="brand"><BrandMark size={28} /><span className="brand-word">Sweety</span></span>
      </header>
      {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)} aria-hidden />}
      <aside className="sidebar" aria-label="Main">
        <div className="sidebar-top">
          <span className="brand"><BrandMark size={30} /><span className="brand-word">Sweety</span></span>
          <button
            className="icon-btn desktop-only"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            data-testid="button-toggle-sidebar"
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
          <button className="icon-btn mobile-only" onClick={() => setMobileOpen(false)} aria-label="Close menu" data-testid="button-close-menu">
            <X size={18} />
          </button>
        </div>
        <div className="user-chip" title={user?.name}>
          <span className="avatar" aria-hidden>{initials(user?.name ?? '')}</span>
          <span className="user-meta">
            <span className="user-name" data-testid="text-username">{user?.name}</span>
            <span className="user-role" data-testid="text-user-role">{user?.role}</span>
          </span>
        </div>
        {!STORAGE_AVAILABLE && (
          <p className="storage-note" data-testid="text-storage-unavailable">Browser storage is blocked, so this login is kept in memory only and ends if you reload.</p>
        )}
        <nav className="nav">
          <Link to={ROUTES.readings} className="nav-item is-active" aria-current="page" data-testid="link-readings" onClick={() => setMobileOpen(false)} title="Readings">
            <BookOpenText size={18} aria-hidden />
            <span className="nav-label">Readings</span>
          </Link>
        </nav>
        <button
          className="nav-item logout"
          onClick={() => {
            setMobileOpen(false);
            setShowLogoutConfirm(true);
          }}
          data-testid="button-logout"
          title="Log out"
        >
          <LogOut size={18} aria-hidden />
          <span className="nav-label">Log out</span>
        </button>
      </aside>
      <main className="content">{children}</main>

      <Modal
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Log out of Sweety?"
        description="Are you sure you want to end your session? You will need to log in again to access your journal."
        testId="dialog-logout-confirm"
      >
        <div className="form">
          <p className="confirm-copy">
            Any unsaved changes will be lost. You will be redirected to the login page.
          </p>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowLogoutConfirm(false)}
              data-testid="button-cancel-logout"
              autoFocus
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleLogout}
              data-testid="button-confirm-logout"
            >
              Log out
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
