import React, { useState, useEffect } from 'react';
import { db } from './firebase'; 
import { ref, onValue, remove, push } from 'firebase/database';
import { Plus, X, ChevronDown, Trash2 } from 'lucide-react';

const App = () => {
  const [records, setRecords] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2026');
  
  // 입력 필드 상태
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryCount, setDeliveryCount] = useState("");
  const [materialCount, setMaterialCount] = useState("");
  const [unitPrice, setUnitPrice] = useState("50,000");

  // 1. 데이터 불러오기 (경로: 'inventory')
  useEffect(() => {
    if (!db) return;
    const recordsRef = ref(db, 'inventory'); // 이전 코드에서 'records'였다면 여기를 'records'로 바꿔보세요.
    const unsubscribe = onValue(recordsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, value]) => ({ id, ...value }));
        // 최신순 정렬
        setRecords(list.sort((a, b) => b.date.localeCompare(a.date)));
      } else {
        setRecords([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. 연도별 필터링 및 합계 계산
  const filteredRecords = records.filter(r => r.date && r.date.includes(selectedYear));
  
  const summary = filteredRecords.reduce((acc, cur) => ({
    materials: acc.materials + (Number(cur.materialCount) || 0),
    deliveries: acc.deliveries + (Number(cur.deliveryCount) || 0),
    amount: acc.amount + (Number(cur.totalPrice) || 0)
  }), { materials: 0, deliveries: 0, amount: 0 });

  // 3. 삭제 기능 (확인 창 포함)
  const handleDelete = (id) => {
    if (window.confirm("정말 이 기록을 삭제할까요?")) {
      remove(ref(db, `inventory/${id}`));
    }
  };

  // 4. 저장 기능
  const handleSave = async () => {
    const price = parseInt(unitPrice.replace(/,/g, "")) || 0;
    const dCount = parseInt(deliveryCount) || 0;
    const mCount = parseInt(materialCount) || 0;

    await push(ref(db, 'inventory'), {
      date,
      deliveryCount: dCount,
      materialCount: mCount,
      unitPrice: price,
      totalPrice: dCount * price,
    });
    setShowModal(false);
    setDeliveryCount(""); setMaterialCount("");
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>옷짓는 고양이</h1>
      
      {/* 연도별 요약 카드 */}
      <div style={{ backgroundColor: '#e2e4e7', border: '2px solid #000', borderRadius: '24px', padding: '30px 20px', marginBottom: '25px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#2563eb', marginBottom: '8px' }}>{selectedYear}년 누적 금액</div>
        <div style={{ fontSize: '36px', fontWeight: '900' }}>{summary.amount.toLocaleString()}원</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '15px', fontSize: '14px', color: '#444' }}>
          <span>재료 합계: <strong>{summary.materials}개</strong></span>
          <span>납품 합계: <strong>{summary.deliveries}개</strong></span>
        </div>
      </div>

      {/* 연도 선택 드롭다운 */}
      <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ border: 'none', fontSize: '18px', fontWeight: 'bold', background: 'transparent' }}>
          <option value="2026">2026년</option>
          <option value="2025">2025년</option>
        </select>
      </div>

      {/* 목록 리스트 */}
      <div style={{ borderTop: '2px solid #000' }}>
        {filteredRecords.length > 0 ? filteredRecords.map(rec => (
          <div key={rec.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #eee' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '14px' }}>
              <span style={{ color: '#888', width: '85px' }}>{rec.date}</span>
              <span style={{ width: '60px' }}>재료 {rec.materialCount}개</span>
              <span style={{ fontWeight: 'bold', width: '60px' }}>납품 {rec.deliveryCount}개</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 'bold' }}>{(rec.totalPrice || 0).toLocaleString()}원</span>
              <Trash2 size={18} color="#ff4d4f" onClick={() => handleDelete(rec.id)} style={{ cursor: 'pointer' }} />
            </div>
          </div>
        )) : <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>기록이 없습니다.</div>}
      </div>

      {/* 추가 버튼 */}
      <button onClick={() => setShowModal(true)} style={{ position: 'fixed', bottom: '30px', right: '30px', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#000', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Plus size={35} />
      </button>

      {/* 입력 모달 (생략 - 위 handleSave 로직과 연결) */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '24px', width: '90%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', margin: 0 }}>새 기록 추가</h2>
              <X onClick={() => setShowModal(false)} style={{ cursor: 'pointer' }} />
            </div>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #ddd' }} />
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input type="number" placeholder="납품(개)" value={deliveryCount} onChange={(e) => setDeliveryCount(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }} />
              <input type="number" placeholder="재료(개)" value={materialCount} onChange={(e) => setMaterialCount(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }} />
            </div>
            <input type="text" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '10px', border: '1px solid #ddd', textAlign: 'right' }} />
            <button onClick={handleSave} style={{ width: '100%', padding: '15px', backgroundColor: '#000', color: '#fff', borderRadius: '12px', fontWeight: 'bold', border: 'none' }}>저장하기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
