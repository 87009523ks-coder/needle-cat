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

  const years = [];
  for (let y = 2024; y <= currentYear + 1; y++) {
    years.push(y.toString());
  }

  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [date, setDate] = useState(now.toISOString().split('T')[0]);
  const [deliveryCount, setDeliveryCount] = useState(""); 
  const [materialCount, setMaterialCount] = useState(""); 
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

  const parseNum = (val) => parseInt(String(val).replace(/,/g, "")) || 0;
  
  const thisMonthAmount = records
    .filter(r => {
      const rDate = new Date(r.date);
      return rDate.getFullYear() === currentYear && (rDate.getMonth() + 1) === currentMonth;
    })
    .reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0);

  const totalCumulativeAmount = records.reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0);
  const filteredRecords = records.filter(r => new Date(r.date).getFullYear().toString() === selectedYear);

  const currentTotal = (parseNum(deliveryCount) * parseNum(unitPrice)).toLocaleString();

  const handleSave = async () => {
    const price = parseNum(unitPrice);
    const dCount = parseNum(deliveryCount);
    const mCount = parseNum(materialCount);
    
    const recordsRef = ref(db, 'inventory');
    await push(recordsRef, {
      date,
      deliveryCount: dCount,
      materialCount: mCount,
      unitPrice: price,
      totalPrice: dCount * price,
      timestamp: Date.now(),
    });
    
    setShowModal(false);
    setDeliveryCount("");
    setMaterialCount("");
    setUnitPrice("50,000");
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', color: '#000' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '900', textAlign: 'center', marginBottom: '5px', marginTop: '20px' }}>옷짓는 고양이</h1>
      <div style={{ textAlign: 'right', fontSize: '14px', color: '#888', marginBottom: '20px' }}>{todayString}</div>
      
      <div style={{ backgroundColor: '#e2e4e7', border: '2px solid #000', borderRadius: '24px', padding: '40px 20px', marginBottom: '35px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', color: '#2563eb', fontWeight: 'bold', marginBottom: '10px' }}>
          {currentMonth}월 {thisMonthAmount.toLocaleString()}원
        </div>
        <div style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-1.5px' }}>
          {totalCumulativeAmount.toLocaleString()}원
        </div>
      </div>

      <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', position: 'relative', width: 'fit-content' }}>
        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ border: 'none', fontSize: '20px', fontWeight: 'bold', appearance: 'none', paddingRight: '25px', background: 'transparent', outline: 'none', cursor: 'pointer' }}>
          {years.map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
        <ChevronDown size={20} style={{ position: 'absolute', right: 0, pointerEvents: 'none' }} />
      </div>

      {/* 리스트 내역 정렬: [날짜] [재료] [납품] [금액] */}
      <div style={{ borderTop: '2px solid #000' }}>
        {filteredRecords.map(rec => (
          <div key={rec.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderBottom: '1px solid #eee' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ color: '#888', fontSize: '13px', width: '85px' }}>{rec.date}</span>
              <span style={{ fontSize: '14px', width: '65px' }}>재료 {rec.materialCount || 0}개</span>
              {/* 정렬을 위해 width 고정 */}
              <span style={{ fontWeight: '600', fontSize: '14px', width: '65px' }}>
                납품 <span style={{ display: 'inline-block', width: '20px', textAlign: 'right' }}>{rec.deliveryCount || 0}</span>개
              </span>
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '16px', textAlign: 'right' }}>{Number(rec.totalPrice).toLocaleString()}원</div>
          </div>
        ))}
      </div>

      <button onClick={() => setShowModal(true)} style={{ position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
        <Plus size={35} />
      </button>

      {/* 모바일 최적화 입력 모달 */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '24px', width: '100%', maxWidth: '400px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>새 기록 추가</h2>
              <X onClick={() => setShowModal(false)} style={{ cursor: 'pointer' }} size={24} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>날짜</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', boxSizing: 'border-box' }} />
            </div>

            {/* 가로 배치 섹션: 겹침 방지를 위해 flex-basis 사용 */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>납품(세트)</label>
                <input type="number" value={deliveryCount} onChange={(e) => setDeliveryCount(e.target.value)} placeholder="0" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>재료(세트)</label>
                <input type="number" value={materialCount} onChange={(e) => setMaterialCount(e.target.value)} placeholder="0" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>단가(원)</label>
              <input type="text" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', textAlign: 'right', boxSizing: 'border-box' }} />
            </div>

            <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '12px', textAlign: 'right', marginBottom: '20px' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>합계: </span>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{currentTotal}원</span>
            </div>

            <button onClick={handleSave} style={{ width: '100%', padding: '15px', backgroundColor: '#000', color: '#fff', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>저장하기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
