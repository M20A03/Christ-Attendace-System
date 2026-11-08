package in.ac.christuniversity.attendance;

import android.app.Dialog;
import android.content.Context;
import android.graphics.Bitmap;
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

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

@CapacitorPlugin(name = "CUEAuth")
public class CUEAuthPlugin extends Plugin {
    private static final String TAG = "CUEAuthPlugin";

    private Dialog loginDialog;
    private Handler autoCloseHandler;
    private Runnable autoCloseRunnable;
    private boolean dataIntercepted = false;
    private PluginCall savedCall;

    public class CUEAuthBridge {
        @JavascriptInterface
        public void onAttendanceResponse(String rawJson, String profileJson, String token) {
            Log.d(TAG, "Bridge intercepted attendance response from CUE portal!");
            handleInterceptedData(rawJson, profileJson, token);
        }

        @JavascriptInterface
        public void onToken(String token) {
            Log.d(TAG, "Bridge captured token fallback");
            if (!dataIntercepted) {
                // Keep token ready in case direct attendance payload takes a second
            }
        }
    }

    private synchronized void handleInterceptedData(String rawJson, String profileJson, String token) {
        if (dataIntercepted) return;
        dataIntercepted = true;

        Log.i(TAG, "Authentic university attendance intercepted! Closing portal dialog...");

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
                try {
                    JSObject ret = new JSObject();
                    ret.put("success", true);
                    ret.put("raw_attendance", rawJson);
                    ret.put("profile", profileJson != null ? profileJson : "{}");
                    ret.put("token", token != null ? token : "");
                    savedCall.resolve(ret);
                } catch (Exception e) {
                    savedCall.reject("Failed to parse intercepted data: " + e.getMessage());
                }
                savedCall = null;
            }
        });
    }

    private static final String INJECT_SCRIPT =
        "(function() {" +
        "  if (window.__cue_hook_installed) return;" +
        "  window.__cue_hook_installed = true;" +
        "" +
        "  function getProfile() {" +
        "    try {" +
        "      for (var i = 0; i < sessionStorage.length; i++) {" +
        "        var k = sessionStorage.key(i);" +
        "        var v = sessionStorage.getItem(k);" +
        "        if (v && v.indexOf('{') === 0 && (k.indexOf('oidc.user') !== -1 || k.indexOf('profile') !== -1)) {" +
        "          return v;" +
        "        }" +
        "      }" +
        "    } catch(e) {}" +
        "    return '{}';" +
        "  }" +
        "" +
        "  function getToken() {" +
        "    try {" +
        "      for (var i = 0; i < sessionStorage.length; i++) {" +
        "        var k = sessionStorage.key(i);" +
        "        var v = sessionStorage.getItem(k);" +
        "        if (!v) continue;" +
        "        if (v.indexOf('{') === 0) {" +
        "          try {" +
        "            var p = JSON.parse(v);" +
        "            if (p && p.access_token) return p.access_token;" +
        "          } catch(e) {}" +
        "        }" +
        "        if (v.length > 50 && v.indexOf('eyJ') === 0) return v;" +
        "      }" +
        "    } catch(e) {}" +
        "    return '';" +
        "  }" +
        "" +
        "  function checkAndNotify(url, bodyText) {" +
        "    if (!bodyText || bodyText.length < 20) return;" +
        "    var u = (url || '').toLowerCase();" +
        "    if (u.indexOf('coursewiseattendance') !== -1 || u.indexOf('attendancecbcs') !== -1 || u.indexOf('getattendancedetailsbysemester') !== -1) {" +
        "      console.log('[CUE Hook] Intercepted course attendance response!');" +
        "      try {" +
        "        window.CUEBridge.onAttendanceResponse(bodyText, getProfile(), getToken());" +
        "      } catch(e) {}" +
        "    }" +
        "  }" +
        "" +
        "  /* Hook window.fetch */" +
        "  var origFetch = window.fetch;" +
        "  window.fetch = function(input, init) {" +
        "    var url = typeof input === 'string' ? input : (input && input.url ? input.url : '');" +
        "    return origFetch.apply(this, arguments).then(function(res) {" +
        "      try {" +
        "        var clone = res.clone();" +
        "        clone.text().then(function(txt) {" +
        "          checkAndNotify(url, txt);" +
        "        });" +
        "      } catch(e) {}" +
        "      return res;" +
        "    });" +
        "  };" +
        "" +
        "  /* Hook XMLHttpRequest */" +
        "  var origOpen = XMLHttpRequest.prototype.open;" +
        "  var origSend = XMLHttpRequest.prototype.send;" +
        "  XMLHttpRequest.prototype.open = function(method, url) {" +
        "    this.__hook_url = url;" +
        "    return origOpen.apply(this, arguments);" +
        "  };" +
        "  XMLHttpRequest.prototype.send = function() {" +
        "    var self = this;" +
        "    this.addEventListener('load', function() {" +
        "      try {" +
        "        checkAndNotify(self.__hook_url, self.responseText);" +
        "      } catch(e) {}" +
        "    });" +
        "    return origSend.apply(this, arguments);" +
        "  };" +
        "" +
        "  /* Periodic scanner fallback in case React rendered without fetch triggers */" +
        "  setInterval(function() {" +
        "    var tok = getToken();" +
        "    if (tok && tok.length > 50) {" +
        "      try { window.CUEBridge.onToken(tok); } catch(e) {}" +
        "    }" +
        "  }, 500);" +
        "})();";

    @PluginMethod
    public void openPortalLogin(PluginCall call) {
        savedCall = call;
        dataIntercepted = false;

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

                webView.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageStarted(WebView view, String url, Bitmap favicon) {
                        super.onPageStarted(view, url, favicon);
                        view.evaluateJavascript(INJECT_SCRIPT, null);
                    }

                    @Override
                    public void onPageFinished(WebView view, String url) {
                        super.onPageFinished(view, url);
                        view.evaluateJavascript(INJECT_SCRIPT, null);
                    }
                });

                loginDialog.setOnDismissListener(dialog -> {
                    if (!dataIntercepted && savedCall != null) {
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
