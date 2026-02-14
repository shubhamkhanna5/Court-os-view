
// The single source of truth for the backend URL
const CLOUD_URL = 'https://script.google.com/macros/s/AKfycbzu0_TePEgb6snqPoIfTN60oqB3sbDNW24oQXxcX7W87LzplNpI0W7z853qBBsFXbmJ/exec';

// Helper to detect viewer mode from URL as a failsafe
const isViewerUrl = () => {
  return window.location.hash.includes('/viewer') || window.location.pathname.includes('/viewer');
};

export const cloudRestore = async (): Promise<any> => {
  // console.log('[Cloud] Restoring data (Read-Only)...');
  try {
    // Explicitly use GET with action=restore parameter
    // Added 'ts' param to prevent browser caching
    // Added credentials: 'omit' to prevent CORS issues with Google redirects
    const response = await fetch(`${CLOUD_URL}?action=restore&ts=${Date.now()}`, {
        method: 'GET',
        credentials: 'omit',
        redirect: 'follow', // Explicitly follow redirects
        headers: {
            'Accept': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    if (!text) return null;

    let json;
    try {
        json = JSON.parse(text);
    } catch (e) {
        console.warn('[Cloud] JSON Parse failed, raw text:', text.substring(0, 50));
        throw new Error('Invalid JSON received');
    }
    
    // Handle standard Google Apps Script response wrapper
    if (json && json.success && json.data) {
        // console.log('[Cloud] Restore successful (Wrapped)');
        return json.data;
    }
    
    // Fallback for direct data return
    // console.log('[Cloud] Restore successful (Direct)');
    return json;
  } catch (error) {
    console.warn('[Cloud] Restore failed:', error);
    throw error;
  }
};

export const cloudBackup = async (payload: any): Promise<void> => {
  // CRITICAL SAFETY CHECK
  if (isViewerUrl()) {
    console.error('[Cloud] 🛑 WRITE BLOCKED: Viewer Mode is active.');
    return;
  }

  console.log('[Cloud] Backing up data...');
  try {
    await fetch(CLOUD_URL, {
      method: 'POST',
      mode: 'no-cors', // Typical for Google Apps Script Web App
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    console.log('[Cloud] Backup successful');
  } catch (error) {
    console.error('[Cloud] Backup failed', error);
  }
};
