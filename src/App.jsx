import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { db } from './firebase'; 
import { ref, push, onValue } from 'firebase/database';

const App = () => {
  const [showModal, setShowModal] = useState(false);
  const [records, setRecords] = useState([]);
  
  // 입력 필드 상태
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryCount, setDeliveryCount] = useState(""); // 납품(세트)
  const [materialCount, setMaterialCount] = useState(""); // 재료(세트)
  const [unitPrice, setUnitPrice] = useState("50,000"); // 단가 (기본값 50,000)

  useEffect(() => {
    // 1. db 연결 확인 및 databaseURL 경로 최적화 (Permission Denied 방지)
    if (!db) {
      console.error("Firebase DB 객체가 로드되지 않았습니다.");
      return;
    }

    try {
      // 2. 데이터 수신 경로 설정 (안정적인 방식)
      const recordsRef = ref(db, 'inventory');
      const unsubscribe = onValue(recordsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.entries(data).map(([id, value]) => ({ id, ...value }));
          // 날짜순 -> 최신순 정렬
          setRecords(list.sort((a, b) => new Date(b.date) - new Date(a.date) || b.timestamp - a.timestamp));
        } else {
          setRecords([]);
        }
      }, (error) => {
        // PERMISSION_DENIED가 뜨면 이곳에서 로깅됩니다.
        console.error("데이터 수신 오류 (Rules 확인 필수):", error);
      });
      
      // 언마운트 시 리스너 해제
      return () => unsubscribe();
    } catch (e) {
      console.error("Firebase 경로 설정 오류:", e);
    }
  }, []);

  // 천 단위 콤마 포맷팅
  const formatComma = (val) => {
    const num = val.toString().replace(/[^0-9]/g, "");
    return num ? Number(num).toLocaleString() : "";
  };

  // 단가 입력 핸들러
  const handleUnitPriceChange = (e) => {
    setUnitPrice(formatComma(e.target.value));
  };

  // 합계 계산 (납품 세트 * 단가)
  const calculateTotal = () => {
    const delivery = parseInt(deliveryCount) || 0;
    const price = parseInt(unitPrice.replace(/,/g, "")) || 0;
    return delivery * price;
  };

  // 3. 저장 로직 (async/await 기반 안정성 강화)
  const handleSave = async () => {
    // 유효성 검사
    if (!db) { alert("데이터베이스 설정 파일(firebase.js)이 없습니다."); return; }
    if (calculateTotal() < 0) { alert("금액 계산 오류"); return; }
    
    try {
      const totalPrice = calculateTotal();
      const recordsRef = ref(db, 'inventory');
      
      // 4. 데이터 전송 (가장 표준적인 push 방식)
      await push(recordsRef, {
        date,
        deliveryCount: parseInt(deliveryCount) || 0,
        materialCount: parseInt(materialCount) || 0,
        unitPrice: parseInt(unitPrice.replace(/,/g, "")) || 0,
        totalPrice: totalPrice,
        timestamp: Date.now(),
      });

      // 5. 성공 시 처리
      alert("저장되었습니다."); 
      setDeliveryCount("");
      setMaterialCount("");
      setUnitPrice("50,000"); // 저장 후 기본값으로 초기화
      setShowModal(false);
    } catch (error) {
      // PERMISSION_DENIED 등 모든 저장 오류를 팝업으로 상세히 표시
      console.error("저장 중 에러 발생:", error);
      alert("저장 실패 (원인: " + error.message + ")\nFirebase의 'databaseURL'과 '규칙'을 확인해주세요.");
    }
  };

  const monthlyTotal = records.reduce((sum, rec) => sum + (Number(rec.totalPrice) || 0), 0);

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '25px', letterSpacing: '-1.5px' }}>옷짓는 고양이</h1>
      
      {/* 대시보드 */}
      <div style={{ border: '3px solid #000', borderRadius: '24px', padding: '35px 20px', textAlign: 'center', marginBottom: '35px' }}>
        <div style={{ fontSize: '18px', color: '#555' }}>05월 납품액</div>
        <div style={{ fontSize: '42px', fontWeight: '900', margin: '15px 0' }}>
          총 {monthlyTotal.toLocaleString()}원
        </div>
      </div>

      {/* 리스트 */}
      <div style={{ marginBottom: '100px' }}>
        <h3 style={{ borderBottom: '2px solid #000', paddingBottom: '10px' }}>최근 납품 내역</h3>
        {records.map(rec => (
          <div key={rec.id} style={{ padding: '15px 0', borderBottom: '1px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#888' }}>{rec.date}</span>
              <span style={{ fontWeight: 'bold' }}>{rec.totalPrice?.toLocaleString()}원</span>
            </div>
            <div style={{ fontSize: '15px', marginTop: '5px' }}>
              납품 {rec.deliveryCount} / 재료 {rec.materialCount} (단가: {rec.unitPrice?.toLocaleString()})
            </div>
          </div>
        ))}
      </div>

      {/* 플로팅 버튼 */}
      <button onClick={() => setShowModal(true)} style={{ position: 'fixed', bottom: '40px', right: '30px', width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
        <Plus size={35} />
      </button>

      {/* 입력 모달 (겹침 문제 수정) */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '25px', width: '90%', maxWidth: '420px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>새 기록 추가</h2>
              <X onClick={() => setShowModal(false)} style={{ cursor: 'pointer' }} />
            </div>

            {/* 날짜 필드 */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', color: '#888' }}>날짜</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', marginTop: '5px', boxSizing: 'border-box' }} />
            </div>

            {/* 납품/재료 필드 (CSS Grid로 절대 안 겹치게 수정) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#888' }}>납품(세트)</label>
                <input type="number" placeholder="0" value={deliveryCount} onChange={(e) => setDeliveryCount(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '16px', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#888' }}>재료(세트)</label>
                <input type="number" placeholder="0" value={materialCount} onChange={(e) => setMaterialCount(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '16px', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* 단가 필드 */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', color: '#888' }}>단가(원)</label>
              <input type="text" value={unitPrice} onChange={handleUnitPriceChange} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '10px', textAlign: 'right', fontSize: '18px', fontWeight: 'bold', marginTop: '5px', boxSizing: 'border-box' }} />
            </div>

            {/* 자동 계산된 합계 표시 */}
            <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '12px', marginBottom: '25px', textAlign: 'right' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>합계: </span>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{calculateTotal().toLocaleString()}원</span>
            </div>

            <button 
              onClick={handleSave} 
              style={{ width: '100%', padding: '20px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '15px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              저장하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
