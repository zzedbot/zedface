package ai.zedface.tv;

import android.accessibilityservice.AccessibilityService;
import android.util.Log;
import android.view.KeyEvent;
import android.view.accessibility.AccessibilityEvent;

/**
 * Filters the Xiaomi remote's F12 microphone key before the system voice overlay
 * can take focus. It only consumes the key while ZedFace is the resumed activity.
 */
public final class VoiceKeyAccessibilityService extends AccessibilityService {
    private static final String TAG = "ZedFaceVoiceKey";

    @Override
    protected boolean onKeyEvent(KeyEvent event) {
        if (event.getKeyCode() != KeyEvent.KEYCODE_F12) return false;
        boolean handled = MainActivity.handleAccessibilityVoiceKey(event);
        Log.i(TAG, "F12 action=" + event.getAction() + " handled=" + handled);
        return handled;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // Window contents are intentionally not requested or inspected.
    }

    @Override
    public void onInterrupt() {
        // No spoken accessibility feedback to interrupt.
    }
}
