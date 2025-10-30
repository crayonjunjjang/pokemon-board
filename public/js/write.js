document.addEventListener('DOMContentLoaded', () => {
  const writeForm = document.getElementById('write-form');

  writeForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();

    if (title && content) {
      fetch('/api/pokemon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content: `<p>${content}</p>` }),
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('글 작성에 실패했습니다.');
        }
        return response.json();
      })
      .then(() => {
        window.location.href = 'index.html';
      })
      .catch(error => {
        console.error('Error creating post:', error);
        alert(error.message);
      });
    }
  });
});
