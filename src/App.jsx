import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { db } from './firebase'; 
import { ref, push, onValue } from 'firebase/database';

const App = () => {
  const [showModal, setShowModal] = useState(false);
  const [records, setRecords] = useState([]);
  const [amount, setAmount] = useState("");
  const [itemName, setItemName] = useState("");

  useEffect(() => {
    const recordsRef = ref(db, 'inventory');
    onValue(recordsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, value]) => ({ id, ...value }));
        // 최신순 정렬 (timestamp 기준)
        setRecords(list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
      } else {
        setRecords([]);
      }
    });
  }, []);

  const handleSave = () => {
    const cleanAmount = amount.replace(/,/g, "");
    // 0원 입력 시에도 저장되도록 조건 수정
    if (cleanAmount === "") { alert("금액을 입력해주세요."); return; }

    const recordsRef = ref(db, 'inventory');
    push(recordsRef, {
      name: itemName || "항목 없음",
      price: parseInt(cleanAmount) || 0,
      timestamp: Date.now(),
    }).then(() => {
      setAmount(""); setItemName(""); setShowModal(false);
    }).catch((err) => alert("저장 실패: " + err.message));
  };

  const totalAmount = records.reduce((sum, rec) => sum + (Number(rec.price) || 0), 0);

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '26px', fontWeight: 'bold', marginBottom: '20px' }}>옷짓는 고양이 프로젝트</h1>
      
      {/* 대시보드: 검정색 테두리 및 시인성 강화 */}
      <div style={{ border: '3px solid #000', borderRadius: '24px', padding: '35px 20px', textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ fontSize: '18px', color: '#555' }}>05월 납품액</div>
        <div style={{ fontSize: '42px', fontWeight: '900', margin: '15px 0' }}>
          총 {totalAmount.toLocaleString()}원
        </div>
        <div style={{ fontSize: '15px', color: '#888' }}>월 납품 {records.length}세트 | 총 {records.length}세트</div>
      </div>

      {/* 최근 기록 리스트 (최신순) */}
      <div style={{ marginBottom: '100px' }}>
        <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>최근 기록</h3>
        {records.map(rec => (
          <div key={rec.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #f9f9f9' }}>
            <span style={{ fontSize: '17px' }}>{rec.name}</span>
            <span style={{ fontWeight: 'bold', fontSize: '17px' }}>{rec.price.toLocaleString()}원</span>
          </div>
        ))}
      </div>

      {/* 하단 + 버튼 */}
      <button 
        onClick={() => setShowModal(true)} 
        style={{ position: 'fixed', bottom: '40px', right: '30px', width: '75px', height: '75px', borderRadius: '50%', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}
      >
        <Plus size={40} />
      </button>

      {/* 입력창 팝업: 크게 확대 */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', padding: '40px 30px', borderRadius: '30px', width: '90%', maxWidth: '400px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
              <h2 style={{ margin: 0, fontSize: '24px' }}>기록 추가</h2>
              <X onClick={() => setShowModal(false)} style={{ cursor: 'pointer' }} />
            </div>
            <input 
              type="text" placeholder="항목 명칭" value={itemName} onChange={(e) => setItemName(e.target.value)} 
              style={{ width: '100%', padding: '18px', marginBottom: '15px', fontSize: '18px', border: '1px solid #ddd', borderRadius: '12px', boxSizing: 'border-box' }} 
            />
            <input 
              type="text" placeholder="금액 (0원 가능)" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ","))} 
              style={{ width: '100%', padding: '18px', marginBottom: '30px', fontSize: '28px', fontWeight: 'bold', textAlign: 'right', border: '1px solid #ddd', borderRadius: '12px', boxSizing: 'border-box' }} 
            />
            <button 
              onClick={handleSave} 
              style={{ width: '100%', padding: '20px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '15px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer' }}
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
