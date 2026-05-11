import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import { db } from './firebase'; 
import { ref, push, onValue } from 'firebase/database';

const App = () => {
  const [showModal, setShowModal] = useState(false);
  const [records, setRecords] = useState([]);
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const todayString = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  // 연도 선택 리스트 자동 생성 (2024년부터 현재 연도 + 1년까지)
  const years = [];
  for (let y = 2024; y <= currentYear + 1; y++) {
    years.push(y.toString());
  }

  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [date, setDate] = useState(now.toISOString().split('T')[0]);
  const [deliveryCount, setDeliveryCount] = useState(""); 
  const [unitPrice, setUnitPrice] = useState("50,000"); 

  useEffect(() => {
    if (!db) return;
    const recordsRef = ref(db, 'inventory');
    const unsubscribe = onValue(recordsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, value]) => ({ id, ...value }));
        setRecords(list.sort((a, b) => new Date(b.date) - new Date(a.date)));
      }
    });
    return () => unsubscribe();
  }, []);

  // 금액 계산 로직
  const thisMonthAmount = records
    .filter(r => {
      const rDate = new Date(r.date);
      return rDate.getFullYear() === currentYear && (rDate.getMonth() + 1) === currentMonth;
    })
    .reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0);

  const totalCumulativeAmount = records.reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0);
  const filteredRecords = records.filter(r => new Date(r.date).getFullYear().toString() === selectedYear);

  const handleSave = async () => {
    const price = parseInt(unitPrice.replace(/,/g, "")) || 0;
    const count = parseInt(deliveryCount) || 0;
    const recordsRef = ref(db, 'inventory');
    await push(recordsRef, {
      date,
      deliveryCount: count,
      unitPrice: price,
      totalPrice: count * price,
      timestamp: Date.now(),
    });
    setShowModal(false);
    setDeliveryCount("");
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', color: '#000' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '900', textAlign: 'center', marginBottom: '5px', marginTop: '20px' }}>옷짓는 고양이</h1>
      <div style={{ textAlign: 'right', fontSize: '14px', color: '#888', marginBottom: '20px' }}>{todayString}</div>
      
      {/* 대시보드: 배경 진하게 + 중앙 정렬 */}
      <div style={{ 
        backgroundColor: '#e2e4e7', 
        border: '2px solid #000', 
        borderRadius: '24px', 
        padding: '40px 20px', 
        marginBottom: '35px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '24px', color: '#2563eb', fontWeight: 'bold', marginBottom: '10px' }}>
          {currentMonth}월 {thisMonthAmount.toLocaleString()}원
        </div>
        <div style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-1.5px' }}>
          {totalCumulativeAmount.toLocaleString()}원
        </div>
      </div>

      {/* 연도 선택: 자동으로 생성된 years 배열 사용 */}
      <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', position: 'relative', width: 'fit-content' }}>
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(e.target.value)}
          style={{ border: 'none', fontSize: '20px', fontWeight: 'bold', appearance: 'none', paddingRight: '25px', background: 'transparent', outline: 'none', cursor: 'pointer' }}
        >
          {years.map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
        <ChevronDown size={20} style={{ position: 'absolute', right: 0, pointerEvents: 'none' }} />
      </div>

      {/* 리스트: 날짜 + 납품 개수 포함 */}
      <div style={{ borderTop: '2px solid #000' }}>
        {filteredRecords.map(rec => (
          <div key={rec.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderBottom: '1px solid #eee' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <span style={{ color: '#888', fontSize: '14px' }}>{rec.date}</span>
              <span style={{ fontWeight: '600' }}>납품 {rec.deliveryCount}개</span>
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
              {Number(rec.totalPrice).toLocaleString()}원
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setShowModal(true)} style={{ position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Plus size={35} />
      </button>

      {/* 입력 모달 */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>새 기록 추가</h2>
              <X onClick={() => setShowModal(false)} style={{ cursor: 'pointer' }} />
            </div>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '10px', border: '1px solid #ddd' }} />
            <input type="number" value={deliveryCount} onChange={(e) => setDeliveryCount(e.target.value)} placeholder="납품 개수" style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '10px', border: '1px solid #ddd' }} />
            <button onClick={handleSave} style={{ width: '100%', padding: '15px', backgroundColor: '#000', color: '#fff', borderRadius: '15px', fontWeight: 'bold', border: 'none' }}>저장하기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
