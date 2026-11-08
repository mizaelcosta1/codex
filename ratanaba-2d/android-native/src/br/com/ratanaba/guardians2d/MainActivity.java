package br.com.ratanaba.guardians2d;

import android.app.Activity;
import android.app.AlertDialog;
import android.graphics.Color;
import android.content.DialogInterface;
import android.webkit.ValueCallback;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/** Offline Canvas game, with the same bundled assets tested in the browser.
 * The reserved appassets origin gives localStorage a stable HTTPS origin.
 * No JavaScript interface, network permission, file:// or arbitrary navigation.
 */
public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/assets/ratanaba/web/index.html";
    private WebView web;

    @Override public void onCreate(Bundle savedState) {
        super.onCreate(savedState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_NEVER;
            getWindow().setAttributes(lp);
        }
        immersive();
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(3, 9, 9));
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setTextZoom(100);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onConsoleMessage(ConsoleMessage msg) {
                Log.d("RatanabaWeb", msg.messageLevel() + ": " + msg.message() + " @" + msg.lineNumber());
                return true;
            }
        });
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !allowed(request.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return !allowed(Uri.parse(url));
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetResponse(request.getUrl());
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                return assetResponse(Uri.parse(url));
            }
            @Override public void onPageFinished(WebView view, String url) { immersive(); }
        });
        setContentView(web);
        // A stable game origin preserves saves across app updates signed by the same key.
        web.loadUrl(START);
    }

    private static boolean allowed(Uri uri) {
        return "https".equals(uri.getScheme()) && HOST.equals(uri.getHost())
            && uri.getPort() == -1 && uri.getPath() != null
            && uri.getPath().startsWith("/assets/ratanaba/");
    }

    private WebResourceResponse assetResponse(Uri uri) {
        if (!allowed(uri)) return rejected(403, "Forbidden");
        String path = uri.getPath().substring("/assets/".length());
        if (path.contains("..") || path.contains("\\") || path.indexOf('\0') >= 0)
            return rejected(403, "Forbidden");
        try {
            InputStream stream = getAssets().open(path);
            String mime = mime(path);
            Map<String, String> headers = new HashMap<>();
            headers.put("Cache-Control", "no-store");
            headers.put("X-Content-Type-Options", "nosniff");
            return new WebResourceResponse(mime, textual(mime) ? "UTF-8" : null,
                200, "OK", headers, stream);
        } catch (IOException missing) {
            Log.w("RatanabaWeb", "Missing bundled asset: " + path);
            return rejected(404, "Not Found");
        }
    }

    private static boolean textual(String mime) {
        return mime.startsWith("text/") || mime.contains("javascript") || mime.contains("json") || mime.contains("svg");
    }
    private static String mime(String path) {
        if (path.endsWith(".js")) return "application/javascript";
        if (path.endsWith(".css")) return "text/css";
        if (path.endsWith(".html")) return "text/html";
        if (path.endsWith(".svg")) return "image/svg+xml";
        if (path.endsWith(".webp")) return "image/webp";
        if (path.endsWith(".wav")) return "audio/wav";
        if (path.endsWith(".json")) return "application/json";
        String guessed = URLConnection.guessContentTypeFromName(path);
        return guessed == null ? "application/octet-stream" : guessed;
    }
    private static WebResourceResponse rejected(int status, String reason) {
        return new WebResourceResponse("text/plain", "UTF-8", status, reason,
            Collections.singletonMap("Cache-Control", "no-store"),
            new ByteArrayInputStream(reason.getBytes(StandardCharsets.UTF_8)));
    }

    private void immersive() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }
    @Override public void onWindowFocusChanged(boolean focus) {
        super.onWindowFocusChanged(focus);
        if (focus) immersive();
    }
    @Override public void onBackPressed() {
        if (web == null) { super.onBackPressed(); return; }
        web.evaluateJavascript("!!(window.RatanabaNative && window.RatanabaNative.handleBack())", new ValueCallback<String>() {
          @Override public void onReceiveValue(String result) {
            if (!"true".equals(result)) new AlertDialog.Builder(MainActivity.this)
                .setTitle("Encerrar a vigília?")
                .setMessage("O progresso salvo permanece neste aparelho.")
                .setNegativeButton("Retornar", new DialogInterface.OnClickListener() {
                    @Override public void onClick(DialogInterface dialog, int which) { immersive(); }
                })
                .setPositiveButton("Sair", new DialogInterface.OnClickListener() {
                    @Override public void onClick(DialogInterface dialog, int which) { finish(); }
                }).show();
          }
        });
    }
    @Override protected void onPause() {
        if (web != null) {
            web.evaluateJavascript("window.RatanabaNative && window.RatanabaNative.suspend()", null);
            web.onPause();
        }
        super.onPause();
    }
    @Override protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
        immersive();
    }
    @Override protected void onDestroy() {
        if (web != null) { web.stopLoading(); web.destroy(); web = null; }
        super.onDestroy();
    }
}
