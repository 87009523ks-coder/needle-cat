import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// 이 정보는 파이어베이스 콘솔 [프로젝트 설정]에서 확인 가능합니다.
// 현재 프로젝트 설정값이 없으므로, 본인의 설정값을 이 자리에 넣어야 합니다.
const firebaseConfig = {
  apiKey: "본인의_API_KEY",
  authDomain: "needle-cat.firebaseapp.com",
  databaseURL: "https://needle-cat-default-rtdb.asia-southeast1.firebasedatabase.app", // 리얼타임 데이터베이스 주소
  projectId: "needle-cat",
  storageBucket: "needle-cat.appspot.com",
  messagingSenderId: "본인의_ID",
  appId: "본인의_APP_ID"
};

// 파이어베이스 초기화
const app = initializeApp(firebaseConfig);

// 리얼타임 데이터베이스 객체 내보내기
export const db = getDatabase(app);
