if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      registration.update();
    } catch {
      // no-op: app continues without offline cache
    }
  });
}
