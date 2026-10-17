// Radicáto prototype — menu rendered from data/menu.json
document.addEventListener("DOMContentLoaded", function () {
  // Mobile nav toggle
  var toggle = document.getElementById("navToggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Auto-update footer year
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // ---- Render menu from data/menu.json ----
  var grid = document.getElementById("menuGrid");
  if (!grid) return;

  fetch("data/menu.json")
    .then(function (r) {
      if (!r.ok) throw new Error("menu fetch failed");
      return r.json();
    })
    .then(function (data) {
      var orderUrl = (data.orderUrl || "https://radicato.goprep.com/customer/menu");
      var state = computeMenuState(data.menuStatus || {}, getNow());
      var statusBox = document.getElementById("menuStatusClosed");
      var statusTitle = statusBox ? statusBox.querySelector("h3") : null;
      var closedMsg = document.getElementById("menuClosedMsg");
      var statusCta = document.getElementById("menuStatusCta");
      var weekLabel = document.querySelector("[data-week-label]");
      var menuCta = document.querySelector(".menu-cta");
      // The lower "Place Your Order" block only makes sense while orders are open.
      if (menuCta) menuCta.hidden = state.mode !== "open";

      if (statusCta) {
        var ctaLink = statusCta.querySelector("a");
        if (ctaLink) ctaLink.href = orderUrl;
      }

      if (state.mode === "closed") {
        // Past the order cutoff, before the next menu day starts.
        // Day name only — the open time varies week to week, so never show a clock time.
        grid.hidden = true;
        if (statusBox) statusBox.hidden = false;
        if (statusTitle) statusTitle.textContent = "Orders for this week are closed.";
        if (closedMsg) closedMsg.textContent = "Next menu opens " + state.reopenDayName + ".";
        if (statusCta) statusCta.hidden = true;
        if (weekLabel && data.weekLabel) weekLabel.textContent = "This Week · " + data.weekLabel;
        return;
      }

      if (state.mode === "stale") {
        // The next menu day has started, but data/menu.json still holds last week's
        // cutoff. Don't show old dishes or claim the new menu is up; send people to GoPrep.
        grid.hidden = true;
        if (statusBox) statusBox.hidden = false;
        if (statusTitle) statusTitle.textContent = "New menu coming soon.";
        if (closedMsg) closedMsg.textContent = "Check GoPrep for the latest.";
        if (statusCta) statusCta.hidden = false;
        if (weekLabel) weekLabel.textContent = "This Week";
        return;
      }

      // Open: render the weekly cards.
      if (statusBox) statusBox.hidden = true;
      if (weekLabel && data.weekLabel) weekLabel.textContent = "This Week · " + data.weekLabel;

      grid.innerHTML = "";
      data.items.forEach(function (item) {
        var card = document.createElement("article");
        card.className = "card";

        var tagHtml = '<span class="card-tag">' + escapeHtml(item.tag);
        if (item.new) tagHtml += ' <span class="new-badge">New</span>';
        tagHtml += "</span>";

        var nameHtml = '<h3>' + escapeHtml(item.name);
        if (item.serves) nameHtml += ' <span class="serves">Serves ' + item.serves + '</span>';
        nameHtml += "</h3>";

        var price = "$" + item.price;

        card.innerHTML =
          tagHtml +
          nameHtml +
          '<p class="card-desc">' + escapeHtml(item.desc) + "</p>" +
          '<div class="card-foot"><span class="price">' + price + "</span>" +
          '<a class="order-link" href="' + orderUrl + '" target="_blank" rel="noopener">Order →</a></div>';

        grid.appendChild(card);
      });
    })
    .catch(function () {
      // Fallback: keep the noscript-friendly note visible with a helpful message
      grid.innerHTML =
        '<p class="lede">Menu could not be loaded this time. Please visit our ordering page to see this week\'s lineup.</p>' +
        '<p><a class="btn btn-primary" href="https://radicato.goprep.com/customer/menu" target="_blank" rel="noopener">View &amp; Order the Menu</a></p>';
    });

  // ---- Menu schedule helpers (all times in Boone, Iowa: America/Chicago) ----
  var TZ = "America/Chicago";
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // For testing only: ?now=2026-10-21T09:00:00-05:00 simulates a different time.
  function getNow() {
    var m = /[?&]now=([^&]+)/.exec(window.location.search);
    if (m) {
      var d = new Date(decodeURIComponent(m[1]));
      if (!isNaN(d)) return d;
    }
    return new Date();
  }

  function chicagoParts(date) {
    var parts = {};
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", hourCycle: "h23", weekday: "long"
    }).formatToParts(date).forEach(function (p) { parts[p.type] = p.value; });
    return parts;
  }

  // Build the instant for a Chicago wall-clock time (handles CDT/CST).
  function chicagoTime(y, mo, d, h, mi) {
    for (var off = 5; off <= 6; off++) {
      var guess = new Date(Date.UTC(y, mo - 1, d, h + off, mi));
      var p = chicagoParts(guess);
      if (+p.hour === h && +p.minute === mi && +p.day === new Date(Date.UTC(y, mo - 1, d)).getUTCDate()) return guess;
    }
    return new Date(Date.UTC(y, mo - 1, d, h + 6, mi));
  }

  // Next reopenDay at reopenTime (Chicago) strictly after closeAt.
  // reopenTime defaults to 00:00 (start of that day) and is never shown in copy.
  function deriveReopen(closeAt, dayName, timeStr) {
    var target = DAYS.indexOf(dayName);
    if (target < 0) target = 5; // Friday
    var tm = /^(\d{1,2}):(\d{2})$/.exec(timeStr || "") || [null, "0", "00"];
    var p = chicagoParts(closeAt);
    var base = new Date(Date.UTC(+p.year, +p.month - 1, +p.day));
    var add = (target - DAYS.indexOf(p.weekday) + 7) % 7;
    for (var i = 0; i < 2; i++) {
      var day = new Date(base.getTime() + (add + 7 * i) * 86400000);
      var t = chicagoTime(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), +tm[1], +tm[2]);
      if (t > closeAt) return t;
    }
    return null;
  }

  // Returns { mode: "open" | "closed" | "stale", reopenAt: Date|null, reopenDayName: string }
  //   open   - before closeAt (or no closeAt set): show the weekly cards
  //   closed - after closeAt, before the next reopen day starts
  //   stale  - that day has started and menu.json still has the old closeAt
  function computeMenuState(ms, now) {
    var dayName = ms.reopenDay || "Friday";
    var closeAt = ms.closeAt ? new Date(ms.closeAt) : null;
    if (!closeAt || isNaN(closeAt) || now < closeAt) {
      return { mode: "open", reopenAt: null, reopenDayName: dayName };
    }
    var reopenAt = ms.reopenAt ? new Date(ms.reopenAt) : null;
    // An explicit reopenAt is honored only if it's within 14 days of the cutoff;
    // otherwise (e.g. a far-future placeholder) derive it from the weekly cycle.
    var maxGap = 14 * 86400000;
    if (!reopenAt || isNaN(reopenAt) || reopenAt <= closeAt || reopenAt - closeAt > maxGap) {
      // reopenTime is accepted for compatibility; default is the start of reopenDay.
      reopenAt = deriveReopen(closeAt, dayName, ms.reopenTime || "00:00");
    }
    if (reopenAt) dayName = weekdayName(reopenAt);
    if (reopenAt && now >= reopenAt) return { mode: "stale", reopenAt: reopenAt, reopenDayName: dayName };
    return { mode: "closed", reopenAt: reopenAt, reopenDayName: dayName };
  }

  function weekdayName(date) {
    return new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long" }).format(date);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Share: copy-link button
  document.querySelectorAll("[data-copy-link]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var url = btn.getAttribute("data-url") || window.location.href;
      var done = function () {
        var old = btn.textContent;
        btn.textContent = "✓ Link copied";
        setTimeout(function () { btn.textContent = old; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () {});
      } else {
        var t = document.createElement("textarea");
        t.value = url; document.body.appendChild(t); t.select();
        try { document.execCommand("copy"); done(); } catch (e) {}
        document.body.removeChild(t);
      }
    });
  });
});
