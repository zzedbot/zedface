package ai.zedface.tv;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;
import org.vosk.LibVosk;
import org.vosk.LogLevel;
import org.vosk.Model;
import org.vosk.Recognizer;
import org.vosk.android.RecognitionListener;
import org.vosk.android.StorageService;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;

public final class MainActivity extends Activity implements RecognitionListener {
    private static final String TAG = "ZedFaceVoice";
    private static final int AUDIO_PERMISSION_REQUEST = 7;
    private static final float SAMPLE_RATE = 16000.0f;
    private static final long MAX_LISTENING_MS = 30000L;

    private static volatile MainActivity activeInstance;

    private WebView webView;
    private Model model;
    private Recognizer recognizer;
    private RemoteSpeechService speechService;
    private boolean listening;
    private boolean modelReady;
    private final StringBuilder completedText = new StringBuilder();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Runnable listeningTimeout = () -> {
        if (listening) {
            emitVoiceEvent("error", "录音已超过 30 秒，请重试");
            stopVoiceInput();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        enterImmersiveMode();
        configureWebView();
        LibVosk.setLogLevel(LogLevel.WARNINGS);

        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
            initializeModel();
        } else {
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, AUDIO_PERMISSION_REQUEST);
        }
    }

    @SuppressWarnings("SetJavaScriptEnabled")
    private void configureWebView() {
        webView = new WebView(this);
        webView.setBackgroundColor(Color.TRANSPARENT);
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.setWebViewClient(new LocalAssetWebViewClient());
        webView.addJavascriptInterface(new VoiceBridge(), "ZedFaceAndroid");

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        setContentView(webView);
        webView.loadUrl("https://appassets.androidplatform.net/assets/www/index.html");
        webView.requestFocus();
    }

    private void initializeModel() {
        emitVoiceEvent("partial", "正在准备离线中文语音识别…");
        StorageService.unpack(this, "model-cn", "model-cn",
                unpackedModel -> {
                    model = unpackedModel;
                    modelReady = true;
                    emitVoiceEvent("ready", "");
                },
                exception -> emitVoiceEvent("error", "语音模型加载失败：" + safeMessage(exception)));
    }

    private void startVoiceInput() {
        runOnUiThread(() -> {
            if (listening) return;
            if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, AUDIO_PERMISSION_REQUEST);
                return;
            }
            if (!modelReady || model == null) {
                emitVoiceEvent("error", "离线语音模型仍在准备，请稍后再试");
                return;
            }

            completedText.setLength(0);
            try {
                recognizer = new Recognizer(model, SAMPLE_RATE);
                speechService = new RemoteSpeechService(recognizer, (int) SAMPLE_RATE);
                if (speechService.startListening(this)) {
                    listening = true;
                    mainHandler.removeCallbacks(listeningTimeout);
                    mainHandler.postDelayed(listeningTimeout, MAX_LISTENING_MS);
                    Log.i(TAG, "voice input started");
                    emitVoiceEvent("listening", "");
                }
            } catch (IOException | RuntimeException exception) {
                releaseRecognizer();
                emitVoiceEvent("error", "无法打开遥控器麦克风：" + safeMessage(exception));
            }
        });
    }

    private void stopVoiceInput() {
        runOnUiThread(() -> {
            if (!listening || speechService == null) return;
            listening = false;
            mainHandler.removeCallbacks(listeningTimeout);
            Log.i(TAG, "voice input stop requested");
            speechService.stop();
        });
    }

    private void toggleVoiceInput() {
        if (listening) stopVoiceInput(); else startVoiceInput();
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getKeyCode() == KeyEvent.KEYCODE_F12) {
            handleVoiceKeyEvent(event);
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    private void handleVoiceKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0) {
            startVoiceInput();
        } else if (event.getAction() == KeyEvent.ACTION_UP) {
            stopVoiceInput();
        }
    }

    static boolean handleAccessibilityVoiceKey(KeyEvent event) {
        MainActivity activity = activeInstance;
        if (activity == null || activity.isFinishing() || activity.isDestroyed()) return false;
        activity.runOnUiThread(() -> activity.handleVoiceKeyEvent(event));
        return true;
    }

    @Override
    public void onResult(String hypothesis) {
        String text = jsonText(hypothesis, "text");
        appendCompleted(text);
        emitVoiceEvent("partial", joinedText(""));
    }

    @Override
    public void onPartialResult(String hypothesis) {
        String partial = jsonText(hypothesis, "partial");
        emitVoiceEvent("partial", joinedText(partial));
    }

    @Override
    public void onFinalResult(String hypothesis) {
        appendCompleted(jsonText(hypothesis, "text"));
        String result = joinedText("");
        listening = false;
        mainHandler.removeCallbacks(listeningTimeout);
        Log.i(TAG, "voice input final result length=" + result.length());
        emitVoiceEvent("final", result);
        releaseRecognizer();
    }

    @Override
    public void onError(Exception exception) {
        listening = false;
        mainHandler.removeCallbacks(listeningTimeout);
        Log.e(TAG, "voice input failed", exception);
        emitVoiceEvent("error", "语音识别失败：" + safeMessage(exception));
        releaseRecognizer();
    }

    @Override
    public void onTimeout() {
        listening = false;
        mainHandler.removeCallbacks(listeningTimeout);
        emitVoiceEvent("final", joinedText(""));
        releaseRecognizer();
    }

    private void appendCompleted(String text) {
        if (text == null || text.isBlank()) return;
        if (completedText.length() > 0) completedText.append(' ');
        completedText.append(text.trim());
    }

    private String joinedText(String partial) {
        if (partial == null || partial.isBlank()) return completedText.toString();
        if (completedText.length() == 0) return partial.trim();
        return completedText + " " + partial.trim();
    }

    private static String jsonText(String json, String key) {
        try {
            return new JSONObject(json).optString(key, "");
        } catch (Exception ignored) {
            return "";
        }
    }

    private void emitVoiceEvent(String type, String text) {
        if (webView == null) return;
        String script = "window.dispatchEvent(new CustomEvent('zedface-native-voice',{detail:{type:"
                + JSONObject.quote(type) + ",text:" + JSONObject.quote(text == null ? "" : text) + "}}));";
        webView.post(() -> webView.evaluateJavascript(script, null));
    }

    private void releaseRecognizer() {
        mainHandler.removeCallbacks(listeningTimeout);
        RemoteSpeechService service = speechService;
        speechService = null;
        if (service != null) service.shutdown();
        Recognizer currentRecognizer = recognizer;
        recognizer = null;
        if (currentRecognizer != null) currentRecognizer.close();
    }

    private static String safeMessage(Exception exception) {
        String message = exception.getMessage();
        return message == null || message.isBlank() ? exception.getClass().getSimpleName() : message;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != AUDIO_PERMISSION_REQUEST) return;
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            initializeModel();
        } else {
            emitVoiceEvent("error", "需要麦克风权限才能使用语音输入");
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        activeInstance = this;
    }

    @Override
    protected void onPause() {
        if (activeInstance == this) activeInstance = null;
        if (listening) stopVoiceInput();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        if (activeInstance == this) activeInstance = null;
        mainHandler.removeCallbacksAndMessages(null);
        if (speechService != null) {
            speechService.stop();
            releaseRecognizer();
        }
        if (model != null) {
            model.close();
            model = null;
        }
        if (webView != null) {
            webView.removeJavascriptInterface("ZedFaceAndroid");
            webView.destroy();
        }
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (listening) {
            stopVoiceInput();
        } else if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    private void enterImmersiveMode() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        if (android.os.Build.VERSION.SDK_INT >= 30 && getWindow().getInsetsController() != null) {
            getWindow().getInsetsController().hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
        }
    }

    private final class VoiceBridge {
        @JavascriptInterface
        public boolean isAvailable() {
            return true;
        }

        @JavascriptInterface
        public void toggleVoiceInput() {
            MainActivity.this.toggleVoiceInput();
        }

        @JavascriptInterface
        public void startVoiceInput() {
            MainActivity.this.startVoiceInput();
        }

        @JavascriptInterface
        public void stopVoiceInput() {
            MainActivity.this.stopVoiceInput();
        }
    }

    private final class LocalAssetWebViewClient extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            String host = request.getUrl().getHost();
            String path = request.getUrl().getPath();
            if (!"appassets.androidplatform.net".equals(host) || path == null || !path.startsWith("/assets/")) {
                return super.shouldInterceptRequest(view, request);
            }

            String assetPath = path.substring("/assets/".length());
            try {
                InputStream stream = getAssets().open(assetPath);
                return new WebResourceResponse(mimeType(assetPath), "UTF-8", stream);
            } catch (IOException exception) {
                return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", null,
                        new java.io.ByteArrayInputStream(new byte[0]));
            }
        }

        private String mimeType(String path) {
            String lower = path.toLowerCase(Locale.ROOT);
            if (lower.endsWith(".html")) return "text/html";
            if (lower.endsWith(".js")) return "text/javascript";
            if (lower.endsWith(".css")) return "text/css";
            if (lower.endsWith(".json")) return "application/json";
            if (lower.endsWith(".svg")) return "image/svg+xml";
            if (lower.endsWith(".png")) return "image/png";
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
            if (lower.endsWith(".woff2")) return "font/woff2";
            return "application/octet-stream";
        }
    }
}
