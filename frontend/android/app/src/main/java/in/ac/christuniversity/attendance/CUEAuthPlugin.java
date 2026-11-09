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
            if (token != null && token.length() > 50 && !dataIntercepted) {
                // If direct attendance interception doesn't trigger within 4 seconds, complete with token
                if (autoCloseHandler == null) {
                    autoCloseHandler = new Handler(Looper.getMainLooper());
                    autoCloseRunnable = () -> {
                        if (!dataIntercepted) {
                            Log.i(TAG, "Proceeding with captured authentic portal token fallback");
                            handleInterceptedData(null, null, token);
                        }
                    };
                    autoCloseHandler.postDelayed(autoCloseRunnable, 4000);
                }
            }
        }
    }

    private synchronized void handleInterceptedData(String rawJson, String profileJson, String token) {
        if (dataIntercepted) return;
        dataIntercepted = true;

        if (rawJson != null) {
            Log.i(TAG, "Authentic attendance intercepted (len=" + rawJson.length() + "): " + rawJson.substring(0, Math.min(250, rawJson.length())));
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
        "  var lastCountData = null;" +
        "  var lastHostelData = null;" +
        "  function checkAndNotify(url, bodyText) {" +
        "    if (!bodyText || bodyText.length < 10) return;" +
        "    var u = (url || '').toLowerCase();" +
        "    if (u.indexOf('getattendancecount') !== -1) {" +
        "      try {" +
        "        lastCountData = JSON.parse(bodyText);" +
        "      } catch(e) {}" +
        "    }" +
        "    if (u.indexOf('gethostelbiometric') !== -1) {" +
        "      try {" +
        "        lastHostelData = JSON.parse(bodyText);" +
        "      } catch(e) {}" +
        "    }" +
        "    if (u.indexOf('coursewiseattendance') !== -1 || u.indexOf('attendancecbcs') !== -1 || u.indexOf('getattendancedetailsbysemester') !== -1) {" +
        "      console.log('[CUE Hook] Intercepted course attendance response!');" +
        "      try {" +
        "        var payload = bodyText;" +
        "        if (lastCountData || lastHostelData) {" +
        "          try {" +
        "            payload = JSON.stringify({" +
        "              countInfo: lastCountData," +
        "              hostelData: lastHostelData," +
        "              courseData: JSON.parse(bodyText)" +
        "            });" +
        "          } catch(e) {}" +
        "        }" +
        "        window.CUEBridge.onAttendanceResponse(payload, getProfile(), getToken());" +
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
        "  /* Active portal attendance fetcher as soon as Keycloak token is found */" +
        "  var activeTriggered = false;" +
        "  function triggerActiveAttendancePull(tok) {" +
        "    if (activeTriggered) return;" +
        "    activeTriggered = true;" +
        "    var h = {" +
        "      'Authorization': 'Bearer ' + tok," +
        "      'Content-Type': 'application/json'," +
        "      'Accept': 'application/json, text/plain, */*'" +
        "    };" +
        "    var base = 'https://espro.christuniversity.in:84';" +
        "    fetch(base + '/ClassRoomAttendanceServices/Student/StudentAttendance/getStudentSemesters', {" +
        "      method: 'POST'," +
        "      headers: h," +
        "      body: '{}'" +
        "    })" +
        "    .then(function(r) { return r.json(); })" +
        "    .then(function(semData) {" +
        "      var sessList = Array.isArray(semData) ? semData : (semData.data || []);" +
        "      var curSess = sessList.find(function(s) { return s && s.isCurrent; }) || sessList[0];" +
        "      var sessId = curSess ? curSess.sessionId : null;" +
        "      var termNo = curSess ? (curSess.termNumber || curSess.semester) : null;" +
        "      var callKp = curSess ? curSess.callKpServiceNew : false;" +
        "      if (callKp && termNo) {" +
        "        return fetch(base + '/KPServiceNew/rest/getAttendanceDetailsBySemester?termNo=' + termNo, { method: 'POST', headers: h, body: '{}' })" +
        "          .then(function(r) { return r.text(); })" +
        "          .then(function(txt) { checkAndNotify('attendancecbcs', txt); });" +
        "      }" +
        "      if (sessId) {" +
        "        fetch(base + '/ClassRoomAttendanceServices/Student/StudentAttendance/getAttendanceCount?sessionId=' + sessId, { method: 'POST', headers: h, body: '{}' })" +
        "          .then(function(r) { return r.text(); })" +
        "          .then(function(cTxt) {" +
        "            try { lastCountData = JSON.parse(cTxt); } catch(e) {}" +
        "            return fetch(base + '/ClassRoomAttendanceServices/Student/StudentAttendance/getCourseWiseAttendance?sessionId=' + sessId, { method: 'POST', headers: h, body: '{}' })" +
        "              .then(function(r) { return r.text(); })" +
        "              .then(function(courseTxt) {" +
        "                checkAndNotify('coursewiseattendance', courseTxt);" +
        "              });" +
        "          })" +
        "          .catch(function() {" +
        "            fetch(base + '/KPServiceNew/rest/getAttendanceCBCS', { method: 'POST', headers: h, body: '{}' })" +
        "              .then(function(r) { return r.text(); })" +
        "              .then(function(txt) { checkAndNotify('attendancecbcs', txt); });" +
        "          });" +
        "      } else {" +
        "        fetch(base + '/KPServiceNew/rest/getAttendanceCBCS', { method: 'POST', headers: h, body: '{}' })" +
        "          .then(function(r) { return r.text(); })" +
        "          .then(function(txt) { checkAndNotify('attendancecbcs', txt); });" +
        "      }" +
        "    })" +
        "    .catch(function() {" +
        "      fetch(base + '/KPServiceNew/rest/getAttendanceCBCS', { method: 'POST', headers: h, body: '{}' })" +
        "        .then(function(r) { return r.text(); })" +
        "        .then(function(txt) { checkAndNotify('attendancecbcs', txt); })" +
        "        .catch(function() {});" +
        "    });" +
        "  }" +
        "" +
        "  /* Periodic scanner fallback */" +
        "  setInterval(function() {" +
        "    var tok = getToken();" +
        "    if (tok && tok.length > 50) {" +
        "      triggerActiveAttendancePull(tok);" +
        "      try { window.CUEBridge.onToken(tok); } catch(e) {}" +
        "    }" +
        "  }, 600);" +
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

    private WebView refreshWebView;
    private boolean refreshIntercepted = false;

    public class CUERefreshBridge {
        private PluginCall call;
        public CUERefreshBridge(PluginCall call) {
            this.call = call;
        }

        @JavascriptInterface
        public void onAttendanceResponse(String rawJson, String profileJson, String token) {
            Log.d(TAG, "CUERefreshBridge intercepted fresh attendance!");
            if (refreshIntercepted) return;
            refreshIntercepted = true;

            getActivity().runOnUiThread(() -> {
                try {
                    if (refreshWebView != null) {
                        refreshWebView.destroy();
                        refreshWebView = null;
                    }
                } catch (Exception ignored) {}

                if (call != null) {
                    try {
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        ret.put("raw_attendance", rawJson);
                        ret.put("profile", profileJson != null ? profileJson : "{}");
                        ret.put("token", token != null ? token : "");
                        call.resolve(ret);
                    } catch (Exception e) {
                        call.reject("Failed to format fresh attendance: " + e.getMessage());
                    }
                    call = null;
                }
            });
        }

        @JavascriptInterface
        public void onToken(String token) {
            // Token fallback
        }
    }

    @PluginMethod
    public void silentRefresh(PluginCall call) {
        refreshIntercepted = false;

        getActivity().runOnUiThread(() -> {
            try {
                Context context = getContext();
                if (refreshWebView != null) {
                    try { refreshWebView.destroy(); } catch (Exception ignored) {}
                    refreshWebView = null;
                }

                refreshWebView = new WebView(context);
                WebSettings settings = refreshWebView.getSettings();
                settings.setJavaScriptEnabled(true);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setUserAgentString(settings.getUserAgentString() + " Chrome/122.0.0.0 Mobile");

                CookieManager.getInstance().setAcceptCookie(true);
                CookieManager.getInstance().setAcceptThirdPartyCookies(refreshWebView, true);

                refreshWebView.addJavascriptInterface(new CUERefreshBridge(call), "CUEBridge");

                refreshWebView.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        super.onPageFinished(view, url);
                        view.evaluateJavascript(INJECT_SCRIPT, null);
                    }
                });

                // Safety timeout: 7.5 seconds
                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    if (!refreshIntercepted) {
                        try {
                            if (refreshWebView != null) {
                                refreshWebView.destroy();
                                refreshWebView = null;
                            }
                        } catch (Exception ignored) {}
                        try {
                            call.reject("Silent refresh timed out (session may require re-login)");
                        } catch (Exception ignored) {}
                    }
                }, 7500);

                refreshWebView.loadUrl("https://cue.christuniversity.in");
            } catch (Exception e) {
                call.reject("Silent refresh launch failed: " + e.getMessage());
            }
        });
    }
}
