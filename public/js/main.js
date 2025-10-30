document.addEventListener('DOMContentLoaded', async () => {
  const authLinks = document.getElementById('auth-links');
  const boardBody = document.getElementById('board-body');

  // 1. Check login status and render auth links
  try {
    const response = await fetch('/api/auth/status');
    const data = await response.json();

    if (data.loggedIn) {
      let adminLink = '';
      if (data.user.username === 'admin') {
        adminLink = `<a href="/admin.html" class="auth-button">관리자 페이지</a>`;
      }
      authLinks.innerHTML = `
        <span>환영합니다, ${data.user.name}님!</span>
        <a href="/write.html" class="write-button">글쓰기</a>
        <a href="#" id="logout-button" class="auth-button">로그아웃</a>
        ${adminLink}
      `;
      // Add event listener for logout
      document.getElementById('logout-button').addEventListener('click', async (e) => {
        e.preventDefault();
        await fetch('/api/auth/logout', { method: 'POST' });
        alert('로그아웃 되었습니다.');
        window.location.reload();
      });
    } else {
      authLinks.innerHTML = `
        <a href="/login.html" class="auth-button">로그인</a>
        <a href="/register.html" class="auth-button">회원가입</a>
      `;
    }
  } catch (error) {
    console.error('Error fetching auth status:', error);
    authLinks.innerHTML = `
        <a href="/login.html" class="auth-button">로그인</a>
        <a href="/register.html" class="auth-button">회원가입</a>
      `;
  }

  // 2. Fetch and render posts
  try {
    const response = await fetch('/api/pokemon');
    if (!response.ok) {
      throw new Error('데이터를 불러오는 데 실패했습니다.');
    }
    const posts = await response.json();

    if (posts.length === 0) {
      boardBody.innerHTML = '<tr><td colspan="4">게시글이 없습니다.</td></tr>';
    } else {
      const rows = posts.map(post => {
        return `
          <tr data-id="${post.id}">
            <td class="col-id">${post.id}</td>
            <td class="col-title">${post.title}</td>
            <td class="col-author">${post.author}</td>
            <td class="col-date">${post.createdAt}</td>
          </tr>
        `;
      }).join('');
      boardBody.innerHTML = rows;
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
    boardBody.innerHTML = `<tr><td colspan="4">${error.message}</td></tr>`;
  }

  // 3. Add click event listener to board rows
  boardBody.addEventListener('click', (event) => {
    const row = event.target.closest('tr');
    if (row) {
      const postId = row.dataset.id;
      if (postId) {
        window.location.href = `/post.html?id=${postId}`;
      }
    }
  });
});