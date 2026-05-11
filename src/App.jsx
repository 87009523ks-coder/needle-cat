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

  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [date, setDate] = useState(now.toISOString().split('T')[0]);
  const [deliveryCount, setDeliveryCount] = useState(""); 
  const [materialCount, setMaterialCount] = useState(""); 
  const [unitPrice, setUnitPrice] = useState("50,000"); 

  const years = [];
  for (let y = 2024; y <= currentYear + 5; y++) {
    years.push(y.toString());
  }

  useEffect(() => {
    if (!db) return;
    const recordsRef = ref(db, 'inventory');
    const unsubscribe = onValue(recordsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, value]) => ({ id, ...value }));
        setRecords(list.sort((a, b) => new Date(b.date) - new Date(a.date) || b.timestamp - a.timestamp));
      }
    });
    return () => unsubscribe();
  }, []);

  const calculateTotal = () => {
    const delivery = parseInt(deliveryCount) || 0;
    const price = parseInt(unitPrice.replace(/,/g, "")) || 0;
    return delivery * price;
  };

  // 1. 당월 합계 계산 로직 (에러 수정: 정확한 연도와 월 비교)
  const thisMonthTotal = records
    .filter(r => {
      const rDate = new Date(r.date);
      return rDate.getFullYear() === currentYear && (rDate.getMonth() + 1) === currentMonth;
    })
    .reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0);

  const filteredRecords = records.filter(r => new Date(r.date).getFullYear().toString() === selectedYear);

  const handleSave = async () => {
    try {
      const recordsRef = ref(db, 'inventory');
      await push(recordsRef, {
        date,
        deliveryCount: parseInt(deliveryCount) || 0,
        materialCount: parseInt(materialCount) || 0,
        unitPrice: parseInt(unitPrice.replace(/,/g, "")) || 0,
        totalPrice: calculateTotal(), // 합계 계산 저장
        timestamp: Date.now(),
      });
      alert("저장되었습니다.");
      setDeliveryCount(""); setMaterialCount(""); setUnitPrice("50,000"); setShowModal(false);
    } catch (e) {
      alert("에러: " + e.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', color: '#000' }}>
      
      <h1 style={{ fontSize: '32px', fontWeight: '900', textAlign: 'center', marginBottom: '5px', letterSpacing: '-1.5px' }}>옷짓는 고양이</h1>
      
      {/* 2. 오늘 날짜: 폰트 크기 120% 확대 (13px -> 16px 정도) */}
      <div style={{ textAlign: 'right', fontSize: '16px', color: '#888', marginBottom: '25px', fontWeight: '500' }}>{todayString}</div>
      
      {/* 3. 대시보드: 정렬 수정 */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        border: '2px solid #000', 
        borderRadius: '24px', 
        padding: '30px 25px', 
        marginBottom: '35px' 
      }}>
        {/* 상단 소제목을 왼쪽으로 이동하고 하단 금액의 첫 숫자와 맞춤 */}
        <div style={{ textAlign: 'left', maxWidth: 'fit-content', margin: '0 auto' }}>
          <div style={{ fontSize: '15px', color: '#666', marginBottom: '5px', paddingLeft: '2px' }}>
            {currentMonth}월 {thisMonthTotal.toLocaleString()}원
          </div>
          <div style={{ fontSize: '42px', fontWeight: '900', lineHeight: '1' }}>
            {thisMonthTotal.toLocaleString()}원
          </div>
        </div>
      </div>

      {/* 4. 연도 선택 탭: 화살표 중복 문제 해결 (appearance: none 추가) */}
      <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '2px' }}>
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(e.target.value)}
          style={{ 
            border: 'none', 
            fontSize: '20px', 
            fontWeight: 'bold', 
            background: 'none', 
            cursor: 'pointer', 
            outline: 'none',
            WebkitAppearance: 'none', // 브라우저 기본 화살표 숨기기
            MozAppearance: 'none',
            appearance: 'none'
          }}
        >
          {years.map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
        <ChevronDown size={20} strokeWidth={3} />
      </div>

      <div style={{ borderTop: '2px solid #000', marginBottom: '100px' }}>
        {filteredRecords.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#aaa' }}>기록이 없습니다.</div>
        ) : (
          filteredRecords.map(rec => (
            <div key={rec.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #eee', fontSize: '15px' }}>
              <div style={{ display: 'flex', gap: '15px' }}>
                <span style={{ color: '#888' }}>{rec.date.replace(/-/g, '. ')}</span>
                <span style={{ fontWeight: '500' }}>납품 {rec.deliveryCount}개</span>
              </div>
              <span style={{ fontWeight: 'bold' }}>{(rec.totalPrice || 0).toLocaleString()}원</span>
            </div>
          ))
        )}
      </div>

      <button onClick={() => setShowModal(true)} style={{ position: 'fixed', bottom: '40px', right: '30px', width: '65px', height: '65px', borderRadius: '50%', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
        <Plus size={35} />
      </button>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '25px', width: '90%', maxWidth: '420px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '22px' }}>기록 추가</h2>
              <X onClick={() => setShowModal(false)} style={{ cursor: 'pointer' }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', color: '#888' }}>날짜</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '16px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#888' }}>납품(세트)</label>
                <input type="number" value={deliveryCount} onChange={e => setDeliveryCount(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '16px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#888' }}>재료(세트)</label>
                <input type="number" value={materialCount} onChange={e => setMaterialCount(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '10px', fontSize: '16px', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', color: '#888' }}>단가(원)</label>
              <input type="text" value={unitPrice} onChange={e => setUnitPrice(e.target.value.replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ","))} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '10px', textAlign: 'right', fontSize: '18px', fontWeight: 'bold', boxSizing: 'border-box' }} />
            </div>

            <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '15px', marginBottom: '25px', textAlign: 'right' }}>
              <span style={{ fontSize: '14px' }}>합계 </span>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{calculateTotal().toLocaleString()}원</span>
            </div>

            <button onClick={handleSave} style={{ width: '100%', padding: '20px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '15px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>저장하기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
