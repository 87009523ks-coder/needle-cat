import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { db } from './firebase'; 
import { ref, push, onValue, set } from 'firebase/database';

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
        setRecords(list.sort((a, b) => b.timestamp - a.timestamp));
      }
    });
  }, []);

  const handleSave = () => {
    const cleanAmount = amount.replace(/,/g, "");
    if (cleanAmount === "") { alert("금액을 입력해주세요."); return; }

    const recordsRef = ref(db, 'inventory');
    push(recordsRef, {
      name: itemName || "항목 없음",
      price: parseInt(cleanAmount),
      timestamp: Date.now(),
    }).then(() => {
      setAmount(""); setItemName(""); setShowModal(false);
    });
  };

  const totalAmount = records.reduce((sum, rec) => sum + (Number(rec.price) || 0), 0);

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>옷짓는 고양이 프로젝트</h1>
      
      {/* 대시보드 시인성 강화 */}
      <div style={{ border: '3px solid #000', borderRadius: '24px', padding: '30px', textAlign: 'center', marginTop: '20px' }}>
        <div style={{ fontSize: '18px' }}>05월 납품액</div>
        <div style={{ fontSize: '42px', fontWeight: '900', margin: '10px 0' }}>
          총 {totalAmount.toLocaleString()}원
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>월 납품 {records.length}세트</div>
      </div>

      {/* 최신순 기록 리스트 */}
      <div style={{ marginTop: '30px', marginBottom: '100px' }}>
        {records.map(rec => (
          <div key={rec.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #eee' }}>
            <span>{rec.name}</span>
            <span style={{ fontWeight: 'bold' }}>{rec.price.toLocaleString()}원</span>
          </div>
        ))}
      </div>

      {/* 하단 큰 + 버튼 */}
      <button onClick={() => setShowModal(true)} style={{ position: 'fixed', bottom: '40px', right: '30px', width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#000', color: '#fff', border: 'none', fontSize: '40px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>+</button>

      {/* 더 커진 입력창 팝업 */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '30px', width: '85%', maxWidth: '400px' }}>
            <h2 style={{ marginBottom: '20px' }}>기록 추가</h2>
            <input type="text" placeholder="항목 명칭" value={itemName} onChange={(e) => setItemName(e.target.value)} style={{ width: '100%', padding: '15px', marginBottom: '15px', fontSize: '18px', boxSizing: 'border-box' }} />
            <input type="text" placeholder="금액 (0원 가능)" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ","))} style={{ width: '100%', padding: '15px', marginBottom: '25px', fontSize: '24px', fontWeight: 'bold', textAlign: 'right', boxSizing: 'border-box' }} />
            <button onClick={handleSave} style={{ width: '100%', padding: '20px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '15px', fontSize: '20px', fontWeight: 'bold' }}>저장하기</button>
            <button onClick={() => setShowModal(false)} style={{ width: '100%', marginTop: '10px', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>취소</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
