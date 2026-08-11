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
      // Manage "menu closed / reopens soon" state from menuStatus in menu.json
      var statusBox = document.getElementById("menuStatusClosed");
      var closedMsg = document.getElementById("menuClosedMsg");
      var ms = data.menuStatus || {};
      var now = new Date();
      var closeAt = ms.closeAt ? new Date(ms.closeAt) : null;
      var reopenAt = ms.reopenAt ? new Date(ms.reopenAt) : null;

      if (statusBox && closeAt && reopenAt) {
        if (now >= closeAt && now < reopenAt) {
          // Orders closed; menu reopens soon.
          grid.hidden = true;
          statusBox.hidden = false;
          var rd = ms.reopenLabel || "soon";
          if (closedMsg) {
            closedMsg.textContent =
              "Orders are closed for this week. We'll reopen with a fresh menu " +
              rd +
              " — see you then!";
          }
        } else {
          statusBox.hidden = true;
        }
      }

      // Update the "This Week" label if the element exists
      var weekLabel = document.querySelector("[data-week-label]");
      if (weekLabel && data.weekLabel) weekLabel.textContent = "This Week · " + data.weekLabel;

      // If the menu is closed, don't render the weekly cards.
      if (grid.hidden) return;

      var orderUrl = (data.orderUrl || "https://radicato.goprep.com/customer/menu");

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

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
});
