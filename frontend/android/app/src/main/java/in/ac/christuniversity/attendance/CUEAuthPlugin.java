package in.ac.christuniversity.attendance;

import android.app.Dialog;
import android.content.Context;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Map;

@CapacitorPlugin(name = "CUEAuth")
public class CUEAuthPlugin extends Plugin {
    private static final String TAG = "CUEAuthPlugin";
    private Dialog loginDialog;
    private Handler scannerHandler;
    private Runnable scannerRunnable;
    private boolean tokenFound = false;
    private PluginCall savedCall;

    public class CUEAuthBridge {
        @JavascriptInterface
        public void onToken(String token) {
            if (token != null && isJwtToken(token)) {
                Log.d(TAG, "Bridge captured JWT token!");
                deliverTokenAndClose(token);
            }
        }
    }

    private boolean isJwtToken(String str) {
        if (str == null) return false;
        String s = str.trim().replace("\"", "").replace("'", "");
        return s.length() > 50 && (s.startsWith("eyJ") || (s.contains(".") && s.split("\\.").length >= 3));
    }

    private synchronized void deliverTokenAndClose(String rawToken) {
        if (tokenFound) return;
        tokenFound = true;

        String clean = rawToken.trim().replace("\"", "").replace("'", "");
        if (clean.toLowerCase().startsWith("bearer ")) {
            clean = clean.substring(7).trim();
        }

        final String finalToken = clean;
        Log.i(TAG, "Delivering token and automatically closing ESPRO portal...");

        if (scannerHandler != null && scannerRunnable != null) {
            scannerHandler.removeCallbacks(scannerRunnable);
        }

        getActivity().runOnUiThread(() -> {
            try {
                if (loginDialog != null && loginDialog.isShowing()) {
                    loginDialog.dismiss();
                    loginDialog = null;
                }
            } catch (Exception e) {
                Log.e(TAG, "Error dismissing login dialog", e);
            }

            if (savedCall != null) {
                JSObject ret = new JSObject();
                ret.put("token", finalToken);
                savedCall.resolve(ret);
                savedCall = null;
            }
        });
    }

    private static final String INJECT_SCRIPT =
        "(function() {" +
        "  function checkToken(val) {" +
        "    if (typeof val === 'string' && val.length > 50 && val.indexOf('eyJ') === 0) {" +
        "      try { window.CUEBridge.onToken(val); } catch(e) {}" +
        "    }" +
        "  }" +
        "  function scanStorage() {" +
        "    try {" +
        "      for (var i = 0; i < sessionStorage.length; i++) {" +
        "        var k = sessionStorage.key(i);" +
        "        checkToken(sessionStorage.getItem(k));" +
        "      }" +
        "      for (var j = 0; j < localStorage.length; j++) {" +
        "        var lk = localStorage.key(j);" +
        "        checkToken(localStorage.getItem(lk));" +
        "      }" +
        "    } catch(e) {}" +
        "  }" +
        "  try {" +
        "    var origSetItem = sessionStorage.setItem;" +
        "    sessionStorage.setItem = function(k, v) {" +
        "      checkToken(v);" +
        "      return origSetItem.apply(this, arguments);" +
        "    };" +
        "    var origLocalSet = localStorage.setItem;" +
        "    localStorage.setItem = function(k, v) {" +
        "      checkToken(v);" +
        "      return origLocalSet.apply(this, arguments);" +
        "    };" +
        "  } catch(e) {}" +
        "  try {" +
        "    var origOpen = XMLHttpRequest.prototype.open;" +
        "    var origSetHeader = XMLHttpRequest.prototype.setRequestHeader;" +
        "    XMLHttpRequest.prototype.setRequestHeader = function(h, v) {" +
        "      if (h && h.toLowerCase() === 'authorization' && v && v.indexOf('Bearer eyJ') === 0) {" +
        "        checkToken(v.substring(7));" +
        "      }" +
        "      return origSetHeader.apply(this, arguments);" +
        "    };" +
        "  } catch(e) {}" +
        "  try {" +
        "    var origFetch = window.fetch;" +
        "    window.fetch = function(url, init) {" +
        "      if (init && init.headers) {" +
        "        var h = init.headers;" +
        "        var auth = (h instanceof Headers) ? h.get('authorization') : (h['Authorization'] || h['authorization']);" +
        "        if (auth && auth.indexOf('Bearer eyJ') === 0) {" +
        "          checkToken(auth.substring(7));" +
        "        }" +
        "      }" +
        "      return origFetch.apply(this, arguments);" +
        "    };" +
        "  } catch(e) {}" +
        "  scanStorage();" +
        "  setInterval(scanStorage, 400);" +
        "})();";

