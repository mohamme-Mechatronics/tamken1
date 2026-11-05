package app.tamken.crm;

import android.Manifest;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Message;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.ServiceWorkerClient;
import android.webkit.ServiceWorkerController;
import android.webkit.ServiceWorkerWebSettings;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;

public class MainActivity extends Activity {
    static final String HOST = "tamken1.lovable.app";
    static final String START = "https://" + HOST + "/";
    static final String OFFLINE_PAGE = "file:///android_asset/offline.html";
    static final int FILE_REQ = 41;
    static final int PERM_REQ = 42;

    WebView web;
    WebView printView;
    ValueCallback<Uri[]> fileCallback;
    String bridgeJs = "";
    boolean triedCache = false;
    ConnectivityManager.NetworkCallback netCallback;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        bridgeJs = readAsset("bridge.js");

        web = new WebView(this);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setTextZoom(100);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setSupportMultipleWindows(true);
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        s.setUserAgentString(s.getUserAgentString() + " TamkenAndroid/1.0");
        s.setCacheMode(isOnline() ? WebSettings.LOAD_DEFAULT : WebSettings.LOAD_CACHE_ELSE_NETWORK);

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);

        // Keep the site's offline service worker working inside the app.
        ServiceWorkerController swc = ServiceWorkerController.getInstance();
        swc.setServiceWorkerClient(new ServiceWorkerClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) { return null; }
        });
        ServiceWorkerWebSettings sws = swc.getServiceWorkerWebSettings();
        sws.setAllowContentAccess(true);
        sws.setCacheMode(isOnline() ? WebSettings.LOAD_DEFAULT : WebSettings.LOAD_CACHE_ELSE_NETWORK);

        web.addJavascriptInterface(new Bridge(), "TamkenAndroid");
        web.setWebViewClient(new Client());
        web.setWebChromeClient(new Chrome());
        web.setDownloadListener((url, ua, cd, mime, len) -> {
            if (url.startsWith("blob:") || url.startsWith("data:")) return; // handled by bridge.js
            String name = URLUtil.guessFileName(url, cd, mime);
            try {
                DownloadManager.Request r = new DownloadManager.Request(Uri.parse(url));
                r.setMimeType(mime);
                r.addRequestHeader("User-Agent", ua);
                r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                r.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name);
                ((DownloadManager) getSystemService(DOWNLOAD_SERVICE)).enqueue(r);
                toast("جارٍ تنزيل " + name);
            } catch (Exception e) {
                openExternal(url);
            }
        });

        watchNetwork();

        if (state != null) web.restoreState(state);
        else web.loadUrl(START);
    }

    // ---------- network ----------
    boolean isOnline() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return true;
        Network n = cm.getActiveNetwork();
        if (n == null) return false;
        NetworkCapabilities c = cm.getNetworkCapabilities(n);
        return c != null && c.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
    }

    void applyCacheMode(boolean online) {
        int mode = online ? WebSettings.LOAD_DEFAULT : WebSettings.LOAD_CACHE_ELSE_NETWORK;
        web.getSettings().setCacheMode(mode);
        try { ServiceWorkerController.getInstance().getServiceWorkerWebSettings().setCacheMode(mode); } catch (Exception ignored) {}
    }

    void watchNetwork() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return;
        netCallback = new ConnectivityManager.NetworkCallback() {
            @Override public void onAvailable(Network network) {
                runOnUiThread(() -> {
                    applyCacheMode(true);
                    triedCache = false;
                    String u = web.getUrl();
                    if (u != null && u.startsWith(OFFLINE_PAGE)) web.loadUrl(START);
                });
            }
            @Override public void onLost(Network network) {
                runOnUiThread(() -> applyCacheMode(isOnline()));
            }
        };
        try { cm.registerDefaultNetworkCallback(netCallback); } catch (Exception ignored) {}
    }

    // ---------- links ----------
    boolean isOurs(Uri u) {
        return u != null && "https".equals(u.getScheme()) && HOST.equalsIgnoreCase(u.getHost());
    }

    void openExternal(String url) {
        try {
            Intent i;
            if (url.startsWith("intent:")) i = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
            else i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (ActivityNotFoundException e) {
            toast("لا يوجد تطبيق يفتح هذا الرابط");
        } catch (Exception e) {
            toast("تعذر فتح الرابط");
        }
    }

    class Client extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
            Uri u = req.getUrl();
            if (isOurs(u)) return false;
            String sc = u.getScheme();
            if ("about".equals(sc) || "blob".equals(sc) || "data".equals(sc) || "file".equals(sc)) return false;
            openExternal(u.toString());
            return true;
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            super.onPageStarted(view, url, favicon);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            if (url != null && url.startsWith("https://" + HOST)) {
                view.evaluateJavascript(bridgeJs, null);
                CookieManager.getInstance().flush();
            }
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
            if (!req.isForMainFrame()) return;
            if (!triedCache) {
                // Retry from what the phone already saved before giving up.
                triedCache = true;
                applyCacheMode(false);
                view.loadUrl(req.getUrl().toString());
                return;
            }
            view.loadUrl(OFFLINE_PAGE);
        }
    }

    class Chrome extends WebChromeClient {
        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> cb, FileChooserParams params) {
            if (fileCallback != null) fileCallback.onReceiveValue(null);
            fileCallback = cb;
            try {
                Intent i = params.createIntent();
                if (params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                startActivityForResult(Intent.createChooser(i, "اختر ملفاً"), FILE_REQ);
            } catch (Exception e) {
                fileCallback = null;
                cb.onReceiveValue(null);
                return false;
            }
            return true;
        }

        // window.open(): links to our site stay in the app, anything else (WhatsApp, PDFs) opens outside.
        @Override
        public boolean onCreateWindow(WebView view, boolean isDialog, boolean userGesture, Message resultMsg) {
            final WebView popup = new WebView(MainActivity.this);
            popup.setWebViewClient(new WebViewClient() {
                boolean done = false;
                void route(String url) {
                    if (done || url == null || url.equals("about:blank") || url.isEmpty()) return;
                    done = true;
                    Uri u = Uri.parse(url);
                    if (isOurs(u)) web.loadUrl(url); else openExternal(url);
                    popup.post(popup::destroy);
                }
                @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) { route(r.getUrl().toString()); return true; }
                @Override public void onPageStarted(WebView v, String url, Bitmap f) { route(url); }
            });
            WebView.WebViewTransport t = (WebView.WebViewTransport) resultMsg.obj;
            t.setWebView(popup);
            resultMsg.sendToTarget();
            return true;
        }
    }

    @Override
    protected void onActivityResult(int req, int result, Intent data) {
        if (req == FILE_REQ) {
            if (fileCallback != null) {
                Uri[] uris = null;
                if (result == RESULT_OK && data != null) {
                    if (data.getClipData() != null) {
                        int n = data.getClipData().getItemCount();
                        uris = new Uri[n];
                        for (int k = 0; k < n; k++) uris[k] = data.getClipData().getItemAt(k).getUri();
                    } else if (data.getData() != null) {
                        uris = new Uri[]{data.getData()};
                    }
                }
                fileCallback.onReceiveValue(uris);
                fileCallback = null;
            }
            return;
        }
        super.onActivityResult(req, result, data);
    }

    // ---------- JS bridge ----------
    class Bridge {
        @JavascriptInterface
        public void retry() {
            runOnUiThread(() -> {
                triedCache = false;
                applyCacheMode(isOnline());
                web.loadUrl(START);
            });
        }

        @JavascriptInterface
        public void printHtml(final String html, final String title, final String baseUrl) {
            runOnUiThread(() -> doPrint(html, title, baseUrl));
        }

        @JavascriptInterface
        public void saveFile(final String b64, final String name, final String mime) {
            runOnUiThread(() -> doSave(b64, name, mime));
        }
    }

    void doPrint(String html, String title, String baseUrl) {
        final String jobName = (title == null || title.trim().isEmpty()) ? "Tamken" : title.trim();
        printView = new WebView(this);
        printView.getSettings().setJavaScriptEnabled(false);
        printView.setWebViewClient(new WebViewClient() {
            boolean sent = false;
            @Override public void onPageFinished(WebView v, String url) {
                if (sent) return;
                sent = true;
                v.postDelayed(() -> {
                    PrintManager pm = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                    PrintAttributes attrs = new PrintAttributes.Builder()
                            .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                            .build();
                    pm.print(jobName, v.createPrintDocumentAdapter(jobName), attrs);
                }, 400);
            }
        });
        printView.loadDataWithBaseURL(baseUrl, html, "text/html", "utf-8", null);
    }

    String pendingB64, pendingName, pendingMime;

    void doSave(String b64, String name, String mime) {
        String safe = name.replaceAll("[\\\\/:*?\"<>|]", "_");
        byte[] bytes;
        try { bytes = Base64.decode(b64, Base64.DEFAULT); } catch (Exception e) { toast("تعذر حفظ الملف"); return; }
        try {
            if (Build.VERSION.SDK_INT >= 29) {
                ContentResolver cr = getContentResolver();
                ContentValues v = new ContentValues();
                v.put(MediaStore.Downloads.DISPLAY_NAME, safe);
                v.put(MediaStore.Downloads.MIME_TYPE, mime);
                v.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Tamken");
                Uri uri = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                if (uri == null) throw new Exception("no uri");
                try (OutputStream os = cr.openOutputStream(uri)) { os.write(bytes); }
                toast("تم الحفظ في التنزيلات: " + safe);
                Intent i = new Intent(Intent.ACTION_VIEW);
                i.setDataAndType(uri, mime);
                i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                try { startActivity(Intent.createChooser(i, safe)); } catch (Exception ignored) {}
            } else {
                if (checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                    pendingB64 = b64; pendingName = name; pendingMime = mime;
                    requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, PERM_REQ);
                    return;
                }
                File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!dir.exists()) dir.mkdirs();
                File f = new File(dir, safe);
                try (FileOutputStream os = new FileOutputStream(f)) { os.write(bytes); }
                DownloadManager dm = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                dm.addCompletedDownload(safe, "Tamken", true, mime, f.getAbsolutePath(), bytes.length, true);
                toast("تم الحفظ في التنزيلات: " + safe);
            }
        } catch (Exception e) {
            toast("تعذر حفظ الملف");
        }
    }

    @Override
    public void onRequestPermissionsResult(int req, String[] perms, int[] res) {
        if (req == PERM_REQ && pendingB64 != null) {
            String b = pendingB64, n = pendingName, m = pendingMime;
            pendingB64 = null;
            if (res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED) doSave(b, n, m);
            else toast("يلزم السماح بالتخزين لحفظ الملف");
        }
    }

    // ---------- lifecycle ----------
    @Override
    public void onBackPressed() {
        String u = web.getUrl();
        if (u != null && u.startsWith(OFFLINE_PAGE)) { finish(); return; }
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onPause() {
        super.onPause();
        CookieManager.getInstance().flush();
    }

    @Override
    protected void onDestroy() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm != null && netCallback != null) cm.unregisterNetworkCallback(netCallback);
        } catch (Exception ignored) {}
        super.onDestroy();
    }

    void toast(String m) { Toast.makeText(this, m, Toast.LENGTH_LONG).show(); }

    String readAsset(String name) {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader r = new BufferedReader(new InputStreamReader(getAssets().open(name), "UTF-8"))) {
            String line;
            while ((line = r.readLine()) != null) sb.append(line).append('\n');
        } catch (Exception ignored) {}
        return sb.toString();
    }
}
