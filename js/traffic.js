/* ============================================
   Traffic Analytics Module
   - Tracks visits in localStorage
   - Renders analytics dashboard
   ============================================ */

(function () {
  const STORAGE_KEY = 'traffic_data';
  let currentRange = 7;

  // ==========================================
  // 1. TRACKING: Record each page visit
  // ==========================================
  function trackVisit() {
    const params = new URLSearchParams(window.location.search);
    const ref = document.referrer || '';
    const ua = navigator.userAgent;

    const visit = {
      ts: Date.now(),
      date: new Date().toISOString().slice(0, 10),
      hour: new Date().getHours(),
      page: (window.location.hash || '#funnel-slimhwan').replace('#', ''),
      referrer: ref,
      source: classifySource(ref, params),
      sourceName: getSourceName(ref, params),
      device: getDevice(ua),
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
    };

    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    data.push(visit);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function classifySource(ref, params) {
    if (params.get('utm_source')) return 'utm';
    if (!ref) return 'direct';
    const host = safeHost(ref);
    const socials = ['facebook', 'instagram', 'twitter', 'youtube', 'tiktok', 'naver.me', 'blog.naver', 'kakaostory', 'kakao', 'threads'];
    if (socials.some(s => host.includes(s))) return 'social';
    const engines = ['google', 'naver.com/search', 'daum', 'bing', 'yahoo'];
    if (engines.some(s => ref.includes(s))) return 'search';
    return 'referral';
  }

  function getSourceName(ref, params) {
    if (params.get('utm_source')) return params.get('utm_source');
    if (!ref) return '직접 방문';
    const host = safeHost(ref);
    if (host.includes('kakao')) return '카카오톡';
    if (host.includes('instagram')) return '인스타그램';
    if (host.includes('facebook')) return '페이스북';
    if (host.includes('youtube')) return '유튜브';
    if (host.includes('blog.naver')) return '네이버 블로그';
    if (host.includes('naver')) return '네이버';
    if (host.includes('google')) return '구글';
    if (host.includes('daum')) return '다음';
    return host || ref.slice(0, 40);
  }

  function safeHost(url) {
    try { return new URL(url).hostname; } catch(e) { return url; }
  }

  function getDevice(ua) {
    if (/iPad|Tablet|PlayBook/i.test(ua)) return '태블릿';
    if (/Mobile|iPhone|Android.*Mobile/i.test(ua)) return '모바일';
    return 'PC';
  }

  // Track on load
  trackVisit();

  // ==========================================
  // 2. DATA HELPERS
  // ==========================================
  function getData() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  }

  function filterByRange(data, days) {
    if (days === 'all') return data;
    const cutoff = Date.now() - days * 86400000;
    return data.filter(v => v.ts >= cutoff);
  }

  function countBy(arr, key) {
    const map = {};
    arr.forEach(v => { const k = v[key] || '(없음)'; map[k] = (map[k] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }

  function getPageLabel(page) {
    const map = { 'funnel-slimhwan': '슬림환', 'funnel-kwaebyeon': '쾌변환', 'funnel-dunjam': '든ː잠', 'funnel-clinic': '김민부한의원', 'funnel-admin': '관리자' };
    return map[page] || page;
  }

  // ==========================================
  // 3. RENDER DASHBOARD
  // ==========================================
  window.renderTrafficDashboard = function () {
    const all = getData();
    const data = filterByRange(all, currentRange);
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = all.filter(v => v.date === today).length;

    // Summary stats
    setText('traffic-today', todayCount);
    setText('traffic-total', all.length);
    const channels = new Set(all.map(v => v.sourceName));
    setText('traffic-channels', channels.size);
    const mobileCount = all.filter(v => v.device === '모바일').length;
    setText('traffic-mobile', all.length ? Math.round(mobileCount / all.length * 100) + '%' : '0%');

    renderDailyChart(data);
    renderSourceChart(data);
    renderTopPages(data);
    renderReferrers(data);
    renderUTM(data);
    renderDevices(data);
    renderHourlyChart(data);
    renderLog(data);
  };

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ==========================================
  // 4. DAILY CHART (Canvas)
  // ==========================================
  function renderDailyChart(data) {
    const canvas = document.getElementById('traffic-daily-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;

    // Aggregate by date
    const days = currentRange === 'all' ? 30 : currentRange;
    const dateMap = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      dateMap[d] = 0;
    }
    data.forEach(v => { if (dateMap[v.date] !== undefined) dateMap[v.date]++; });
    const labels = Object.keys(dateMap);
    const values = Object.values(dateMap);
    const maxVal = Math.max(...values, 1);

    ctx.clearRect(0, 0, W, H);
    const pad = { t: 20, r: 20, b: 40, l: 50 };
    const cW = W - pad.l - pad.r;
    const cH = H - pad.t - pad.b;

    // Grid lines
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + (cH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
      ctx.fillStyle = '#94A3B8'; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal - (maxVal / 4) * i), pad.l - 8, y + 4);
    }

    if (labels.length < 2) return;

    // Area + Line
    const stepX = cW / (labels.length - 1);
    const pts = values.map((v, i) => ({ x: pad.l + i * stepX, y: pad.t + cH - (v / maxVal) * cH }));

    // Gradient fill
    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + cH);
    grad.addColorStop(0, 'rgba(99,102,241,0.2)');
    grad.addColorStop(1, 'rgba(99,102,241,0.01)');
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pad.t + cH);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, pad.t + cH);
    ctx.fillStyle = grad; ctx.fill();

    // Line
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = '#6366F1'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();

    // Dots
    pts.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#6366F1'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    });

    // X labels
    ctx.fillStyle = '#94A3B8'; ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'center';
    const skip = Math.ceil(labels.length / 8);
    labels.forEach((l, i) => {
      if (i % skip === 0 || i === labels.length - 1) {
        ctx.fillText(l.slice(5), pad.l + i * stepX, H - 10);
      }
    });
  }

  // ==========================================
  // 5. SOURCE DONUT CHART
  // ==========================================
  function renderSourceChart(data) {
    const canvas = document.getElementById('traffic-source-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = 200, cx = size / 2, cy = size / 2, r = 75, inner = 50;
    canvas.width = size * 2; canvas.height = size * 2;
    canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, size, size);

    const sourceMap = { direct: 0, referral: 0, social: 0, search: 0, utm: 0 };
    data.forEach(v => { sourceMap[v.source] = (sourceMap[v.source] || 0) + 1; });
    const total = data.length || 1;
    const colors = { direct: '#6366F1', referral: '#10B981', social: '#EC4899', search: '#F59E0B', utm: '#8B5CF6' };
    const labels = { direct: '직접 방문', referral: '외부 사이트', social: 'SNS', search: '검색 엔진', utm: 'UTM 캠페인' };
    const entries = Object.entries(sourceMap).filter(e => e[1] > 0);

    if (entries.length === 0) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#E2E8F0'; ctx.lineWidth = r - inner; ctx.stroke();
      ctx.fillStyle = '#94A3B8'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('데이터 없음', cx, cy + 4);
    } else {
      let angle = -Math.PI / 2;
      entries.forEach(([key, count]) => {
        const sweep = (count / total) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(cx, cy, r, angle, angle + sweep);
        ctx.arc(cx, cy, inner, angle + sweep, angle, true);
        ctx.closePath(); ctx.fillStyle = colors[key]; ctx.fill();
        angle += sweep;
      });
      // Center text
      ctx.fillStyle = '#1E293B'; ctx.font = 'bold 22px Inter, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(total, cx, cy + 2);
      ctx.fillStyle = '#94A3B8'; ctx.font = '10px sans-serif';
      ctx.fillText('총 방문', cx, cy + 16);
    }

    // Legend
    const legend = document.getElementById('traffic-source-legend');
    if (!legend) return;
    legend.innerHTML = entries.map(([key, count]) => `
      <div class="traffic-legend-item">
        <div class="traffic-legend-left">
          <div class="traffic-legend-dot" style="background:${colors[key]}"></div>
          <span class="traffic-legend-label">${labels[key]}</span>
        </div>
        <div class="traffic-legend-right">
          <span class="traffic-legend-count">${count}</span>
          <span class="traffic-legend-pct">${Math.round(count / total * 100)}%</span>
        </div>
      </div>`).join('');
  }

  // ==========================================
  // 6. LISTS
  // ==========================================
  function renderTopPages(data) {
    const el = document.getElementById('traffic-top-pages');
    if (!el) return;
    const pages = countBy(data, 'page');
    el.innerHTML = pages.length ? pages.slice(0, 6).map(([k, v]) => `
      <div class="traffic-list-item"><span class="traffic-list-item-name">${getPageLabel(k)}</span><span class="traffic-list-item-count">${v}</span></div>`).join('') : '<div class="traffic-list-empty">데이터 없음</div>';
  }

  function renderReferrers(data) {
    const el = document.getElementById('traffic-referrers');
    if (!el) return;
    const refs = countBy(data, 'sourceName');
    el.innerHTML = refs.length ? refs.slice(0, 6).map(([k, v]) => `
      <div class="traffic-list-item"><span class="traffic-list-item-name">${k}</span><span class="traffic-list-item-count">${v}</span></div>`).join('') : '<div class="traffic-list-empty">데이터 없음</div>';
  }

  function renderUTM(data) {
    const el = document.getElementById('traffic-utm');
    if (!el) return;
    const utmData = data.filter(v => v.utm_campaign);
    const camps = countBy(utmData, 'utm_campaign');
    el.innerHTML = camps.length ? camps.slice(0, 6).map(([k, v]) => `
      <div class="traffic-list-item"><span class="traffic-list-item-name">${k}</span><span class="traffic-list-item-count">${v}</span></div>`).join('') : '<div class="traffic-list-empty">UTM 캠페인 데이터 없음</div>';
  }

  function renderDevices(data) {
    const el = document.getElementById('traffic-devices');
    if (!el) return;
    const total = data.length || 1;
    const devs = countBy(data, 'device');
    const barColors = { '모바일': '#EC4899', 'PC': '#6366F1', '태블릿': '#F59E0B' };
    el.innerHTML = devs.length ? devs.map(([k, v]) => {
      const pct = Math.round(v / total * 100);
      return `<div class="traffic-bar-item">
        <div class="traffic-bar-label"><span class="traffic-bar-label-text">${k}</span><span class="traffic-bar-label-pct">${pct}% (${v})</span></div>
        <div class="traffic-bar-track"><div class="traffic-bar-fill" style="width:${pct}%;background:${barColors[k] || '#6366F1'}"></div></div>
      </div>`;
    }).join('') : '<div class="traffic-list-empty">데이터 없음</div>';
  }

  // ==========================================
  // 7. HOURLY CHART
  // ==========================================
  function renderHourlyChart(data) {
    const canvas = document.getElementById('traffic-hourly-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;

    const hours = Array(24).fill(0);
    data.forEach(v => { if (v.hour !== undefined) hours[v.hour]++; });
    const maxVal = Math.max(...hours, 1);

    ctx.clearRect(0, 0, W, H);
    const pad = { t: 10, r: 10, b: 30, l: 35 };
    const cW = W - pad.l - pad.r;
    const cH = H - pad.t - pad.b;
    const barW = cW / 24 - 3;

    hours.forEach((v, i) => {
      const x = pad.l + (cW / 24) * i + 1.5;
      const h = (v / maxVal) * cH;
      const y = pad.t + cH - h;
      const grad = ctx.createLinearGradient(0, y, 0, pad.t + cH);
      grad.addColorStop(0, '#818CF8');
      grad.addColorStop(1, '#C7D2FE');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.fillRect(x, y, barW, h);
      ctx.fill();
    });

    ctx.fillStyle = '#94A3B8'; ctx.font = '9px Inter, sans-serif'; ctx.textAlign = 'center';
    for (let i = 0; i < 24; i += 3) {
      ctx.fillText(i + '시', pad.l + (cW / 24) * i + barW / 2 + 1.5, H - 8);
    }
  }

  // ==========================================
  // 8. VISITOR LOG TABLE
  // ==========================================
  function renderLog(data) {
    const tbody = document.getElementById('traffic-log-body');
    if (!tbody) return;
    const sorted = [...data].sort((a, b) => b.ts - a.ts).slice(0, 50);
    if (!sorted.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:#94A3B8;">방문 기록이 없습니다.</td></tr>';
      return;
    }
    const tagClass = { direct: 'direct', referral: 'referral', social: 'social', search: 'search', utm: 'utm' };
    const tagLabel = { direct: '직접', referral: '외부', social: 'SNS', search: '검색', utm: 'UTM' };
    tbody.innerHTML = sorted.map(v => {
      const d = new Date(v.ts);
      const dt = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      return `<tr>
        <td>${dt}</td>
        <td>${getPageLabel(v.page)}</td>
        <td><span class="traffic-source-tag ${tagClass[v.source]}">${tagLabel[v.source]}</span> ${v.sourceName}</td>
        <td>${v.device}</td>
        <td>${v.utm_campaign || '-'}</td>
      </tr>`;
    }).join('');
  }

  // ==========================================
  // 9. EVENT LISTENERS
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    // Date range filter
    document.querySelectorAll('.traffic-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.traffic-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentRange = btn.dataset.range === 'all' ? 'all' : parseInt(btn.dataset.range);
        renderTrafficDashboard();
      });
    });

    // Clear data
    const clearBtn = document.getElementById('btn-clear-traffic');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('모든 트래픽 기록을 삭제하시겠습니까?')) {
          localStorage.removeItem(STORAGE_KEY);
          renderTrafficDashboard();
        }
      });
    }

    // CSV Export
    const exportBtn = document.getElementById('btn-export-traffic');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const data = filterByRange(getData(), currentRange);
        if (!data.length) { alert('내보낼 데이터가 없습니다.'); return; }
        const header = '방문일시,페이지,유입경로,소스명,디바이스,UTM소스,UTM매체,UTM캠페인\n';
        const rows = data.map(v => {
          const d = new Date(v.ts);
          const dt = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          return `${dt},${getPageLabel(v.page)},${v.source},${v.sourceName},${v.device},${v.utm_source},${v.utm_medium},${v.utm_campaign}`;
        }).join('\n');
        const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `traffic_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
      });
    }
  });

  // ==========================================
  // 10. DEMO DATA SEEDING
  // ==========================================
  // Seed sample data if empty so the dashboard isn't blank
  (function seedDemoData() {
    const existing = getData();
    if (existing.length > 3) return; // Already has real data

    const pages = ['funnel-slimhwan', 'funnel-kwaebyeon', 'funnel-dunjam', 'funnel-clinic'];
    const sources = [
      { source: 'direct', sourceName: '직접 방문', referrer: '' },
      { source: 'social', sourceName: '인스타그램', referrer: 'https://www.instagram.com/' },
      { source: 'social', sourceName: '카카오톡', referrer: 'https://pf.kakao.com/' },
      { source: 'search', sourceName: '네이버', referrer: 'https://search.naver.com/search.naver?query=슬림환' },
      { source: 'search', sourceName: '구글', referrer: 'https://www.google.com/' },
      { source: 'referral', sourceName: '네이버 블로그', referrer: 'https://blog.naver.com/' },
      { source: 'utm', sourceName: 'instagram_ad', referrer: '', utm_source: 'instagram', utm_medium: 'cpc', utm_campaign: '슬림환_5월_프로모션' },
      { source: 'utm', sourceName: 'kakao_msg', referrer: '', utm_source: 'kakao', utm_medium: 'message', utm_campaign: '쾌변환_신규고객' },
    ];
    const devices = ['모바일', '모바일', '모바일', 'PC', 'PC', '태블릿'];

    const demo = [];
    for (let day = 29; day >= 0; day--) {
      const count = Math.floor(Math.random() * 8) + 2;
      for (let j = 0; j < count; j++) {
        const ts = Date.now() - day * 86400000 - Math.floor(Math.random() * 86400000);
        const d = new Date(ts);
        const src = sources[Math.floor(Math.random() * sources.length)];
        demo.push({
          ts,
          date: d.toISOString().slice(0, 10),
          hour: d.getHours(),
          page: pages[Math.floor(Math.random() * pages.length)],
          referrer: src.referrer,
          source: src.source,
          sourceName: src.sourceName,
          device: devices[Math.floor(Math.random() * devices.length)],
          utm_source: src.utm_source || '',
          utm_medium: src.utm_medium || '',
          utm_campaign: src.utm_campaign || '',
        });
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
  })();

})();
