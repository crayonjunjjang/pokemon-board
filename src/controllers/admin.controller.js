// 데이터베이스(db.json 파일) 읽기/쓰기 기능을 제공하는 유틸리티 함수를 불러옵니다.
const { readDb, writeDb } = require('../database');

/**
 * 관리자 페이지에 필요한 데이터를 조회하여 반환하는 컨트롤러 함수입니다.
 * 모든 게시글과 사용자 목록(비밀번호 제외)을 제공합니다.
 * @param {object} req - Express 요청 객체
 * @param {object} res - Express 응답 객체
 */
const getAdminData = async (req, res) => {
  try {
    // 데이터베이스를 읽어옵니다.
    const db = await readDb();
    // 사용자 목록에서 비밀번호 필드를 제외하고 반환합니다.
    const users = db.users.map(({ password, ...user }) => user);
    // 모든 게시글과 비밀번호가 제외된 사용자 목록을 JSON 형태로 응답합니다.
    res.status(200).json({ posts: db.posts, users });
  } catch (error) {
    // 오류 발생 시 콘솔에 에러를 기록하고 500 상태 코드와 함께 에러 메시지를 응답합니다.
    console.error('Error in getAdminData:', error);
    res.status(500).send('서버에서 오류가 발생했습니다.');
  }
};

/**
 * 특정 게시글을 삭제하는 컨트롤러 함수입니다.
 * @param {object} req - Express 요청 객체 (req.params.id로 게시글 ID를 받음)
 * @param {object} res - Express 응답 객체
 */
const deletePost = async (req, res) => {
  try {
    // 요청 파라미터에서 게시글 ID를 가져옵니다.
    const { id: postId } = req.params;
    // 데이터베이스를 읽어옵니다.
    const db = await readDb();
    // 데이터베이스에서 해당 ID를 가진 게시글의 인덱스를 찾습니다.
    const postIndex = db.posts.findIndex(p => p.id === parseInt(postId));

    // 게시글을 찾을 수 없으면 404 상태 코드와 함께 메시지를 응답합니다.
    if (postIndex === -1) {
      return res.status(404).send('게시글을 찾을 수 없습니다.');
    }

    // 게시글 목록에서 해당 인덱스의 게시글을 제거합니다.
    db.posts.splice(postIndex, 1);
    // 변경된 데이터베이스를 파일에 씁니다.
    await writeDb(db);
    // 200 상태 코드와 함께 성공 메시지를 응답합니다.
    res.status(200).send('게시글이 삭제되었습니다.');
  } catch (error) {
    // 오류 발생 시 콘솔에 에러를 기록하고 500 상태 코드와 함께 에러 메시지를 응답합니다.
    console.error('Error in deletePost:', error);
    res.status(500).send('서버에서 오류가 발생했습니다.');
  }
};

/**
 * 특정 사용자를 삭제하는 컨트롤러 함수입니다.
 * @param {object} req - Express 요청 객체 (req.params.id로 사용자 ID를 받음, req.session.user로 현재 로그인 사용자 정보 확인)
 * @param {object} res - Express 응답 객체
 */
const deleteUser = async (req, res) => {
  try {
    // 요청 파라미터에서 사용자 ID를 가져옵니다.
    const { id: userId } = req.params;
    // 데이터베이스를 읽어옵니다.
    const db = await readDb();

    // 현재 로그인한 사용자가 자기 자신을 삭제하려고 시도하는 경우를 방지합니다.
    if (parseInt(userId) === req.session.user.id) {
        return res.status(400).send('자기 자신을 삭제할 수 없습니다.');
    }

    // 데이터베이스에서 해당 ID를 가진 사용자의 인덱스를 찾습니다.
    const userIndex = db.users.findIndex(u => u.id === parseInt(userId));

    // 사용자를 찾을 수 없으면 404 상태 코드와 함께 메시지를 응답합니다.
    if (userIndex === -1) {
      return res.status(404).send('사용자를 찾을 수 없습니다.');
    }

    // 사용자 목록에서 해당 인덱스의 사용자를 제거합니다.
    db.users.splice(userIndex, 1);
    // 변경된 데이터베이스를 파일에 씁니다.
    await writeDb(db);
    // 200 상태 코드와 함께 성공 메시지를 응답합니다.
    res.status(200).send('사용자가 삭제되었습니다.');
  } catch (error) {
    // 오류 발생 시 콘솔에 에러를 기록하고 500 상태 코드와 함께 에러 메시지를 응답합니다.
    console.error('Error in deleteUser:', error);
    res.status(500).send('서버에서 오류가 발생했습니다.');
  }
};

// 모든 컨트롤러 함수들을 모듈의 외부로 내보냅니다.
module.exports = { getAdminData, deletePost, deleteUser };