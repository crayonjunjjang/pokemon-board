document.addEventListener('DOMContentLoaded', async () => {
  const postTitle = document.getElementById('post-title');
  const postAuthor = document.getElementById('post-author');
  const postDate = document.getElementById('post-date');
  const postBody = document.querySelector('.post-body');
  const commentsList = document.getElementById('comments-list');
  const commentFormContainer = document.getElementById('comment-form-container');
  const postActionsContainer = document.getElementById('post-actions');

  const postId = new URLSearchParams(window.location.search).get('id');

  if (!postId) {
    postBody.innerHTML = '<p>게시글을 찾을 수 없습니다.</p>';
    return;
  }

  // Fetch auth status and post data in parallel
  const [authRes, postRes] = await Promise.all([
    fetch('/api/auth/status'),
    fetch(`/api/pokemon/${postId}`)
  ]);

  const authData = await authRes.json();

  if (!postRes.ok) {
    postBody.innerHTML = `<p>게시글을 불러오는 데 실패했습니다.</p>`;
    return;
  }
  const post = await postRes.json();

  // --- Render Functions ---
  const renderPost = () => {
    postTitle.textContent = post.title;
    postAuthor.textContent = post.author;
    postDate.textContent = post.createdAt;
    postBody.innerHTML = post.content;
  };

  function renderComments(comments, authData) {
    const currentUser = authData.loggedIn ? authData.user : null;
    if (comments && comments.length > 0) {
      commentsList.innerHTML = comments.map(comment => `
        <div class="comment" data-comment-id="${comment.id}">
          <div class="comment-main">
            <div class="comment-meta">
              <strong>${comment.author}</strong> - 
              <span class="comment-date">${new Date(comment.createdAt).toLocaleString()}</span>
            </div>
            <div class="comment-body">
              <p>${comment.content.replace(/\n/g, '<br>')}</p>
            </div>
          </div>
          <div class="comment-actions">
            ${currentUser && currentUser.id === comment.authorId ? `
              <button class="edit-comment-btn icon-button"><i class="fas fa-pencil-alt"></i></button>
              <button class="delete-comment-btn icon-button"><i class="fas fa-trash-alt"></i></button>
            ` : ''}
          </div>
        </div>
      `).join('');

      // Add event listeners for comment actions
      commentsList.querySelectorAll('.comment').forEach(commentElement => {
        const commentId = commentElement.dataset.commentId;

        const deleteBtn = commentElement.querySelector('.delete-comment-btn');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', async () => {
            if (confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
              try {
                const response = await fetch(`/api/pokemon/${postId}/comments/${commentId}`, {
                  method: 'DELETE',
                });
                if (response.ok) {
                  // Optimistically remove the comment from the UI
                  commentElement.remove();
                } else {
                  alert('댓글 삭제에 실패했습니다.');
                }
              } catch (error) {
                console.error('Error deleting comment:', error);
                alert('댓글 삭제 중 오류가 발생했습니다.');
              }
            }
          });
        }

        const editBtn = commentElement.querySelector('.edit-comment-btn');
        if (editBtn) {
          editBtn.addEventListener('click', () => {
            const commentBody = commentElement.querySelector('.comment-body');
            const currentContent = commentBody.querySelector('p').innerHTML.replace(/<br>/g, '\n');
            
            commentBody.innerHTML = `
              <div class="edit-comment-form">
                <textarea class="edit-comment-textarea">${currentContent}</textarea>
                <div class="edit-comment-buttons">
                  <button class="btn btn-save-comment">저장</button>
                  <button class="btn btn-cancel-edit">취소</button>
                </div>
              </div>
            `;

            const saveBtn = commentElement.querySelector('.edit-comment-form .btn-save-comment');
            saveBtn.addEventListener('click', async () => {
              const newContent = commentElement.querySelector('.edit-comment-form .edit-comment-textarea').value;
              try {
                const response = await fetch(`/api/pokemon/${postId}/comments/${commentId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ content: newContent }),
                });

                if (response.ok) {
                  const updatedComment = await response.json();
                  commentBody.innerHTML = `<p>${updatedComment.content.replace(/\n/g, '<br>')}</p>`;
                } else {
                  alert('댓글 수정에 실패했습니다.');
                }
              } catch (error) {
                console.error('Error updating comment:', error);
                alert('댓글 수정 중 오류가 발생했습니다.');
              }
            });

            const cancelBtn = commentElement.querySelector('.edit-comment-form .btn-cancel-edit');
            cancelBtn.addEventListener('click', () => {
              commentBody.innerHTML = `<p>${currentContent.replace(/\n/g, '<br>')}</p>`;
            });
          });
        }
      });
    } else {
      commentsList.innerHTML = '<p>아직 댓글이 없습니다.</p>';
    }
  }

  const renderFormsAndActions = () => {
    if (authData.loggedIn) {
      // Render comment form
      commentFormContainer.innerHTML = `
        <form id="comment-form">
          <textarea id="comment-content" placeholder="댓글을 입력하세요..." required></textarea>
          <button type="submit">댓글 등록</button>
        </form>
      `;
      document.getElementById('comment-form').addEventListener('submit', handleCommentSubmit);

      // Render edit/delete buttons if user is the owner
      if (authData.user.name === post.author) {
        postActionsContainer.innerHTML = `
          <a href="/edit.html?id=${postId}" class="action-button edit-button"><i class="fas fa-pencil-alt"></i> 수정</a>
          <button id="delete-button" class="action-button delete-button"><i class="fas fa-trash-alt"></i> 삭제</button>
        `;
        document.getElementById('delete-button').addEventListener('click', handleDeleteSubmit);
      }
    }
  };

  // --- Event Handlers ---
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    const content = document.getElementById('comment-content').value.trim();
    if (!content) return;

    try {
      const res = await fetch(`/api/pokemon/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const newComment = await res.json();
        post.comments = post.comments ? [...post.comments, newComment] : [newComment];
        renderComments(post.comments, authData);
        document.getElementById('comment-content').value = '';
      } else {
        const errorText = await res.text();
        alert(`댓글 등록 실패: ${errorText}`);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('댓글 등록 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteSubmit = async () => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/pokemon/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        alert('게시글이 삭제되었습니다.');
        window.location.href = '/';
      } else {
        const errorText = await res.text();
        alert(`삭제 실패: ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // --- Initial Page Load ---
  renderPost();
  renderComments(post.comments, authData);
  renderFormsAndActions();
});
