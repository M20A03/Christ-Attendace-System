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

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.Map;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

@CapacitorPlugin(name = "CUEAuth")
public class CUEAuthPlugin extends Plugin {
    private static final String TAG = "CUEAuthPlugin";
    private static final String PORTAL_BASE = "https://espro.christuniversity.in:84";

    private Dialog loginDialog;
    private Handler scannerHandler;
    private Runnable scannerRunnable;
    private boolean tokenFound = false;
    private PluginCall savedCall;

    public class CUEAuthBridge {
        @JavascriptInterface
        public void onToken(String token) {
            if (token != null && isJwtToken(token)) {
                Log.d(TAG, "Bridge captured access token!");
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
        Log.i(TAG, "Delivered valid access token! Automatically closing ESPRO login window...");

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
        "  function inspectToken(val) {" +
        "    if (!val) return;" +
        "    if (typeof val === 'string') {" +
        "      val = val.trim();" +
        "      if (val.indexOf('{') === 0) {" +
        "        try {" +
        "          var p = JSON.parse(val);" +
        "          if (p && p.access_token && typeof p.access_token === 'string' && p.access_token.indexOf('eyJ') === 0) {" +
        "            try { window.CUEBridge.onToken(p.access_token); return; } catch(e) {}" +
        "          }" +
        "        } catch(e) {}" +
        "      }" +
        "      if (val.length > 50 && val.indexOf('eyJ') === 0) {" +
        "        try { window.CUEBridge.onToken(val); } catch(e) {}" +
        "      }" +
        "    }" +
        "  }" +
        "  function scanStorage() {" +
        "    try {" +
        "      var stores = [sessionStorage, localStorage];" +
        "      for (var s = 0; s < stores.length; s++) {" +
        "        var store = stores[s];" +
        "        for (var i = 0; i < store.length; i++) {" +
        "          var k = store.key(i);" +
        "          var val = store.getItem(k);" +
        "          inspectToken(val);" +
        "        }" +
        "      }" +
        "    } catch(e) {}" +
        "  }" +
        "  try {" +
        "    var origSetItem = sessionStorage.setItem;" +
        "    sessionStorage.setItem = function(k, v) {" +
        "      inspectToken(v);" +
        "      return origSetItem.apply(this, arguments);" +
        "    };" +
        "    var origLocalSet = localStorage.setItem;" +
        "    localStorage.setItem = function(k, v) {" +
        "      inspectToken(v);" +
        "      return origLocalSet.apply(this, arguments);" +
        "    };" +
        "  } catch(e) {}" +
        "  try {" +
        "    var origOpen = XMLHttpRequest.prototype.open;" +
        "    var origSetHeader = XMLHttpRequest.prototype.setRequestHeader;" +
        "    XMLHttpRequest.prototype.setRequestHeader = function(h, v) {" +
        "      if (h && (h.toLowerCase() === 'authorization' || h.toLowerCase() === 'dpop') && v) {" +
        "        var parts = v.split(' ');" +
        "        var tok = parts.length > 1 ? parts[1] : v;" +
        "        if (tok && tok.indexOf('eyJ') === 0) inspectToken(tok);" +
        "      }" +
        "      return origSetHeader.apply(this, arguments);" +
        "    };" +
        "  } catch(e) {}" +
        "  try {" +
        "    var origFetch = window.fetch;" +
        "    window.fetch = function(url, init) {" +
        "      if (init && init.headers) {" +
        "        var h = init.headers;" +
        "        var auth = (h instanceof Headers) ? (h.get('authorization') || h.get('dpop')) : (h['Authorization'] || h['authorization'] || h['DPoP'] || h['dpop']);" +
        "        if (auth) {" +
        "          var parts = auth.split(' ');" +
        "          var tok = parts.length > 1 ? parts[1] : auth;" +
        "          if (tok && tok.indexOf('eyJ') === 0) inspectToken(tok);" +
        "        }" +
        "      }" +
        "      return origFetch.apply(this, arguments);" +
        "    };" +
        "  } catch(e) {}" +
        "  scanStorage();" +
        "  setInterval(scanStorage, 350);" +
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
                            "    var stores = [sessionStorage, localStorage];" +
                            "    for (var s = 0; s < stores.length; s++) {" +
                            "      var store = stores[s];" +
                            "      for (var i = 0; i < store.length; i++) {" +
                            "        var k = store.key(i);" +
                            "        var val = store.getItem(k);" +
                            "        if (!val) continue;" +
                            "        if (val.indexOf('{') === 0) {" +
                            "          try {" +
                            "            var p = JSON.parse(val);" +
                            "            if (p && p.access_token && p.access_token.indexOf('eyJ') === 0) return p.access_token;" +
                            "          } catch(e) {}" +
                            "        }" +
                            "        if (val.length > 50 && val.indexOf('eyJ') === 0 && !k.toLowerCase().includes('id_token')) return val;" +
                            "      }" +
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
                                String key = entry.getKey();
                                if (key.equalsIgnoreCase("Authorization") || key.equalsIgnoreCase("DPoP")) {
                                    String auth = entry.getValue();
                                    if (auth != null) {
                                        String[] parts = auth.split(" ");
                                        String candidate = parts.length > 1 ? parts[1].trim() : auth.trim();
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

    /**
     * Directly calls Christ University ESPro internal APIs on port 84 from the user's phone.
     */
    @PluginMethod
    public void fetchLiveAttendance(PluginCall call) {
        String token = call.getString("token");
        if (token == null || token.trim().isEmpty()) {
            call.reject("Token required");
            return;
        }

        new Thread(() -> {
            try {
                // Step 1: getStudentSemesters
                String semUrl = PORTAL_BASE + "/ClassRoomAttendanceServices/Student/StudentAttendance/getStudentSemesters";
                String semRes = makePortalPost(semUrl, "{}", token);
                Log.d(TAG, "getStudentSemesters response: " + semRes);

                JSONArray sessions = null;
                if (semRes.trim().startsWith("[")) {
                    sessions = new JSONArray(semRes);
                } else if (semRes.trim().startsWith("{")) {
                    JSONObject obj = new JSONObject(semRes);
                    if (obj.has("data")) {
                        sessions = obj.getJSONArray("data");
                    }
                }

                JSONObject currentSess = null;
                if (sessions != null && sessions.length() > 0) {
                    for (int i = 0; i < sessions.length(); i++) {
                        JSONObject s = sessions.getJSONObject(i);
                        if (s.optBoolean("isCurrent", false)) {
                            currentSess = s;
                            break;
                        }
                    }
                    if (currentSess == null) {
                        currentSess = sessions.getJSONObject(0);
                    }
                }

                Double overallPercentage = null;
                JSONArray coursesList = null;

                if (currentSess != null) {
                    String sessionId = currentSess.optString("sessionId", "");
                    boolean callKp = currentSess.optBoolean("callKpServiceNew", false);
                    String termNo = currentSess.optString("termNumber", currentSess.optString("semester", ""));

                    if (callKp && !termNo.isEmpty()) {
                        String kpUrl = PORTAL_BASE + "/KPServiceNew/rest/getAttendanceDetailsBySemester?termNo=" + termNo;
                        String kpRes = makePortalPost(kpUrl, "{}", token);
                        if (kpRes.trim().startsWith("[")) {
                            coursesList = new JSONArray(kpRes);
                        } else if (kpRes.trim().startsWith("{")) {
                            JSONObject kObj = new JSONObject(kpRes);
                            if (kObj.has("data")) coursesList = kObj.getJSONArray("data");
                        }
                    }

                    if (coursesList == null && !sessionId.isEmpty()) {
                        // getAttendanceCount
                        try {
                            String countUrl = PORTAL_BASE + "/ClassRoomAttendanceServices/Student/StudentAttendance/getAttendanceCount?sessionId=" + sessionId;
                            String countRes = makePortalPost(countUrl, "{}", token);
                            if (countRes.trim().startsWith("{")) {
                                JSONObject cObj = new JSONObject(countRes);
                                if (cObj.has("overallPercentage")) {
                                    overallPercentage = cObj.optDouble("overallPercentage");
                                } else if (cObj.has("overall")) {
                                    overallPercentage = cObj.optDouble("overall");
                                }
                            }
                        } catch (Exception ce) {
                            Log.w(TAG, "Count fetch failed: " + ce.getMessage());
                        }

                        // getCourseWiseAttendance
                        String courseUrl = PORTAL_BASE + "/ClassRoomAttendanceServices/Student/StudentAttendance/getCourseWiseAttendance?sessionId=" + sessionId;
                        String courseRes = makePortalPost(courseUrl, "{}", token);
                        if (courseRes.trim().startsWith("[")) {
                            coursesList = new JSONArray(courseRes);
                        } else if (courseRes.trim().startsWith("{")) {
                            JSONObject cObj = new JSONObject(courseRes);
                            if (cObj.has("data")) coursesList = cObj.getJSONArray("data");
                        }
                    }
                }

                // Fallback to KPServiceNew if courses still null
                if (coursesList == null || coursesList.length() == 0) {
                    String[] fallbacks = new String[]{
                        PORTAL_BASE + "/KPServiceNew/rest/getAttendanceCBCS",
                        PORTAL_BASE + "/KPServiceNew/rest/getAttendanceDetailsBySemester?termNo=1"
                    };
                    for (String fbUrl : fallbacks) {
                        try {
                            String fbRes = makePortalPost(fbUrl, "{}", token);
                            if (fbRes.trim().startsWith("[")) {
                                coursesList = new JSONArray(fbRes);
                                if (coursesList.length() > 0) break;
                            }
                        } catch (Exception ignored) {}
                    }
                }

                if (coursesList != null && coursesList.length() > 0) {
                    JSArray subjectsArray = new JSArray();
                    int totalAttended = 0;
                    int totalConducted = 0;

                    for (int i = 0; i < coursesList.length(); i++) {
                        JSONObject c = coursesList.getJSONObject(i);
                        String name = c.optString("courseName", c.optString("subjectName", c.optString("subject", "Subject " + (i + 1))));
                        int att = c.optInt("classesAttended", c.optInt("attendedClasses", c.optInt("attended", c.optInt("presentCount", 0))));
                        int tot = c.optInt("totalClasses", c.optInt("totalConducted", c.optInt("total", c.optInt("totalCount", 0))));

                        double pct;
                        if (c.has("percentage") && !c.isNull("percentage")) {
                            pct = c.getDouble("percentage");
                        } else if (c.has("overallPercentage") && !c.isNull("overallPercentage")) {
                            pct = c.getDouble("overallPercentage");
                        } else {
                            pct = tot > 0 ? Math.round(((double) att / tot * 100.0) * 10.0) / 10.0 : 0.0;
                        }

                        totalAttended += att;
                        totalConducted += tot;

                        JSObject subObj = new JSObject();
                        subObj.put("name", name);
                        subObj.put("attended", att);
                        subObj.put("total", tot);
                        subObj.put("percentage", pct);
                        subObj.put("subject_code", c.optString("courseCode", c.optString("subjectCode", "")));
                        subObj.put("faculty", c.optString("staffName", c.optString("facultyName", "")));
                        subjectsArray.put(subObj);
                    }

                    double finalOverall = overallPercentage != null ? overallPercentage :
                        (totalConducted > 0 ? Math.round(((double) totalAttended / totalConducted * 100.0) * 10.0) / 10.0 : 0.0);

                    SimpleDateFormat sdf = new SimpleDateFormat("hh:mm a", Locale.getDefault());
                    String lastUpdated = sdf.format(new Date());

                    JSObject data = new JSObject();
                    data.put("overall_attendance", finalOverall);
                    data.put("subjects", subjectsArray);
                    data.put("today_classes", new JSArray());
                    data.put("last_updated", lastUpdated);

                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("data", data);
                    call.resolve(result);
                    return;
                }

                JSObject fail = new JSObject();
                fail.put("success", false);
                fail.put("error", "No courses returned from portal");
                call.resolve(fail);

            } catch (Exception e) {
                Log.e(TAG, "Error in fetchLiveAttendance: " + e.getMessage(), e);
                JSObject err = new JSObject();
                err.put("success", false);
                err.put("error", e.getMessage());
                call.resolve(err);
            }
        }).start();
    }

    private String makePortalPost(String targetUrl, String body, String token) throws Exception {
        TrustManager[] trustAllCerts = new TrustManager[]{
            new X509TrustManager() {
                public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
                public void checkClientTrusted(X509Certificate[] certs, String authType) {}
                public void checkServerTrusted(X509Certificate[] certs, String authType) {}
            }
        };

        SSLContext sc = SSLContext.getInstance("SSL");
        sc.init(null, trustAllCerts, new SecureRandom());
        HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());
        HttpsURLConnection.setDefaultHostnameVerifier((hostname, session) -> true);

        URL url = new URL(targetUrl);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setConnectTimeout(12000);
        conn.setReadTimeout(12000);
        conn.setDoInput(true);
        conn.setDoOutput(true);

        conn.setRequestProperty("Authorization", "Bearer " + token);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Accept", "application/json, text/plain, */*");
        conn.setRequestProperty("Origin", "https://cue.christuniversity.in");
        conn.setRequestProperty("Referer", "https://cue.christuniversity.in/");
        conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/122.0.0.0 Mobile Safari/537.36");

        if (body != null && !body.isEmpty()) {
            OutputStream os = conn.getOutputStream();
            os.write(body.getBytes("UTF-8"));
            os.close();
        }

        int responseCode = conn.getResponseCode();
        InputStream is = (responseCode >= 200 && responseCode < 400) ? conn.getInputStream() : conn.getErrorStream();
        if (is == null) return "{}";

        BufferedReader reader = new BufferedReader(new InputStreamReader(is, "UTF-8"));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        reader.close();
        conn.disconnect();

        return sb.toString();
    }
}