    @PluginMethod
    public void openPortalLogin(PluginCall call) {
        savedCall = call;
        tokenFound = false;

        getActivity().runOnUiThread(() -> {
            try {
                Context context = getContext();
                loginDialog = new Dialog(context, android.R.style.Theme_DeviceDefault_Light_NoActionBar_Fullscreen);

                FrameLayout rootLayout = new FrameLayout(context);
                rootLayout.setLayoutParams(new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                ));

                WebView webView = new WebView(context);
                webView.setLayoutParams(new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                ));

                WebSettings settings = webView.getSettings();
                settings.setJavaScriptEnabled(true);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setUseWideViewPort(true);
                settings.setLoadWithOverviewMode(true);
                settings.setUserAgentString(settings.getUserAgentString() + " Chrome/122.0.0.0 Mobile");

                CookieManager.getInstance().setAcceptCookie(true);
                CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

                webView.addJavascriptInterface(new CUEAuthBridge(), "CUEBridge");

                scannerHandler = new Handler(Looper.getMainLooper());
                scannerRunnable = new Runnable() {
                    @Override
                    public void run() {
                        if (tokenFound || loginDialog == null || !loginDialog.isShowing()) {
                            return;
                        }

                        webView.evaluateJavascript(
                            "(function() {" +
                            "  try {" +
                            "    for (var i = 0; i < sessionStorage.length; i++) {" +
                            "      var v = sessionStorage.getItem(sessionStorage.key(i));" +
                            "      if (v && v.length > 50 && v.indexOf('eyJ') === 0) return v;" +
                            "    }" +
                            "    for (var j = 0; j < localStorage.length; j++) {" +
                            "      var lv = localStorage.getItem(localStorage.key(j));" +
                            "      if (lv && lv.length > 50 && lv.indexOf('eyJ') === 0) return lv;" +
                            "    }" +
                            "  } catch(e) {}" +
                            "  return '';" +
                            "})();",
                            value -> {
                                if (value != null && isJwtToken(value)) {
                                    deliverTokenAndClose(value);
                                }
                            }
                        );

                        if (!tokenFound) {
                            scannerHandler.postDelayed(this, 500);
                        }
                    }
                };

                webView.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageStarted(WebView view, String url, Bitmap favicon) {
                        super.onPageStarted(view, url, favicon);
                        view.evaluateJavascript(INJECT_SCRIPT, null);
                        scannerHandler.post(scannerRunnable);
                    }

                    @Override
                    public void onPageFinished(WebView view, String url) {
                        super.onPageFinished(view, url);
                        view.evaluateJavascript(INJECT_SCRIPT, null);
                        scannerHandler.post(scannerRunnable);
                    }

                    @Override
                    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                        if (request != null && request.getRequestHeaders() != null) {
                            Map<String, String> headers = request.getRequestHeaders();
                            for (Map.Entry<String, String> entry : headers.entrySet()) {
                                if (entry.getKey().equalsIgnoreCase("Authorization")) {
                                    String auth = entry.getValue();
                                    if (auth != null && auth.toLowerCase().startsWith("bearer ")) {
                                        String candidate = auth.substring(7).trim();
                                        if (isJwtToken(candidate)) {
                                            deliverTokenAndClose(candidate);
                                        }
                                    }
                                }
                            }
                        }
                        return super.shouldInterceptRequest(view, request);
                    }
                });

                loginDialog.setOnDismissListener(dialog -> {
                    if (scannerHandler != null && scannerRunnable != null) {
                        scannerHandler.removeCallbacks(scannerRunnable);
                    }
                    if (!tokenFound && savedCall != null) {
                        savedCall.reject("Login cancelled by user");
                        savedCall = null;
                    }
                });

                rootLayout.addView(webView);
                loginDialog.setContentView(rootLayout);
                loginDialog.show();

                webView.loadUrl("https://cue.christuniversity.in");
            } catch (Exception e) {
                if (savedCall != null) {
                    savedCall.reject("Failed to open login dialog: " + e.getMessage());
                    savedCall = null;
                }
            }
        });
    }
}
