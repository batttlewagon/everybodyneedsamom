/* Everyone Needs a Mom — shared page logic
   Locked settings (video room link, client code) are encrypted with
   AES-256-GCM. The key comes from a password or code (PBKDF2-SHA-256),
   so the room link never appears in the page source in readable form. */
(function () {
  var C = window.SITE_CONFIG || {};
  var S = window.SITE_SECRETS || {};
  var enc = new TextEncoder(), dec = new TextDecoder();

  // ---------- Fill in names, email, links ----------
  function each(sel, fn) { document.querySelectorAll(sel).forEach(fn); }
  each("[data-mentor-name]", function (el) { el.textContent = C.mentorName || "Mom"; });
  each("[data-mentor-fullname]", function (el) { el.textContent = C.mentorFullName || C.mentorName || "the mentor"; });
  each("[data-email]", function (el) { el.textContent = C.contactEmail; el.href = "mailto:" + C.contactEmail; });
  each("[data-main-site]", function (el) { el.href = C.mainSiteUrl || "#"; });
  each("[data-year]", function (el) { el.textContent = new Date().getFullYear(); });
  var feeNote = document.getElementById("fee-text");
  if (feeNote) {
    feeNote.textContent = C.calLink
      ? (C.sessionPrice ? C.sessionPrice + ", paid" : "Sessions are paid") + " securely when you book in the calendar below."
      : (C.sessionPrice ? C.sessionPrice + ". " : "") + (C.mentorName || "Mom") + " will send payment details when she confirms your session.";
  }
  var bookIntro = document.getElementById("book-intro");
  if (bookIntro && !C.calLink) {
    bookIntro.textContent = "Tell " + (C.mentorName || "Mom") + " when you'd like to meet. She'll reply by email to confirm your time, with your session link and code.";
  }

  // ---------- Encryption helpers ----------
  function b64e(buf) { var s = ""; new Uint8Array(buf).forEach(function (b) { s += String.fromCharCode(b); }); return btoa(s); }
  function b64d(str) { var s = atob(str), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
  async function keyFrom(secret, salt, iterations) {
    var base = await crypto.subtle.importKey("raw", enc.encode(secret), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt, iterations: iterations, hash: "SHA-256" },
      base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }
  async function lock(obj, secret, iterations) {
    iterations = iterations || 300000;
    var salt = crypto.getRandomValues(new Uint8Array(16));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var key = await keyFrom(secret, salt, iterations);
    var data = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, enc.encode(JSON.stringify(obj)));
    return { v: 1, it: iterations, salt: b64e(salt), iv: b64e(iv), data: b64e(data) };
  }
  async function unlock(blob, secret) {
    if (!blob || !secret) return null;
    try {
      var key = await keyFrom(secret, b64d(blob.salt), blob.it);
      var plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64d(blob.iv) }, key, b64d(blob.data));
      return JSON.parse(dec.decode(plain));
    } catch (e) { return null; }
  }
  function normCode(c) { return String(c || "").replace(/\s+/g, "").toUpperCase(); }

  // ---------- Video (Daily Prebuilt) ----------
  var callFrame = null;
  function setPlaceholder(box, html) {
    var ph = box.querySelector(".video-placeholder");
    ph.classList.remove("hidden");
    ph.innerHTML = html;
  }
  function startVideo(boxId, opts) {
    opts = opts || {};
    var box = document.getElementById(boxId);
    if (!box) return;
    if (!opts.url) {
      setPlaceholder(box, "<div><h3>The video room isn't connected yet</h3><p>Please try again a little later, or email <a style='color:#FFD23F' href='mailto:" +
        C.contactEmail + "'>" + C.contactEmail + "</a>.</p></div>");
      return;
    }
    if (!window.DailyIframe) {
      setPlaceholder(box, "<div><h3>The video couldn't load</h3><p>Please check your internet connection and refresh the page.</p></div>");
      return;
    }
    if (callFrame) return;
    box.querySelector(".video-placeholder").classList.add("hidden");
    callFrame = window.DailyIframe.createFrame(box, {
      showLeaveButton: true,
      showFullscreenButton: true,
      iframeStyle: { position: "absolute", inset: "0", width: "100%", height: "100%", border: "0" }
    });
    callFrame.join({ url: opts.url, userName: opts.userName || undefined });
    callFrame.on("left-meeting", function () {
      callFrame.destroy(); callFrame = null;
      setPlaceholder(box, opts.goodbye || "<div><h3>Thanks for spending time together today 🌼</h3><p>You can book your next session in the calendar below.</p></div>");
    });
  }

  // ---------- Mentor sign-in memory ----------
  var KEY = "enam_mentor";
  function getMentor() {
    try { return JSON.parse(sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || "null"); } catch (e) { return null; }
  }
  function saveMentor(v, keep) {
    try { sessionStorage.setItem(KEY, JSON.stringify(v)); if (keep) localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { }
  }
  function forgetMentor() {
    try { sessionStorage.removeItem(KEY); localStorage.removeItem(KEY); } catch (e) { }
  }

  window.ENAM = {
    lock: lock, unlock: unlock, normCode: normCode, startVideo: startVideo,
    getMentor: getMentor, saveMentor: saveMentor, forgetMentor: forgetMentor
  };

  // ---------- Client gate (home page) ----------
  var gateForm = document.getElementById("gate-form");
  if (gateForm) {
    var needCode = !!S.lockedRoom;
    var codeInput = document.getElementById("session-code");
    if (!needCode) document.getElementById("code-wrap").classList.add("hidden");

    // Code arrives pre-filled from the link in the booking email: ?code=XXXX
    var params = new URLSearchParams(location.search);
    if (params.get("code")) {
      codeInput.value = normCode(params.get("code"));
      try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) { }
    }

    var boxes = gateForm.querySelectorAll("input[type=checkbox]");
    var btn = document.getElementById("join-btn");
    var btnLabel = btn.textContent;
    function refresh() { btn.disabled = !Array.prototype.every.call(boxes, function (b) { return b.checked; }); }
    boxes.forEach(function (b) { b.addEventListener("change", refresh); });
    refresh();

    gateForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      var err = document.getElementById("gate-error");
      err.textContent = "";
      var roomUrl = C.dailyRoomUrl;
      if (needCode) {
        var code = normCode(codeInput.value);
        if (!code) { err.textContent = "Please enter the session code from your booking email."; codeInput.focus(); return; }
        btn.disabled = true; btn.textContent = "Checking your code…";
        var opened = await unlock(S.lockedRoom, code);
        btn.textContent = btnLabel; refresh();
        if (!opened || !opened.roomUrl) {
          err.textContent = "That code doesn't match. Check your booking email (or the link Mom sent you) and try again.";
          return;
        }
        roomUrl = opened.roomUrl;
      }
      try { sessionStorage.setItem("enam_agreed", new Date().toISOString()); } catch (x) { }
      document.getElementById("gate").classList.add("hidden");
      document.getElementById("video-section").classList.remove("hidden");
      startVideo("video-box", { url: roomUrl, userName: document.getElementById("your-name").value.trim() });
      document.getElementById("video-section").scrollIntoView({ behavior: "smooth" });
    });
  }

  // ---------- Booking by email request (used until a Cal.com calendar is connected) ----------
  function renderRequestForm(el) {
    var who = C.mentorName || "Mom";
    var tzLabel = C.timeZoneLabel || "Eastern Time";
    var times = C.requestTimes || ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM",
      "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"];
    var now = new Date();
    var min = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    el.style.minHeight = "0";
    el.innerHTML =
      '<form id="request-form" novalidate>' +
      '<div class="request-grid">' +
      '<div class="field"><label for="rq-name">Your name</label><input id="rq-name" type="text" autocomplete="name"></div>' +
      '<div class="field"><label for="rq-email">Your email</label><input id="rq-email" type="email" autocomplete="email"></div>' +
      '<div class="field"><label for="rq-date">Preferred day</label><input id="rq-date" type="date" min="' + min + '"></div>' +
      '<div class="field"><label for="rq-time">Preferred time (' + tzLabel + ')</label><select id="rq-time">' +
      times.map(function (t) { return "<option>" + t + "</option>"; }).join("") + "</select></div>" +
      "</div>" +
      '<div class="field wide"><label for="rq-note">Anything you\'d like ' + who + ' to know? (optional)</label><textarea id="rq-note" rows="3"></textarea></div>' +
      '<label class="check small-check"><input type="checkbox" id="rq-age"><span>I am 18 or older and agree to the <a href="terms.html" target="_blank">Session Agreement &amp; Disclaimer</a>.</span></label>' +
      '<button class="btn" type="submit">Send my request</button>' +
      '<p class="error" id="rq-error" role="alert"></p>' +
      '<div id="rq-done" class="setup-note hidden"></div>' +
      "</form>";
    document.getElementById("request-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var err = document.getElementById("rq-error");
      var name = document.getElementById("rq-name").value.trim();
      var email = document.getElementById("rq-email").value.trim();
      var day = document.getElementById("rq-date").value;
      var time = document.getElementById("rq-time").value;
      var note = document.getElementById("rq-note").value.trim();
      err.textContent = "";
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !day) {
        err.textContent = "Please add your name, a valid email, and a preferred day."; return;
      }
      if (!document.getElementById("rq-age").checked) {
        err.textContent = "Please confirm you are 18 or older and agree to the Session Agreement."; return;
      }
      var dayText = new Date(day + "T12:00:00").toLocaleDateString("en-US",
        { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      var subject = "Video session request: " + dayText + ", " + time + " " + tzLabel;
      var body = "Hi " + who + ",\n\nI'd like to book a video session.\n\n" +
        "Name: " + name + "\nEmail: " + email + "\nPreferred day: " + dayText +
        "\nPreferred time: " + time + " " + tzLabel + (note ? "\nNote: " + note : "") +
        "\n\nI am 18 or older and agree to the Session Agreement & Disclaimer.\n\nThank you!\n" + name;
      var done = document.getElementById("rq-done");
      done.innerHTML = "<h3>Almost done!</h3><p>Your email app should open with your request ready to send. " +
        "If it didn't, copy the message below and email it to <a href='mailto:" + C.contactEmail + "'>" + C.contactEmail + "</a>.</p>" +
        '<textarea class="mono out" rows="8" readonly></textarea>';
      done.querySelector("textarea").value = "Subject: " + subject + "\n\n" + body;
      done.classList.remove("hidden");
      window.location.href = "mailto:" + C.contactEmail + "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
    });
  }

  // ---------- Booking calendar (Cal.com inline embed) ----------
  var calEl = document.getElementById("cal-inline");
  if (calEl) {
    if (!C.calLink) {
      renderRequestForm(calEl);
    } else {
      (function (W, A, L) {
        var p = function (a, ar) { a.q.push(ar); };
        var d = W.document;
        W.Cal = W.Cal || function () {
          var cal = W.Cal, ar = arguments;
          if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; }
          if (ar[0] === L) {
            var api = function () { p(api, arguments); };
            var ns = ar[1]; api.q = api.q || [];
            if (typeof ns === "string") { cal.ns[ns] = cal.ns[ns] || api; p(cal.ns[ns], ar); p(cal, ["initNamespace", ns]); }
            else p(cal, ar);
            return;
          }
          p(cal, ar);
        };
      })(window, "https://app.cal.com/embed/embed.js", "init");
      Cal("init", { origin: "https://cal.com" });
      Cal("inline", { elementOrSelector: "#cal-inline", calLink: C.calLink, layout: "month_view" });
      Cal("ui", { theme: "light", styles: { branding: { brandColor: "#FF6B6B" } }, hideEventTypeDetails: false, layout: "month_view" });
    }
  }
})();
