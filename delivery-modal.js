/**
 * delivery-modal.js
 * Shared delivery type / address lookup modal
 * Used by both index.html and checkout.html
 *
 * Saves result to localStorage key 'sp_delivery' so checkout
 * can read the confirmed address + fee without asking again.
 */

(function() {

  // ── Inject CSS ───────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    .dm-overlay {
      display:none; position:fixed; inset:0; z-index:900;
      background:rgba(26,18,9,.72); backdrop-filter:blur(6px);
      align-items:center; justify-content:center; padding:16px;
    }
    .dm-overlay.show { display:flex; }
    .dm-box {
      background:#fff; border-radius:22px; width:100%; max-width:500px;
      box-shadow:0 24px 64px rgba(0,0,0,.28); overflow:visible;
      font-family:'DM Sans',sans-serif;
    }
    .dm-header {
      background:#C8302B; color:#fff;
      border-radius:22px 22px 0 0;
      padding:18px 24px;
      display:flex; align-items:center; justify-content:space-between;
    }
    .dm-header h3 { font-size:18px; font-weight:700; margin:0; }
    .dm-close {
      background:none; border:none; color:#fff;
      font-size:26px; cursor:pointer; line-height:1; padding:0; opacity:.8;
    }
    .dm-close:hover { opacity:1; }
    .dm-body { padding:24px; }

    /* type buttons */
    .dm-type-btns { display:flex; flex-direction:column; gap:10px; margin-bottom:20px; }
    .dm-type-btn {
      padding:15px; border:none; border-radius:12px; cursor:pointer;
      font-size:15px; font-weight:700; letter-spacing:.04em;
      font-family:'DM Sans',sans-serif; transition:.18s;
      background:#3d3d3d; color:#fff;
    }
    .dm-type-btn:hover { filter:brightness(1.15); }
    .dm-type-btn.active-pickup { background:#555; }
    .dm-type-btn.active-delivery { background:#C8302B; }

    /* address search */
    .dm-addr-section { display:none; flex-direction:column; gap:12px; }
    .dm-addr-section.visible { display:flex; }
    .dm-addr-label { font-weight:600; font-size:14px; color:#2D1F0E; }
    .dm-addr-row { display:flex; gap:8px; }
    .dm-addr-input {
      flex:1; background:#F5ECD7; border:1.5px solid rgba(212,151,58,.3);
      border-radius:10px; padding:13px 14px; font-size:15px;
      font-family:'DM Sans',sans-serif; outline:none; transition:.2s;
      color:#2D1F0E;
    }
    .dm-addr-input:focus { border-color:#C8302B; background:#fff; }

    /* Autocomplete dropdown */
    .dm-autocomplete {
      position:relative; width:100%;
    }
    .dm-autocomplete-list {
      display:none; position:absolute; top:100%; left:0; right:0;
      background:#fff; border:1.5px solid rgba(212,151,58,.3);
      border-top:none; border-radius:0 0 10px 10px;
      max-height:240px; overflow-y:auto;
      z-index:99999; box-shadow:0 8px 24px rgba(0,0,0,.18);
    }
    .dm-autocomplete-list.show { display:block; }
    .dm-autocomplete-item {
      padding:13px 16px; cursor:pointer; font-size:14px;
      color:#2D1F0E; border-bottom:1px solid rgba(212,151,58,.1);
      transition:background .15s;
    }
    .dm-autocomplete-item:last-child { border-bottom:none; }
    .dm-autocomplete-item:hover,
    .dm-autocomplete-item.highlighted { background:#FDF6EC; color:#C8302B; font-weight:500; }
    .dm-search-btn {
      background:#C8302B; color:#fff; border:none; cursor:pointer;
      padding:13px 18px; border-radius:10px; font-size:15px; font-weight:700;
      font-family:'DM Sans',sans-serif; transition:.18s; white-space:nowrap;
    }
    .dm-search-btn:hover:not(:disabled) { background:#A0231F; }
    .dm-search-btn:disabled { opacity:.55; cursor:not-allowed; }

    /* result card */
    .dm-result {
      display:none; border-radius:14px; overflow:hidden;
      border:2px solid #22c55e;
    }
    .dm-result.show { display:block; }
    .dm-result.bad { border-color:#C8302B; }
    .dm-result-head {
      background:#22c55e; color:#fff;
      padding:13px 18px; font-size:17px; font-weight:700;
    }
    .dm-result.bad .dm-result-head { background:#C8302B; }
    .dm-result-body { background:#f0fdf4; padding:14px 18px; }
    .dm-result.bad .dm-result-body { background:#fff5f5; }
    .dm-row {
      display:flex; justify-content:space-between; align-items:center;
      padding:6px 0; border-bottom:1px solid rgba(0,0,0,.06);
      font-size:14px; color:#2D1F0E;
    }
    .dm-row:last-child { border-bottom:none; }
    .dm-row strong { font-weight:700; }
    .dm-continue-q { margin-top:12px; font-size:16px; font-weight:700; color:#2D1F0E; }

    /* confirm buttons */
    .dm-confirm-btns { display:none; gap:10px; margin-top:14px; }
    .dm-confirm-btns.show { display:flex; }
    .dm-btn-nej {
      flex:1; padding:14px; border-radius:50px; border:none; cursor:pointer;
      font-size:15px; font-weight:700; background:#eab308; color:#1A1209;
      font-family:'DM Sans',sans-serif; transition:.18s;
    }
    .dm-btn-nej:hover { background:#ca8a04; color:#fff; }
    .dm-btn-ja {
      flex:1; padding:14px; border-radius:50px; border:none; cursor:pointer;
      font-size:15px; font-weight:700; background:#C8302B; color:#fff;
      font-family:'DM Sans',sans-serif; transition:.18s;
    }
    .dm-btn-ja:hover { background:#A0231F; }
  `;
  document.head.appendChild(style);

  // ── Inject HTML ──────────────────────────────────────────────────────────
  const html = `
  <div class="dm-overlay" id="dmOverlay">
    <div class="dm-box">
      <div class="dm-header">
        <h3>Vælg leveringsmetode</h3>
        <button class="dm-close" id="dmClose">×</button>
      </div>
      <div class="dm-body">
        <div class="dm-type-btns">
          <button class="dm-type-btn" id="dmBtnPickup">AFHENTNING</button>
          <button class="dm-type-btn" id="dmBtnDelivery">LEVERING</button>
        </div>

        <div class="dm-addr-section" id="dmAddrSection">
          <span class="dm-addr-label">Indtast adresse (vejnavn og nummer)</span>
          <div class="dm-addr-row">
            <div class="dm-autocomplete" style="flex:1;">
              <input class="dm-addr-input" id="dmAddrInput"
                type="text" placeholder="F.eks. Borgmesterbakken 6, 8700 Horsens"
                autocomplete="off" style="width:100%;" />
              <div class="dm-autocomplete-list" id="dmAutoList"></div>
            </div>
            <button class="dm-search-btn" id="dmSearchBtn">Søg</button>
          </div>

          <div class="dm-result" id="dmResult">
            <div class="dm-result-head" id="dmResultHead"></div>
            <div class="dm-result-body" id="dmResultBody"></div>
          </div>

          <div class="dm-confirm-btns" id="dmConfirmBtns">
            <button class="dm-btn-nej" id="dmNej">Nej</button>
            <button class="dm-btn-ja" id="dmJa">Ja, fortsæt</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', html);

  // ── State ────────────────────────────────────────────────────────────────
  let pendingResult = null;
  let onConfirmCallback = null; // called when user confirms

  // ── Helpers ──────────────────────────────────────────────────────────────
  function resetModal() {
    pendingResult = null;
    document.getElementById('dmAddrInput').value = '';
    document.getElementById('dmResult').className = 'dm-result';
    document.getElementById('dmResultHead').textContent = '';
    document.getElementById('dmResultBody').innerHTML = '';
    document.getElementById('dmConfirmBtns').classList.remove('show');
    document.getElementById('dmAddrSection').classList.remove('visible');
    document.getElementById('dmBtnPickup').className = 'dm-type-btn';
    document.getElementById('dmBtnDelivery').className = 'dm-type-btn';
    closeAutocomplete();
  }

  // ── Public API ───────────────────────────────────────────────────────────
  window.DeliveryModal = {

    /**
     * Open the modal.
     * @param {function} onConfirm  Called with delivery data object when user confirms.
     *   Data shape: { type: 'pickup'|'delivery', address?, distanceText?, fee?, minOrder?, freeAt?, durationText? }
     */
    open: function(onConfirm) {
      onConfirmCallback = onConfirm || null;
      resetModal();
      document.getElementById('dmOverlay').classList.add('show');
    },

    close: function() {
      document.getElementById('dmOverlay').classList.remove('show');
    }
  };

  // ── Event listeners ──────────────────────────────────────────────────────
  document.getElementById('dmClose').addEventListener('click', () => DeliveryModal.close());
  document.getElementById('dmOverlay').addEventListener('click', function(e) {
    if (e.target === this) DeliveryModal.close();
  });

  // AFHENTNING button
  document.getElementById('dmBtnPickup').addEventListener('click', function() {
    document.getElementById('dmBtnPickup').className = 'dm-type-btn active-pickup';
    document.getElementById('dmBtnDelivery').className = 'dm-type-btn';
    document.getElementById('dmAddrSection').classList.remove('visible');
    document.getElementById('dmResult').className = 'dm-result';
    document.getElementById('dmResultHead').textContent = '';
    document.getElementById('dmResultBody').innerHTML = '';
    closeAutocomplete();

    // Show pickup confirmation in result box
    const resultEl = document.getElementById('dmResult');
    resultEl.className = 'dm-result show';
    document.getElementById('dmResultHead').textContent = '✓ Afhentning valgt';
    document.getElementById('dmResultBody').innerHTML = `
      <div class="dm-row"><span>Sted</span><strong>Bjerrevej 73, 8700 Horsens</strong></div>
      <div class="dm-row"><span>Leveringspris</span><strong>Gratis</strong></div>
      <div class="dm-row"><span>Klar om ca.</span><strong>20 minutter</strong></div>
      <div class="dm-continue-q">Ønsker du at fortsætte?</div>
    `;

    // Set pending result for pickup
    pendingResult = {
      type: 'pickup',
      address: 'Bjerrevej 73, 8700 Horsens',
      fee: 0,
      minOrder: 0
    };
    document.getElementById('dmConfirmBtns').classList.add('show');
  });

  // LEVERING button
  document.getElementById('dmBtnDelivery').addEventListener('click', function() {
    document.getElementById('dmBtnDelivery').className = 'dm-type-btn active-delivery';
    document.getElementById('dmBtnPickup').className = 'dm-type-btn';
    // Full reset
    pendingResult = null;
    document.getElementById('dmResult').className = 'dm-result';
    document.getElementById('dmResult').style.display = 'none';
    document.getElementById('dmResultHead').textContent = '';
    document.getElementById('dmResultBody').innerHTML = '';
    document.getElementById('dmConfirmBtns').classList.remove('show');
    document.getElementById('dmAddrInput').value = '';
    closeAutocomplete();
    document.getElementById('dmAddrSection').classList.add('visible');
    setTimeout(() => document.getElementById('dmAddrInput').focus(), 100);
  });

  // Search on Enter key
  document.getElementById('dmAddrInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') searchAddress();
  });

  // Search button
  document.getElementById('dmSearchBtn').addEventListener('click', searchAddress);

  // NEJ button
  document.getElementById('dmNej').addEventListener('click', function() {
    document.getElementById('dmResult').className = 'dm-result';
    document.getElementById('dmConfirmBtns').classList.remove('show');
    pendingResult = null;
  });

  // JA button
  document.getElementById('dmJa').addEventListener('click', function() {
    if (!pendingResult) return;
    localStorage.setItem('sp_delivery', JSON.stringify(pendingResult));
    DeliveryModal.close();
    if (onConfirmCallback) onConfirmCallback(pendingResult);
  });

  // ── Autocomplete ─────────────────────────────────────────────────────────
  let autocompleteTimer = null;
  let highlightedIndex = -1;

  document.getElementById('dmAddrInput').addEventListener('input', function() {
    clearTimeout(autocompleteTimer);
    const val = this.value.trim();
    if (val.length < 2) {
      closeAutocomplete();
      return;
    }
    autocompleteTimer = setTimeout(() => fetchSuggestions(val), 280);
  });

  document.getElementById('dmAddrInput').addEventListener('keydown', function(e) {
    const list = document.getElementById('dmAutoList');
    const items = list.querySelectorAll('.dm-autocomplete-item');
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
      updateHighlight(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      highlightedIndex = Math.max(highlightedIndex - 1, -1);
      updateHighlight(items);
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && items[highlightedIndex]) {
        e.preventDefault();
        items[highlightedIndex].click();
      }
    } else if (e.key === 'Escape') {
      closeAutocomplete();
    }
  });

  // Close when clicking outside
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.dm-autocomplete')) closeAutocomplete();
  });

  function updateHighlight(items) {
    items.forEach((el, i) => {
      el.classList.toggle('highlighted', i === highlightedIndex);
    });
  }

  function closeAutocomplete() {
    const list = document.getElementById('dmAutoList');
    list.classList.remove('show');
    list.innerHTML = '';
    highlightedIndex = -1;
  }

  async function fetchSuggestions(input) {
    try {
      const res = await fetch('/api/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      });
      if (!res.ok) return;
      const data = await res.json();
      showSuggestions(data.suggestions || []);
    } catch(e) {
      // Silently fail — autocomplete is optional
    }
  }

  function showSuggestions(suggestions) {
    const list = document.getElementById('dmAutoList');
    if (!suggestions.length) { closeAutocomplete(); return; }
    list.innerHTML = suggestions.map((s, i) =>
      `<div class="dm-autocomplete-item" data-place="${s.description}" data-idx="${i}">${s.description}</div>`
    ).join('');
    list.classList.add('show');
    highlightedIndex = -1;

    list.querySelectorAll('.dm-autocomplete-item').forEach(item => {
      item.addEventListener('mousedown', function(e) {
        e.preventDefault(); // prevent input blur
        document.getElementById('dmAddrInput').value = this.dataset.place;
        closeAutocomplete();
        searchAddress(); // auto-search when address picked
      });
    });
  }

  // ── Address search ───────────────────────────────────────────────────────
  async function searchAddress() {
    const input = document.getElementById('dmAddrInput').value.trim();
    if (!input) {
      document.getElementById('dmAddrInput').focus();
      return;
    }

    const btn = document.getElementById('dmSearchBtn');
    btn.textContent = '⏳';
    btn.disabled = true;
    pendingResult = null;
    document.getElementById('dmResult').className = 'dm-result';
    document.getElementById('dmConfirmBtns').classList.remove('show');

    try {
      let res, data;
      try {
        res = await fetch('/api/distance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: input })
        });
        const rawText = await res.text();
        console.log('API response (' + res.status + '):', rawText);
        try { data = JSON.parse(rawText); }
        catch(e) { throw new Error('Server svarede ikke korrekt: ' + rawText.substring(0, 120)); }
      } catch(fetchErr) {
        throw fetchErr;
      }

      if (!res.ok) {
        showError(data.error || 'Server fejl (' + res.status + '). Se konsollen for detaljer.');
        return;
      }

      if (!data.canDeliver) {
        showNoDelivery(data);
        return;
      }

      showSuccess(data);
      pendingResult = {
        type:         'delivery',
        address:      data.formattedAddress,
        distanceText: data.distanceText,
        durationText: data.durationText,
        fee:          data.fee,
        minOrder:     data.minOrder,
        freeAt:       data.freeAt
      };
      document.getElementById('dmConfirmBtns').classList.add('show');

    } catch(err) {
      showError('Fejl: ' + (err.message || 'Ukendt fejl. Tjek konsollen.'));
      console.error('Distance fetch error:', err);
    } finally {
      btn.textContent = 'Søg';
      btn.disabled = false;
    }
  }

  function showSuccess(data) {
    const el = document.getElementById('dmResult');
    el.style.display = '';
    el.className = 'dm-result show';
    document.getElementById('dmResultHead').textContent = '✓ Levering mulig!';
    document.getElementById('dmResultBody').innerHTML = `
      <div class="dm-row"><span>Adresse</span><strong>${data.formattedAddress}</strong></div>
      <div class="dm-row"><span>Afstand</span><strong>${data.distanceText}</strong></div>
      <div class="dm-row"><span>Leveringspris</span><strong>${data.fee} kr</strong></div>
      <div class="dm-row"><span>Minimumsordre</span><strong>${data.minOrder} kr</strong></div>
      <div class="dm-row"><span>Gratis levering ved</span><strong>${data.freeAt} kr</strong></div>
      <div class="dm-row"><span>Estimeret leveringstid</span><strong>+${data.durationText}</strong></div>
      <div class="dm-continue-q">Ønsker du at fortsætte?</div>
    `;
  }

  function showNoDelivery(data) {
    const el = document.getElementById('dmResult');
    el.style.display = '';
    el.className = 'dm-result show bad';
    document.getElementById('dmResultHead').textContent = 'Levering ikke mulig';
    document.getElementById('dmResultBody').innerHTML = `
      <div class="dm-row"><span>Adresse</span><strong>${data.formattedAddress || 'Ukendt'}</strong></div>
      ${data.distanceText ? `<div class="dm-row"><span>Afstand</span><strong>${data.distanceText}</strong></div>` : ''}
      <div class="dm-row" style="color:#C8302B;font-weight:600;padding-top:8px;">
        Vi leverer desværre ikke til denne adresse (for langt væk).
      </div>
    `;
  }

  function showError(msg) {
    const el = document.getElementById('dmResult');
    el.style.display = '';
    el.className = 'dm-result show bad';
    document.getElementById('dmResultHead').textContent = 'Fejl';
    document.getElementById('dmResultBody').innerHTML = `
      <div class="dm-row" style="color:#C8302B;">${msg}</div>
    `;
  }

})();