package ai.zedface.tv;

import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;

import org.vosk.Recognizer;
import org.vosk.android.RecognitionListener;

import java.io.IOException;

/**
 * Non-blocking recorder for TV remotes.
 *
 * Vosk's stock SpeechService joins its worker thread from stop(). Some Xiaomi TV
 * audio HALs repeatedly return an empty buffer while the Bluetooth microphone is
 * inactive, so that join blocks input dispatch and triggers an ANR. This wrapper
 * never joins from the UI thread and backs off on empty reads.
 */
final class RemoteSpeechService {
    private static final int CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO;
    private static final int AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT;

    private final Recognizer recognizer;
    private final AudioRecord recorder;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final int bufferSamples;

    private volatile boolean running;
    private volatile Thread worker;

    RemoteSpeechService(Recognizer recognizer, int sampleRate) throws IOException {
        this.recognizer = recognizer;
        int minimumBytes = AudioRecord.getMinBufferSize(sampleRate, CHANNEL_CONFIG, AUDIO_FORMAT);
        int requestedBytes = Math.max(sampleRate / 5 * 2, minimumBytes);
        bufferSamples = Math.max(1600, requestedBytes / 2);
        recorder = new AudioRecord(
                MediaRecorder.AudioSource.VOICE_RECOGNITION,
                sampleRate,
                CHANNEL_CONFIG,
                AUDIO_FORMAT,
                requestedBytes);
        if (recorder.getState() != AudioRecord.STATE_INITIALIZED) {
            recorder.release();
            throw new IOException("Failed to initialize recorder. Microphone might be in use.");
        }
    }

    boolean startListening(RecognitionListener listener) {
        if (worker != null) return false;
        running = true;
        Thread thread = new Thread(() -> recordLoop(listener), "ZedFace-Recognizer");
        worker = thread;
        thread.start();
        return true;
    }

    void stop() {
        running = false;
        Thread thread = worker;
        if (thread != null) thread.interrupt();
        // AudioRecord.stop() can call into vendor code, so never run it on input dispatch.
        new Thread(() -> {
            try {
                if (recorder.getRecordingState() == AudioRecord.RECORDSTATE_RECORDING) recorder.stop();
            } catch (RuntimeException ignored) {
            }
        }, "ZedFace-RecorderStop").start();
    }

    void shutdown() {
        stop();
        new Thread(() -> {
            try {
                recorder.release();
            } catch (RuntimeException ignored) {
            }
        }, "ZedFace-RecorderRelease").start();
    }

    private void recordLoop(RecognitionListener listener) {
        try {
            recorder.startRecording();
            if (recorder.getRecordingState() != AudioRecord.RECORDSTATE_RECORDING) {
                throw new IOException("Failed to start recording. Microphone might be in use.");
            }

            short[] buffer = new short[bufferSamples];
            while (running) {
                int samples = recorder.read(buffer, 0, buffer.length);
                if (!running) break;
                if (samples < 0) throw new IOException("AudioRecord read error " + samples);
                if (samples == 0) {
                    SystemClock.sleep(20);
                    continue;
                }
                if (recognizer.acceptWaveForm(buffer, samples)) {
                    String result = recognizer.getResult();
                    post(() -> listener.onResult(result));
                } else {
                    String partial = recognizer.getPartialResult();
                    post(() -> listener.onPartialResult(partial));
                }
            }

            String result = recognizer.getFinalResult();
            post(() -> listener.onFinalResult(result));
        } catch (Exception exception) {
            post(() -> listener.onError(exception));
        } finally {
            running = false;
            worker = null;
            try {
                if (recorder.getRecordingState() == AudioRecord.RECORDSTATE_RECORDING) recorder.stop();
            } catch (RuntimeException ignored) {
            }
        }
    }

    private void post(Runnable callback) {
        mainHandler.post(callback);
    }
}
