import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { db } from './firebase'; // 설정하신 firebase 파일을 가져옵니다
import { ref, push, onValue, set } from 'firebase/database';

const App = () => {
  const [showModal, setShowModal] = useState(false);
  const [records, setRecords] = useState([]); // DB 데이터를 담을 공간
  const [amount, setAmount] = useState("");
  const [itemName, setItemName] = useState("");

  // 1. 실시간 데이터 불러오기 (최신순 정렬 포함)
  useEffect(() => {
    const recordsRef = ref(db, 'inventory');
    onValue(recordsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        // 최근 기록이 위로 오도록 최신순 정렬
        setRecords(list.reverse());
      }
    });
  }, []);

  // 2. 금액 포맷팅 (1,000 단위 콤마)
  const formatComma = (val) => {
    const num = val.replace(/[^0-9]/g, "");
    return num ? Number(num).toLocaleString() : "";
  };

  const handleAmountChange = (e) => {
    setAmount(formatComma(e.target.value));
  };

  // 3. 저장 로직 (버그 수정 및 0원 저장 허용)
  const handleSave = () => {
    // 버그 수정: amount가 "0"일 때도 저장이 되도록 조건 강화
    if (amount === "" && amount !== "0") {
      alert("금액을 입력해주세요.");
      return;
    }

    const recordsRef = ref(db, 'inventory');
    const newRecordRef = push(recordsRef);
    
    set(newRecordRef, {
      name: itemName || "항목 없음",
      price: parseInt(amount.replace(/,/g, "")) || 0, // 콤마 제거 후 숫자로 저장
      timestamp: Date.now(),
    }).then(() => {
      // 저장 성공 후 초기화
      setAmount("");
      setItemName("");
      setShowModal(false);
    }).catch((error) => {
      console.error("저장 중 오류 발생:", error);
    });
  };

  const totalAmount = records.reduce((sum, rec) => sum + (rec.price || 0), 0);

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>옷짓는 고양이 프로젝트</h1>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>2026. 05. 11.</p>
      
      {/* 대시보드: 테두리 색상 및 시인성 강화 */}
      <div style={{ 
        border: '2px solid #5C6BC0', 
        borderRadius: '20px', 
        padding: '30px', 
        backgroundColor: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <div style={{ color: '#666', fontSize: '18px', marginBottom: '10px' }}>05월 납품액</div>
        <div style={{ fontSize: '38px', fontWeight: '800', color: '#2C3E50' }}>
          총 {totalAmount.toLocaleString()}원
        </div>
        <div style={{ marginTop: '15px', color: '#888', fontSize: '15px' }}>
          월 납품 {records.length}세트 | 총 {records.length}세트
        </div>
      </div>

      {/* 최근 기록 리스트 (최신순) */}
      <div>
        <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>최근 기록</h3>
        {records.map(rec => (
          <div key={rec.id} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: '18px 10px', 
            borderBottom: '1px solid #f0f0f0' 
          }}>
            <span style={{ fontSize: '16px' }}>{rec.name}</span>
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{rec.price.toLocaleString()}원</span>
          </div>
        ))}
      </div>

      {/* 플로팅 버튼 */}
      <button 
        onClick={() => setShowModal(true)}
        style={{
          position: 'fixed', bottom: '40px', right: '30px',
          width: '70px', height: '70px', borderRadius: '50%',
          backgroundColor: '#5C6BC0', color: 'white', border: 'none',
          boxShadow: '0 6px 15px rgba(92, 107, 192, 0.4)', cursor: 'pointer',
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}
      >
        <Plus size={36} />
      </button>

      {/* 입력창 팝업 (더 크게) */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white', padding: '40px', borderRadius: '25px',
            width: '90%', maxWidth: '450px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
              <h2 style={{ margin: 0, fontSize: '22px' }}>기록 추가</h2>
              <X onClick={() => setShowModal(false)} style={{ cursor: 'pointer', color: '#999' }} />
            </div>
            
            <input 
              type="text" 
              placeholder="품목을 입력하세요"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              style={{ width: '100%', padding: '18px', marginBottom: '20px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '17px', boxSizing: 'border-box' }}
            />
            
            <input 
              type="text" 
              placeholder="금액 (0원 가능)"
              value={amount}
              onChange={handleAmountChange}
              style={{ width: '100%', padding: '18px', marginBottom: '30px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '24px', fontWeight: 'bold', textAlign: 'right', boxSizing: 'border-box' }}
            />

            <button 
              onClick={handleSave}
              style={{
                width: '100%', padding: '20px', borderRadius: '15px',
                backgroundColor: '#5C6BC0', color: 'white', border: 'none',
                fontSize: '20px', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              기록 저장하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;