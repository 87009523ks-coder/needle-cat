import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronDown, Trash2 } from 'lucide-react';
import { db } from './firebase'; 
import { ref, push, onValue, remove } from 'firebase/database';

const App = () => {
  const [showModal, setShowModal] = useState(false);
  const [records, setRecords] = useState([]);
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const todayString = now.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  // 연도 리스트 생성 (2024~내년)
  const years = [];
  for (let y = 2024; y <= currentYear + 1; y++) { years.push(y.toString()); }

  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  
  // 입력 필드 상태
  const [date, setDate] = useState(now.toISOString().split('T')[0]);
  const [deliveryCount, setDeliveryCount] = useState(""); 
  const [materialCount, setMaterialCount] = useState(""); 
  const [unitPrice, setUnitPrice] = useState("50,000"); 

  // 1. 데이터 불러오기 (경로: 'inventory')
  useEffect(() => {
    if (!db) return;
    const recordsRef = ref(db, 'inventory');
    const unsubscribe = onValue(recordsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, value]) => ({ id, ...value }));
        setRecords(list.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } else { setRecords([]); }
    });
    return () => unsubscribe();
  }, []);

  const parseNum = (val) => parseInt(String(val).replace(/,/g, "")) || 0;

  // [대시보드용] 당월 합계
  const thisMonthAmount = records
    .filter(r => {
      const rDate = new Date(r.date);
      return rDate.getFullYear() === currentYear && (rDate.getMonth() + 1) === currentMonth;
    })
    .reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0);

  // [대시보드용] 누적 총 금액 (전체 기간)
  const totalCumulativeAmount = records.reduce((sum, r) => sum + (Number(r.totalPrice) || 0), 0);

  // [해당 연도 요약용] 선택된 연도의 데이터만 필터링
  const filteredRecords = records.filter(r => r.date && r.date.includes(selectedYear));
  
  const annualSummary = filteredRecords.reduce((acc, cur) => ({
    materials: acc.materials + (Number(cur.materialCount) || 0),
    deliveries: acc.deliveries + (Number(cur.deliveryCount) || 0),
    amount: acc.amount + (Number(cur.totalPrice) || 0)
  }), { materials: 0, deliveries: 0, amount: 0 });

  // 실시간 합계 계산 (모달창 내부용)
  const currentTotal = (parseNum(deliveryCount) * parseNum(unitPrice)).toLocaleString();

  // 삭제 기능
  const handleDelete = (id) => {
    if (window.confirm("이 기록을 삭제하시겠습니까?")) {
      remove(ref(db, `inventory/${id}`));
    }
  };

  const handleSave = async () => {
    const price = parseNum(unitPrice);
    const dCount = parseNum(deliveryCount);
    const mCount = parseNum(materialCount);
    await push(ref(db, 'inventory'), {
      date,
      deliveryCount: dCount,
      materialCount: mCount,
      unitPrice: price,
      totalPrice: dCount * price,
      timestamp: Date.now(),
    });
    setShowModal(false);
    setDeliveryCount(""); setMaterialCount(""); setUnitPrice("50,000");
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', color: '#000' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '900', textAlign: 'center', marginBottom: '5px', marginTop: '20px' }}>옷짓는 고양이</h1>
      <div style={{ textAlign: 'right', fontSize: '16px', color: '#888', marginBottom: '25px' }}>{todayString}</div>
      
      {/* 대시보드: 당월 실적 & 누적 총액 */}
      <div style={{ backgroundColor: '#eceef0', border: '2px solid #000', borderRadius: '24px', padding: '35px 25px', marginBottom: '35px', textAlign: 'center' }}>
        <div style={{ fontSize: '22px', color: '#2563eb', fontWeight: 'bold', marginBottom: '10px' }}>
          {currentMonth}월 {thisMonthAmount.toLocaleString()}원
        </div>
        <div style={{ fontSize: '46px', fontWeight: '900', letterSpacing: '-1.5px' }}>
          {totalCumulativeAmount.toLocaleString()}원
        </div>
      </div>

      {/* 연도 선택 */}
      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', position: 'relative', width: 'fit-content' }}>
        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ border: 'none', fontSize: '20px', fontWeight: 'bold', appearance: 'none', paddingRight: '25px', background: 'transparent', outline: 'none' }}>
          {years.map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
        <ChevronDown size={20} style={{ position: 'absolute', right: 0, pointerEvents: 'none' }} />
      </div>

      {/* 해당 연도 요약 섹션 (연도와 목록 사이) */}
      <div style={{ display: 'flex', justifyContent: 'space-around', backgroundColor: '#f1f3f5', padding: '15px', borderRadius: '15px', marginBottom: '20px', fontSize: '13px', color: '#444' }}>
        <span>재료 합계: <strong>{annualSummary.materials}개</strong></span>
        <span>납품 합계: <strong>{annualSummary.deliveries}개</strong></span>
        <span>금액 합계: <strong>{annualSummary.amount.toLocaleString()}원</strong></span>
      </div>

      {/* 내역 리스트 */}
      <div style={{ borderTop: '2px solid #000' }}>
        {filteredRecords.map(rec => (
          <div key={rec.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0', borderBottom: '1px solid #eee' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ color: '#888', fontSize: '13px', width: '85px' }}>{rec.date}</span>
              <span style={{ fontSize: '14px', width: '60px' }}>재료 {rec.materialCount}개</span>
              <span style={{ fontWeight: '600', fontSize: '14px', width: '65px' }}>
                납품 <span style={{ display: 'inline-block', width: '20px', textAlign: 'right' }}>{rec.deliveryCount}</span>개
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{Number(rec.totalPrice).toLocaleString()}원</span>
              <Trash2 size={18} color="#ff4d4f" style={{ cursor: 'pointer' }} onClick={() => handleDelete(rec.id)} />
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => setShowModal(true)} style={{ position: 'fixed', bottom: '30px', right: '30px', width: '65px', height: '65px', borderRadius: '50%', backgroundColor: '#000', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
        <Plus size={35} />
      </button>

      {/* 입력 모달 */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '15px' }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '24px', width: '100%', maxWidth: '400px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>새 기록 추가</h2>
              <X onClick={() => setShowModal(false)} style={{ cursor: 'pointer' }} size={24} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '13px', color: '#888' }}>날짜</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '13px', color: '#888' }}>납품(개)</label>
                <input type="number" value={deliveryCount} onChange={(e) => setDeliveryCount(e.target.value)} placeholder="0" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '13px', color: '#888' }}>재료(개)</label>
                <input type="number" value={materialCount} onChange={(e) => setMaterialCount(e.target.value)} placeholder="0" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', color: '#888' }}>단가</label>
              <input type="text" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', textAlign: 'right', backgroundColor: '#f8f9fa', color: '#888', boxSizing: 'border-box' }} />
            </div>

            <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '12px', textAlign: 'right', marginBottom: '20px' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>금액(합계): </span>
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
