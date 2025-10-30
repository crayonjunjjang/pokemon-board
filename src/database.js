// Node.js의 파일 시스템 모듈을 비동기(Promise 기반) 방식으로 사용하기 위해 불러옵니다.
const fs = require('fs').promises;
// 파일 및 디렉토리 경로 작업을 위한 Node.js의 path 모듈을 불러옵니다.
const path = require('path');

// 데이터베이스 파일(db.json)의 경로를 구성합니다.
// 운영 환경(production)에서는 Render의 영구 디스크 경로를, 그 외에는 로컬 경로를 사용합니다.
const dbPath = path.join(__dirname, '..', 'db.json');

/**
 * 비동기적으로 데이터베이스 파일(db.json)을 읽고 파싱합니다.
 * 파일이 존재하지 않으면 기본 구조로 파일을 생성하고 반환합니다.
 * @returns {Promise<object>} 파싱된 데이터베이스 객체
 */
const readDb = async () => {
  try {
    // db.json 파일을 UTF-8 인코딩으로 읽어옵니다.
    const data = await fs.readFile(dbPath, 'utf8');
    // 읽어온 JSON 문자열을 JavaScript 객체로 파싱하여 반환합니다.
    return JSON.parse(data);
  } catch (error) {
    // 파일이 존재하지 않는 경우 (ENOENT 오류 코드)
    if (error.code === 'ENOENT') {
      // 기본 데이터베이스 구조를 정의합니다 (빈 사용자 배열과 빈 게시물 배열).
      const defaultDb = { users: [], posts: [] };
      // 기본 구조로 db.json 파일을 생성하고 저장합니다.
      await writeDb(defaultDb);
      // 생성된 기본 데이터베이스 객체를 반환합니다.
      return defaultDb;
    }
    // 그 외의 다른 오류는 다시 throw하여 상위 호출자에게 전달합니다.
    throw error;
  }
};

/**
 * 비동기적으로 JavaScript 객체를 JSON 형식으로 직렬화하여 데이터베이스 파일(db.json)에 씁니다.
 * JSON 파일은 가독성을 위해 2칸 들여쓰기로 포맷됩니다.
 * @param {object} data - db.json에 쓸 JavaScript 객체
 * @returns {Promise<void>}
 */
const writeDb = async (data) => {
  // JavaScript 객체를 JSON 문자열로 변환하고, 가독성을 위해 2칸 들여쓰기를 적용합니다.
  // UTF-8 인코딩으로 db.json 파일에 씁니다.
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
};

// readDb와 writeDb 함수를 모듈의 외부로 내보냅니다.
module.exports = { readDb, writeDb };