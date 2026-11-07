package in.ac.christuniversity.attendance;

import android.app.Dialog;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CUEAuth")
public class CUEAuthPlugin extends Plugin {
    private Dialog loginDialog;
    private Handler pollerHandler;
    private Runnable pollerRunnable;

    @PluginMethod
    public void openPortalLogin(PluginCall call) {
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
                settings.setUserAgentString(settings.getUserAgentString() + " Chrome/120.0.0.0 Mobile");

                CookieManager.getInstance().setAcceptCookie(true);
                CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

                pollerHandler = new Handler(Looper.getMainLooper());
                final boolean[] tokenFound = {false};

                pollerRunnable = new Runnable() {
                    @Override
                    public void run() {
                        if (tokenFound[0] || loginDialog == null || !loginDialog.isShowing()) {
                            return;
                        }

                        // Inspect sessionStorage and localStorage for the Christ University ESPRO JWT token
                        webView.evaluateJavascript(
                            "(function() { try { return sessionStorage.getItem('token') || localStorage.getItem('token') || ''; } catch(e) { return ''; } })();",
                            new ValueCallback<String>() {
                                @Override
                                public void onReceiveValue(String value) {
                                    if (value != null && value.length() > 30 && !value.equals("\"\"") && !value.equals("null")) {
                                        tokenFound[0] = true;
                                        String cleanToken = value.replace("\"", "").trim();
                                        if (loginDialog != null && loginDialog.isShowing()) {
                                            loginDialog.dismiss();
                                        }
                                        JSObject ret = new JSObject();
                                        ret.put("token", cleanToken);
                                        call.resolve(ret);
                                        return;
                                    }
                                }
                            }
                        );

                        if (!tokenFound[0]) {
                            pollerHandler.postDelayed(this, 1000);
                        }
                    }
                };

                webView.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        super.onPageFinished(view, url);
                        pollerHandler.post(pollerRunnable);
                    }
                });

                loginDialog.setOnDismissListener(dialog -> {
                    if (pollerHandler != null && pollerRunnable != null) {
                        pollerHandler.removeCallbacks(pollerRunnable);
                    }
                    if (!tokenFound[0]) {
                        call.reject("Login cancelled by user");
                    }
                });

                rootLayout.addView(webView);
                loginDialog.setContentView(rootLayout);
                loginDialog.show();

                webView.loadUrl("https://cue.christuniversity.in");
            } catch (Exception e) {
                call.reject("Failed to open login dialog: " + e.getMessage());
            }
        });
    }
}

