// community.js

document.addEventListener('DOMContentLoaded', () => {
  const loadingState = document.getElementById('loading-state');
  const communityBoard = document.getElementById('community-board');
  const API_BASE_URL = 'https://notion-replyss.vercel.app/api'; // Vercel 서버 주소

  // 게시글 목록 가져오기 함수
  async function fetchPosts() {
    try {
      // API 키 설정 전까지는 모의(Mock) 화면을 보여주거나 로딩을 막기 위해 잠시 대기
      loadingState.style.display = 'block';
      communityBoard.style.display = 'none';

      const response = await fetch(`${API_BASE_URL}/posts`);
      if (!response.ok) {
        throw new Error('API 서버에 연결할 수 없거나 노션 연동이 안 되어 있습니다.');
      }
      const data = await response.json();
      renderPosts(data.results);
    } catch (error) {
      console.warn(error);
      loadingState.style.display = 'none';
      communityBoard.style.display = 'grid';
      // 에러 발생 시 UI 유지를 위해 아무것도 하지 않음 (기본 스켈레톤 유지)
    }
  }

  // 게시글 목록 렌더링 함수
  function renderPosts(posts) {
    communityBoard.innerHTML = ''; // 스켈레톤 삭제
    loadingState.style.display = 'none';
    communityBoard.style.display = 'grid';

    if (!posts || posts.length === 0) {
      communityBoard.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">아직 등록된 칼럼이 없습니다.</p>';
      return;
    }

    posts.forEach((post, index) => {
      // 속성에 따라 다름. 노션 DB 구조(제목, 태그, 요약, 이미지)에 맞춰 변경 가능
      const title = post.properties['이름']?.title[0]?.plain_text || '제목 없음';
      const category = post.properties['카테고리']?.select?.name || '칼럼';
      const summary = post.properties['요약']?.rich_text[0]?.plain_text || post.properties['요악']?.rich_text[0]?.plain_text || '내용이 없습니다.';
      const date = post.created_time ? new Date(post.created_time).toLocaleDateString() : '';
      
      const coverUrl = post.cover?.external?.url || post.cover?.file?.url || 'assets/images/placeholder.png';

      const card = document.createElement('a');
      card.href = `article.html?id=${post.id}&title=${encodeURIComponent(title)}&cover=${encodeURIComponent(coverUrl)}`;
      card.className = 'blog-card fade-in';
      card.style.animationDelay = `${index * 0.1}s`;
      card.style.textDecoration = 'none';
      card.style.color = 'inherit';
      card.innerHTML = `
        <img src="${coverUrl}" class="blog-card-img" alt="${title}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\' width=\\\'100%\\\' height=\\\'100%\\\'><rect width=\\\'100%\\\' height=\\\'100%\\\' fill=\\\'#293855\\\'/></svg>'">
        <div class="blog-card-content">
          <div class="blog-card-tag">${category}</div>
          <div class="blog-card-title">${title}</div>
          <div class="blog-card-desc">${summary}</div>
          <div class="blog-card-footer">
            <span>${date}</span>
            <span style="color:var(--primary); font-weight:600;">읽어보기 →</span>
          </div>
        </div>
      `;

      communityBoard.appendChild(card);

      // 애니메이션 발동을 위해 약간의 지연 후 visible 클래스 추가
      setTimeout(() => {
        card.classList.add('visible');
      }, 50);
    });
  }


  // 초기 로드 시도
  // 노션 API 키가 연동되기 전에는 에러가 발생하므로, 스켈레톤 UI를 보여줍니다.
  fetchPosts();
});
