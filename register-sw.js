if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      registration.update();

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      const activateUpdate = worker => {
        if (!worker) return;
        worker.postMessage({ type: 'SKIP_WAITING' });
      };

      if (registration.waiting) {
        activateUpdate(registration.waiting);
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            activateUpdate(newWorker);
          }
        });
      });
    } catch {
      // no-op: app continues without offline cache
    }
  });
}
