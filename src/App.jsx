import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import { db } from './firebase'; 
import { ref, push, onValue } from 'firebase/database';

const App = () => {
  const [showModal, setShowModal] = useState(false);
  const [records, setRecords] = useState([]);
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 5월
  const todayString = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

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

  // 1. 당월(5월) 납품액 계산
  const thisMonthAmount = records
    .filter(r => {
      const rDate = new Date(r.date);
      return rDate.getFullYear() === currentYear && (rDate.getMonth() + 1) === currentMonth;
    })
    .reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0);

  // 2. 전체 누적 총액 계산 (2,800,000원이 나와야 하는 부분)
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
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '900', textAlign: 'center', marginBottom: '5px' }}>옷짓는 고양이</h1>
      <div style={{ textAlign: 'right', fontSize: '14px', color: '#888', marginBottom: '20px' }}>{todayString}</div>
      
      {/* 대시보드 구역 */}
      <div style={{ 
        backgroundColor: '#e2e4e7', // 더 진해진 바탕색
        border: '2px solid #000', 
        borderRadius: '24px', 
        padding: '40px 20px', 
        marginBottom: '35px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center', // 중앙 정렬
        justifyContent: 'center'
      }}>
        {/* 상단: 5월 실적 (크기 150%, 파란색) */}
        <div style={{ fontSize: '24px', color: '#2563eb', fontWeight: 'bold', marginBottom: '10px' }}>
          {currentMonth}월 {thisMonthAmount.toLocaleString()}원
        </div>
        {/* 중앙: 누적 총 금액 (가장 크게 강조) */}
        <div style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-1.5px' }}>
          {totalCumulativeAmount.toLocaleString()}원
        </div>
      </div>

      {/* 연도 선택 및 리스트 (생략 가능하나 통합을 위해 유지) */}
      <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', position: 'relative', width: 'fit-content' }}>
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(e.target.value)}
          style={{ border: 'none', fontSize: '20px', fontWeight: 'bold', appearance: 'none', paddingRight: '25px', background: 'transparent' }}
        >
          <option value="2026">2026년</option>
          <option value="2025">2025년</option>
        </select>
        <ChevronDown size={20} style={{ position: 'absolute', right: 0, pointerEvents: 'none' }} />
      </div>

      <div style={{ borderTop: '2px solid #000' }}>
        {filteredRecords.map(rec => (
          <div key={rec.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #eee' }}>
            <span style={{ color: '#888' }}>{rec.date}</span>
            <span style={{ fontWeight: 'bold' }}>{rec.totalPrice.toLocaleString()}원</span>
          </div>
        ))}
      </div>

      {/* 추가 버튼 및 모달 로직... */}
      <button onClick={() => setShowModal(true)} style={{ position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#000', color: '#fff', border: 'none' }}>
        <Plus size={30} />
      </button>
    </div>
  );
};

export default App;
