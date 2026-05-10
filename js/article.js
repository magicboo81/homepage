// article.js

document.addEventListener('DOMContentLoaded', () => {
  const loadingState = document.getElementById('loading-state');
  const articleBody = document.getElementById('article-body');
  const articleTitleEl = document.getElementById('article-title');

  const API_BASE_URL = 'https://notion-replyss.vercel.app/api';

  const urlParams = new URLSearchParams(window.location.search);
  const pageId = urlParams.get('id');
  const title = urlParams.get('title') || '칼럼 읽기';
  const coverUrl = urlParams.get('cover');


  // 초기 렌더링
  articleTitleEl.textContent = title;

  // 동적 메타태그 설정 (SEO 보강)
  document.title = `${title} - 내몸에 온 한방연구소 건강 칼럼`;
  
  // 메타 태그 업데이트 함수 (동적으로 크롤러에게 정보 제공, JS 렌더링 지원 크롤러용)
  function updateMetaTags(titleText, coverImage) {
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) descMeta.setAttribute('content', `${titleText}에 대한 김민부 원장님의 칼럼입니다.`);
    
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', titleText);
    
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', window.location.href);

    const ogImageMeta = document.querySelector('meta[property="og:image"]');
    if (ogImageMeta && coverImage && !coverImage.includes('placeholder.png')) {
      ogImageMeta.setAttribute('content', coverImage);
    }

    // Schema.org JSON-LD 동적 추가
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    const jsonLdData = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": titleText,
      "author": {
        "@type": "Person",
        "name": "김민부 원장"
      },
      "publisher": {
        "@type": "Organization",
        "name": "내몸에 온 한방연구소",
        "logo": {
          "@type": "ImageObject",
          "url": new URL('assets/images/logo_icon.png', window.location.href).href
        }
      }
    };
    
    if (coverImage && !coverImage.includes('placeholder.png')) {
      jsonLdData.image = [coverImage];
    }
    
    script.text = JSON.stringify(jsonLdData);
    document.head.appendChild(script);
  }

  updateMetaTags(title, coverUrl);

  if (!pageId) {
    loadingState.style.display = 'none';
    articleBody.style.display = 'block';
    articleBody.innerHTML = '<div style="text-align:center; padding:40px; color:#ef4444;">잘못된 접근입니다. URL을 확인해주세요.</div>';
    return;
  }

  // 본문 가져오기 함수
  async function fetchArticle() {
    try {
      const response = await fetch(`${API_BASE_URL}/posts/${pageId}`);
      if (!response.ok) {
        throw new Error('본문을 가져오는데 실패했습니다.');
      }
      const data = await response.text(); // HTML 변환된 결과
      
      loadingState.style.display = 'none';
      articleBody.style.display = 'block';
      
      let finalHtml = '';
      if (coverUrl && !coverUrl.includes('placeholder.png')) {
        finalHtml += `<img src="${coverUrl}" alt="커버 이미지" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 12px; margin-bottom: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">`;
      }
      finalHtml += data;
      
      articleBody.innerHTML = finalHtml;
      
      // 이미지 스타일 등 보정
      articleBody.querySelectorAll('img').forEach(img => {
        img.style.maxWidth = '100%';
        img.style.borderRadius = '12px';
      });

    } catch (error) {
      console.error(error);
      loadingState.style.display = 'none';
      articleBody.style.display = 'block';
      articleBody.innerHTML = `<div style="text-align:center; padding: 40px; color: #ef4444;">오류가 발생했습니다. 나중에 다시 시도해 주세요. <br> ${error.message}</div>`;
    }
  }

  fetchArticle();
});
