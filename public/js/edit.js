document.addEventListener('DOMContentLoaded', async () => {
  const editForm = document.getElementById('edit-form');
  const titleInput = document.getElementById('title');
  const contentInput = document.getElementById('content');
  const cancelButton = document.getElementById('cancel-button');

  const postId = new URLSearchParams(window.location.search).get('id');

  if (!postId) {
    alert('잘못된 접근입니다.');
    window.location.href = '/';
    return;
  }

  // Set cancel button link
  cancelButton.href = `/post.html?id=${postId}`;

  // Fetch existing post data and populate the form
  try {
    const res = await fetch(`/api/pokemon/${postId}`);
    if (!res.ok) {
      throw new Error('게시글 정보를 불러올 수 없습니다.');
    }
    const post = await res.json();
    titleInput.value = post.title;
    // The content has <p> tags, we need to remove them for editing
    contentInput.value = post.content.replace(/<p>|<\/p>/g, '');
  } catch (error) {
    alert(error.message);
    window.location.href = `/post.html?id=${postId}`;
  }

  // Handle form submission
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title || !content) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      const res = await fetch(`/api/pokemon/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content: `<p>${content}</p>` }),
      });

      if (res.ok) {
        alert('게시글이 수정되었습니다.');
        window.location.href = `/post.html?id=${postId}`;
      } else {
        const errorText = await res.text();
        alert(`수정 실패: ${errorText}`);
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('수정 중 오류가 발생했습니다.');
    }
  });
});
