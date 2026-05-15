/* ============================================
   김민부한의원 - SPA Funnel JS
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.getElementById('navbar');
  const floatingBar = document.getElementById('floating-bar');

  const tabBtns = document.querySelectorAll('.tab-btn, .footer-tab-link, .nav-logo');
  const funnelViews = document.querySelectorAll('.funnel-view');

  // Intersection Observer setup for animations
  let revealObserver;
  let counterObserver;
  const counterObserved = new Set();

  function initObservers() {
    // Disconnect existing
    if (revealObserver) revealObserver.disconnect();
    if (counterObserver) counterObserver.disconnect();

    // Reveal observer
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    // Counter observer
    counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !counterObserved.has(entry.target)) {
          counterObserved.add(entry.target);
          animateCounter(entry.target);
        }
      });
    }, { threshold: 0.5 });
  }

  function triggerAnimationsForView(viewId) {
    const view = document.getElementById(viewId);
    if (!view) return;

    initObservers();

    // Reset fade-ins
    const fadeElements = view.querySelectorAll('.fade-in');
    fadeElements.forEach(el => {
      el.classList.remove('visible');
      // Small delay to allow CSS removing class to take effect before observing
      setTimeout(() => revealObserver.observe(el), 50);
    });

    // Reset counters
    const counters = view.querySelectorAll('.counter');
    counters.forEach(counter => {
      counterObserved.delete(counter);
      counter.textContent = '0';
      setTimeout(() => counterObserver.observe(counter), 50);
    });
  }

  // Tab Switching Logic
  function switchTab(targetId) {
    // Update active state on buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      if (btn.dataset.target === targetId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Transition views
    funnelViews.forEach(view => {
      if (view.id === targetId) {
        view.classList.add('active-view');
        view.style.display = 'block';
        setTimeout(() => view.style.opacity = '1', 10);
      } else {
        view.style.opacity = '0';
        setTimeout(() => {
          view.classList.remove('active-view');
          view.style.display = 'none';
        }, 300); // matches CSS transition
      }
    });

    // Scroll to top instantly
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Re-trigger animations for the new view
    triggerAnimationsForView(targetId);

    // Close mobile menu if open
    const mMenu = document.getElementById('mobile-menu');
    const nToggle = document.getElementById('nav-toggle');
    if (mMenu) mMenu.classList.remove('active');
    if (nToggle) nToggle.classList.remove('active');
    document.body.style.overflow = '';

    // Force scroll event to update navbar/floating bar state
    handleScroll();
  }

  // Listen for tab clicks
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = btn.dataset.target || (btn.getAttribute('href') && btn.getAttribute('href').replace('#', ''));
      if (target && document.getElementById(target)) {
        switchTab(target);
        history.pushState(null, null, `#${target}`);

        if (target === 'funnel-admin' && typeof showAdminDash === 'function') {
          showAdminDash();
        }
      }
    });
  });

  // Handle back/forward navigation
  window.addEventListener('popstate', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(hash)) {
      switchTab(hash);
      if (hash === 'funnel-admin' && typeof showAdminDash === 'function') {
        showAdminDash();
      }
    } else {
      switchTab('funnel-slimhwan');
    }
  });

  // Initialize view on first load
  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && document.getElementById(initialHash)) {
    switchTab(initialHash);
    if (initialHash === 'funnel-admin' && typeof showAdminDash === 'function') {
      showAdminDash();
    }
  } else {
    switchTab('funnel-slimhwan');
  }

  const kakaoChatBtn = document.getElementById('kakao-chat-btn');

  // Scroll handling for common layout
  function handleScroll() {
    const scrollY = window.scrollY;

    // Navbar styling
    if (scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Floating bar appears after scrolling past hero (approx 600px)
    if (scrollY > 600) {
      if (floatingBar) floatingBar.classList.add('visible');
      if (kakaoChatBtn) kakaoChatBtn.classList.add('shifted');
    } else {
      if (floatingBar) floatingBar.classList.remove('visible');
      if (kakaoChatBtn) kakaoChatBtn.classList.remove('shifted');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });

  // Counter Animation function
  function animateCounter(counter) {
    const target = parseInt(counter.dataset.target);
    const duration = 2000;
    const startTime = performance.now();

    function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.round(easeOutQuart(progress) * target);

      counter.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        counter.textContent = target.toLocaleString();
      }
    }
    requestAnimationFrame(update);
  }

  // ==========================================
  // SCROLL INDICATOR CLICK → SCROLL DOWN ONE SCREEN
  // ==========================================
  function initScrollIndicators() {
    document.querySelectorAll('.hero-scroll-indicator').forEach(indicator => {
      indicator.style.cursor = 'pointer';
      // To prevent duplicate listeners if called multiple times
      if (!indicator.dataset.scrollInit) {
        indicator.dataset.scrollInit = 'true';
        indicator.addEventListener('click', () => {
          window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
        });
      }
    });
  }
  initScrollIndicators();

  // Mobile Menu Toggle (Now handled via HTML inline onclick for maximum reliability)
  const navToggle = document.getElementById('nav-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  // 모바일 화면일 경우 첫 접속 시 햄버거 메뉴 자동 열기
  if (window.innerWidth <= 768) {
    // switchTab 등에 의해 닫히는 것을 방지하기 위해 약간의 딜레이 후 명시적으로 클래스 추가
    setTimeout(() => {
      if (mobileMenu) mobileMenu.classList.add('active');
      if (navToggle) navToggle.classList.add('active');
      document.body.style.overflow = 'hidden';
    }, 300);
  }

  // ==========================================
  // ADMIN DASHBOARD LOGIC
  // ==========================================
  const dashView = document.getElementById('admin-dash-view');

  const btnAdminLogout = document.getElementById('btn-admin-logout');
  if (btnAdminLogout) {
    btnAdminLogout.addEventListener('click', () => {
      switchTab('funnel-slimhwan');
      history.pushState(null, null, '#funnel-slimhwan');
    });
  }

  function showAdminDash() {
    if (dashView) dashView.style.display = 'block';
    renderCrmTable();
  }

  const crmDetailModal = document.getElementById('crm-detail-modal');
  document.getElementById('crm-detail-close').addEventListener('click', () => {
    crmDetailModal.classList.remove('active');
  });

  window.openCrmDetail = function (id) {
    const cd = JSON.parse(localStorage.getItem('crm_data') || '[]');
    const item = cd.find(i => i.id === id);
    if (!item) return;

    let html = `
          <div class="admin-detail-row"><div class="admin-detail-lbl">성함</div><div class="admin-detail-val">${item.name}</div></div>
          <div class="admin-detail-row"><div class="admin-detail-lbl">연락처</div><div class="admin-detail-val">${item.phone}</div></div>
          <div class="admin-detail-row"><div class="admin-detail-lbl">주민 앞 6자리</div><div class="admin-detail-val">${item.jumin}</div></div>
          <div class="admin-detail-row"><div class="admin-detail-lbl">구분</div><div class="admin-detail-val">${item.type} (${item.isFirst})</div></div>
       `;

    if (item.type === '초진') {
      const d = item.detail;
      html += `
          <div class="admin-detail-row"><div class="admin-detail-lbl">키/몸무게/목표</div><div class="admin-detail-val">${d.height}cm / ${d.weight}kg / 목표: ${d.goal}kg</div></div>
          <div class="admin-detail-row"><div class="admin-detail-lbl">식사패턴</div><div class="admin-detail-val">${d.meal}</div></div>
          <div class="admin-detail-row"><div class="admin-detail-lbl">식욕수준</div><div class="admin-detail-val">${d.appetite}</div></div>
          <div class="admin-detail-row"><div class="admin-detail-lbl">음주/수면</div><div class="admin-detail-val">${d.alcohol} / ${d.sleep}</div></div>
          <div class="admin-detail-row"><div class="admin-detail-lbl">복용중인 약</div><div class="admin-detail-val">${d.meds || '없음'}</div></div>
          <div class="admin-detail-row"><div class="admin-detail-lbl">연락가능시간</div><div class="admin-detail-val">${d.callTime}</div></div>
          <div class="admin-detail-row"><div class="admin-detail-lbl">주소</div><div class="admin-detail-val">${d.address}</div></div>
          <div class="admin-detail-row"><div class="admin-detail-lbl">소개자</div><div class="admin-detail-val">${d.referrer || '-'}</div></div>
         `;
    } else {
      const d = item.detail;
      html += `
          <div class="admin-detail-row"><div class="admin-detail-lbl">원하는 개월수</div><div class="admin-detail-val">${d.months}</div></div>
          <div class="admin-detail-row"><div class="admin-detail-lbl">통화여부</div><div class="admin-detail-val">${d.needCall}</div></div>
          <div class="admin-detail-row"><div class="admin-detail-lbl">연락가능시간</div><div class="admin-detail-val">${d.callTime || '-'}</div></div>
         `;
    }

    document.getElementById('crm-detail-content').innerHTML = html;
    crmDetailModal.classList.add('active');
  };

  window.markCrmDone = function (id) {
    let cd = JSON.parse(localStorage.getItem('crm_data') || '[]');
    const idx = cd.findIndex(i => i.id === id);
    if (idx > -1) {
      cd[idx].status = 'done';
      localStorage.setItem('crm_data', JSON.stringify(cd));
      renderCrmTable();
    }
  };

  function renderCrmTable() {
    const cd = JSON.parse(localStorage.getItem('crm_data') || '[]');
    const tbody = document.getElementById('crm-table-body');

    document.getElementById('stat-total').textContent = cd.length;
    document.getElementById('stat-pending').textContent = cd.filter(i => i.status === 'pending').length;

    if (cd.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-tertiary);">접수 내역이 없습니다.</td></tr>';
      return;
    }

    let html = '';
    cd.forEach((item, index) => {
      const d = new Date(item.date);
      const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const statusHtml = item.status === 'pending' ? '<span class="status-badge status-pending">대기중</span>' : '<span class="status-badge status-done">완료됨</span>';
      const actionBtn = item.status === 'pending' ? `<button onclick="markCrmDone('${item.id}')" class="detail-btn" style="margin-left:8px; background:#BBF7D0; color:#166534;">완료처리</button>` : '';

      html += `
          <tr>
            <td>${cd.length - index}</td>
            <td>${dateStr}</td>
            <td><span style="font-weight:600; color:var(--primary);">${item.type}</span></td>
            <td>${item.name} <span style="color:var(--text-tertiary); font-size:0.85rem;">(${item.phone.slice(-4)})</span></td>
            <td>${statusHtml}</td>
            <td>
              <button onclick="openCrmDetail('${item.id}')" class="detail-btn">보기</button>
              ${actionBtn}
            </td>
          </tr>
        `;
    });
    tbody.innerHTML = html;
  }

  // ==========================================
  // ADMIN TAB SWITCHING
  // ==========================================
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-tab-pane').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`admin-tab-${targetTab}`).classList.add('active');

      if (targetTab === 'blog') renderAdminBlogList();
      if (targetTab === 'crm') renderCrmTable();
    });
  });

  // ==========================================
  // BLOG / COMMUNITY LOGIC
  // ==========================================
  const blogGrid = document.getElementById('blog-grid');
  const blogDetailModal = document.getElementById('blog-detail-modal');
  const blogDetailClose = document.getElementById('blog-detail-close');
  const blogDetailContent = document.getElementById('blog-detail-content');

  const samplePosts = [
    {
      id: 'p1', title: '건강한 다이어트를 위한 식단 가이드', category: '다이어트', date: '2026.04.10', autor: '김민부',
      thumb: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80',
      content: '다이어트에서 가장 중요한 것은 굶는 것이 아니라 영양 균형입니다. 하루 세 끼를 규칙적으로 챙기되, 탄수화물의 양을 조절하고 단백질 섭취를 늘리는 것이 핵심입니다. 슬림환은 이러한 식단 관리를 더욱 수월하게 도와주는 보조적인 역할을 수행합니다.'
    },
    {
      id: 'p2', title: '만성 변비에서 벗어나는 3가지 습관', category: '장건강', date: '2026.04.08', autor: '김민부',
      thumb: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
      content: '첫째, 아침에 일어나자마자 미지근한 물 한 잔을 마셔 장을 깨워주세요. 둘째, 식이섬유가 풍부한 채소 위주의 식단을 구성하세요. 셋째, 규칙적인 운동으로 장 운동을 활성화하세요. 해결이 어려운 만성 변비에는 쾌변환의 윤장 기능을 활용하는 것도 좋은 방법입니다.'
    },
    {
      id: 'p3', title: '숙면을 방해하는 카페인, 언제까지 마셔도 될까?', category: '수면케어', date: '2026.04.05', autor: '김민부',
      thumb: 'https://images.unsplash.com/photo-1541167760496-162955ed8a9f?auto=format&fit=crop&w=800&q=80',
      content: '카페인은 섭취 후 반감기가 상당히 깁니다. 오후 2시 이후의 카페인 섭취는 밤잠의 질을 떨어뜨릴 수 있습니다. 충분한 휴식이 필요한 밤, 뒤척임이 심하다면 카페인을 줄이고 든ː잠과 함께 몸의 긴장을 풀어보시길 권장합니다.'
    }
  ];

  function initBlog() {
    let posts = JSON.parse(localStorage.getItem('blog_posts'));
    if (!posts || posts.length === 0) {
      localStorage.setItem('blog_posts', JSON.stringify(samplePosts));
    }
    renderBlogGrid('all');
  }

  function renderBlogGrid(filter = 'all') {
    const posts = JSON.parse(localStorage.getItem('blog_posts') || '[]');
    const filtered = filter === 'all' ? posts : posts.filter(p => p.category === filter);

    if (!blogGrid) return;

    let html = '';
    filtered.forEach(p => {
      html += `
          <div class="blog-card" onclick="openBlogDetail('${p.id}')">
            <div class="blog-card-thumb"><img src="${p.thumb || 'https://images.unsplash.com/photo-1516515420317-062e1281896d?auto=format&fit=crop&w=800&q=80'}" alt="${p.title}"></div>
            <div class="blog-card-info">
              <span class="blog-card-cat">${p.category}</span>
              <h3 class="blog-card-title">${p.title}</h3>
              <p class="blog-card-desc">${p.content.substring(0, 100)}...</p>
              <div class="blog-card-footer">
                <span>By 김민부 원장</span>
                <span>${p.date}</span>
              </div>
            </div>
          </div>
        `;
    });
    blogGrid.innerHTML = html;
  }

  // Category filtering
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderBlogGrid(btn.dataset.filter);
    });
  });

  window.openBlogDetail = function (id) {
    const posts = JSON.parse(localStorage.getItem('blog_posts') || '[]');
    const p = posts.find(item => item.id === id);
    if (!p) return;

    blogDetailContent.innerHTML = `
        <span class="blog-read-cat">${p.category}</span>
        <h2 class="blog-read-title">${p.title}</h2>
        <div class="blog-read-meta">
          <span>작성자: 김민부 원장</span>
          <span>•</span>
          <span>발행일: ${p.date}</span>
        </div>
        ${p.thumb ? `<img src="${p.thumb}" style="width:100%; border-radius:12px; margin-bottom:40px;">` : ''}
        <div class="blog-read-content">${p.content}</div>
      `;
    blogDetailModal.classList.add('active');
  };

  if (blogDetailClose) {
    blogDetailClose.addEventListener('click', () => {
      blogDetailModal.classList.remove('active');
    });
  }

  // ==========================================
  // ADMIN BLOG MANAGEMENT
  // ==========================================
  const blogInputFile = document.getElementById('blog-input-file');
  const blogFilePreview = document.getElementById('blog-file-preview');
  const blogFilePreviewImg = blogFilePreview ? blogFilePreview.querySelector('img') : null;

  if (blogInputFile) {
    blogInputFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          blogFilePreviewImg.src = ev.target.result;
          blogFilePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
        blogFilePreview.style.display = 'none';
      }
    });
  }

  const btnSavePost = document.getElementById('btn-save-post');
  if (btnSavePost) {
    btnSavePost.addEventListener('click', () => {
      const title = document.getElementById('blog-input-title').value;
      const cat = document.getElementById('blog-input-cat').value;
      const content = document.getElementById('blog-input-content').value;
      const file = blogInputFile.files[0];

      if (!title || !content) {
        alert('제목과 내용을 입력해주세요.');
        return;
      }

      const save = (thumbData) => {
        const now = new Date();
        const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

        const newPost = {
          id: 'p' + Date.now(),
          title, category: cat, thumb: thumbData, content,
          date: dateStr, author: '김민부'
        };

        let posts = JSON.parse(localStorage.getItem('blog_posts') || '[]');
        posts.unshift(newPost);
        localStorage.setItem('blog_posts', JSON.stringify(posts));

        // Clear form
        document.getElementById('blog-input-title').value = '';
        document.getElementById('blog-input-content').value = '';
        blogInputFile.value = '';
        blogFilePreview.style.display = 'none';

        alert('칼럼이 발행되었습니다.');
        renderAdminBlogList();
        renderBlogGrid('all');
      };

      if (file) {
        if (file.size > 3 * 1024 * 1024) { // 3MB Limit
          alert('이미지 파일이 너무 큽니다. 3MB 이하의 파일을 사용해 주세요.');
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => save(e.target.result);
        reader.readAsDataURL(file);
      } else {
        save(''); // No image
      }
    });
  }

  function renderAdminBlogList() {
    const posts = JSON.parse(localStorage.getItem('blog_posts') || '[]');
    const listEl = document.getElementById('admin-blog-list');
    if (!listEl) return;

    let html = '';
    posts.forEach(p => {
      html += `
          <div class="admin-blog-item">
            <div class="admin-blog-info">
              <h4>${p.title}</h4>
              <span>${p.category} | ${p.date}</span>
            </div>
            <button onclick="deletePost('${p.id}')" style="color:#EF4444; font-weight:600; cursor:pointer; background:none; border:none;">삭제</button>
          </div>
        `;
    });
    listEl.innerHTML = html || '<p style="text-align:center; color:var(--text-tertiary);">발행된 글이 없습니다.</p>';
  }

  window.deletePost = function (id) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    let posts = JSON.parse(localStorage.getItem('blog_posts') || '[]');
    posts = posts.filter(p => p.id !== id);
    localStorage.setItem('blog_posts', JSON.stringify(posts));
    renderAdminBlogList();
    renderBlogGrid('all');
  };

  // Initialize Blog
  initBlog();
});
