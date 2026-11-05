(function () {
  if (window.__tamkenBridge) return;
  window.__tamkenBridge = 1;
  var A = window.TamkenAndroid;
  if (!A) return;

  // Printing: WebView ignores window.print(), so hand the page HTML to Android's print screen.
  function htmlOf(doc) { return "<!DOCTYPE html>" + doc.documentElement.outerHTML; }
  window.print = function () { A.printHtml(htmlOf(document), document.title || "", location.href); };
  function patchFrame(f) {
    try {
      var w = f.contentWindow;
      if (!w || w.__tp) return;
      w.__tp = 1;
      w.print = function () {
        var d = f.contentDocument;
        A.printHtml(htmlOf(d), d.title || document.title || "", location.href);
      };
    } catch (e) {}
  }
  function watchFrame(f) {
    patchFrame(f);
    f.addEventListener("load", function () { try { f.contentWindow.__tp = 0; } catch (e) {} patchFrame(f); });
  }
  new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      m.addedNodes.forEach(function (n) {
        if (n.tagName === "IFRAME") watchFrame(n);
        else if (n.querySelectorAll) n.querySelectorAll("iframe").forEach(watchFrame);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
  document.querySelectorAll("iframe").forEach(watchFrame);

  // Downloads of in-page files (CSV export, PDF quotes): save them to the phone's Downloads.
  function save(href, name) {
    fetch(href).then(function (r) { return r.blob(); }).then(function (b) {
      var fr = new FileReader();
      fr.onload = function () {
        var s = String(fr.result);
        A.saveFile(s.slice(s.indexOf(",") + 1), name || "file", b.type || "application/octet-stream");
      };
      fr.readAsDataURL(b);
    }).catch(function () { alert("تعذر حفظ الملف"); });
  }
  function isLocal(a) { return a && a.href && /^(blob|data):/.test(a.href); }
  var oc = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (isLocal(this) && this.hasAttribute("download")) { save(this.href, this.getAttribute("download")); return; }
    return oc.call(this);
  };
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a[download]") : null;
    if (isLocal(a)) { e.preventDefault(); save(a.href, a.getAttribute("download")); }
  }, true);
})();
