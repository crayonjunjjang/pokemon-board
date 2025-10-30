document.addEventListener('DOMContentLoaded', async () => {
  const usersBody = document.getElementById('users-body');
  const postsBody = document.getElementById('posts-body');

  try {
    const response = await fetch('/api/admin/data');
    if (!response.ok) {
      if (response.status === 401) {
        alert('로그인이 필요합니다.');
        window.location.href = '/login.html';
      } else if (response.status === 403) {
        alert('관리자 권한이 필요합니다.');
        window.location.href = '/';
      }
      throw new Error('Failed to fetch admin data');
    }

    const { users, posts } = await response.json();

    // Populate users table
    usersBody.innerHTML = users.map(user => `
      <tr>
        <td>${user.id}</td>
        <td>${user.name}</td>
        <td>${user.username}</td>
        <td>
          <button class="delete-user-btn" data-id="${user.id}">삭제</button>
        </td>
      </tr>
    `).join('');

    // Populate posts table
    postsBody.innerHTML = posts.map(post => `
      <tr>
        <td>${post.id}</td>
        <td>${post.title}</td>
        <td>${post.author}</td>
        <td>${new Date(post.createdAt).toLocaleDateString()}</td>
        <td>
          <button class="delete-post-btn" data-id="${post.id}">삭제</button>
        </td>
      </tr>
    `).join('');

    // Add event listeners for delete buttons
    document.querySelectorAll('.delete-user-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const userId = e.target.dataset.id;
        if (confirm(`정말로 사용자 ID ${userId}를 삭제하시겠습니까?`)) {
          try {
            const deleteResponse = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
            if (deleteResponse.ok) {
              alert('사용자가 삭제되었습니다.');
              location.reload();
            } else {
              const errorText = await deleteResponse.text();
              alert(`사용자 삭제 실패: ${errorText}`);
            }
          } catch (error) {
            console.error('Error deleting user:', error);
            alert('사용자 삭제 중 오류가 발생했습니다.');
          }
        }
      });
    });

    document.querySelectorAll('.delete-post-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        const postId = e.target.dataset.id;
        if (confirm(`정말로 게시글 ID ${postId}를 삭제하시겠습니까?`)) {
          try {
            const deleteResponse = await fetch(`/api/admin/posts/${postId}`, { method: 'DELETE' });
            if (deleteResponse.ok) {
              alert('게시글이 삭제되었습니다.');
              location.reload();
            } else {
              const errorText = await deleteResponse.text();
              alert(`게시글 삭제 실패: ${errorText}`);
            }
          } catch (error) {
            console.error('Error deleting post:', error);
            alert('게시글 삭제 중 오류가 발생했습니다.');
          }
        }
      });
    });

  } catch (error) {
    console.error('Error on admin page:', error);
  }
});
