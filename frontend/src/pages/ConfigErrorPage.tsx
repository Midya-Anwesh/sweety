import { CONFIG_ERRORS } from '@/constants/env';
import { FullScreenState } from '@/components/common/FullScreenState';

export default function ConfigErrorPage() {
  return (
    <FullScreenState testId="page-config-error">
      <p className="eyebrow">Configuration</p>
      <h1 className="fs-title">Sweety isn't configured correctly</h1>
      <p className="fs-copy">The app stopped before contacting any server. Fix these build settings and redeploy:</p>
      <ul className="config-list" data-testid="list-config-errors">
        {CONFIG_ERRORS.map((e) => <li key={e}>{e}</li>)}
      </ul>
      <p className="fs-copy">Leave a setting unset to use its documented default.</p>
    </FullScreenState>
  );
}
