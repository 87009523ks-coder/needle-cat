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
    const recordsRef = ref(db, 'inventory');
    onValue(recordsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, value]) => ({ id, ...value }));
        // 날짜순, 최신순 정렬
        setRecords(list.sort((a, b) => new Date(b.date) - new Date(a.date) || b.timestamp - a.timestamp));
      } else {
        setRecords([]);
      }
    });
  }, []);

  // 천 단위 콤마 포맷팅 함수
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

  const handleSave = () => {
    const totalPrice = calculateTotal();
    const recordsRef = ref(db, 'inventory');
    
    push(recordsRef, {
      date,
      deliveryCount: parseInt(deliveryCount) || 0,
      materialCount: parseInt(materialCount) || 0,
      unitPrice: parseInt(unitPrice.replace(/,/g, "")) || 0,
      totalPrice: totalPrice,
      timestamp: Date.now(),
    }).then(() => {
      alert("저장되었습니다."); // 저장 확인 팝업
      // 입력창 초기화
      setDeliveryCount("");
      setMaterialCount("");
      setUnitPrice("50,000"); // 저장 후 다시 기본값으로
      setShowModal(false);
    }).catch((error) => {
      alert("저장 실패: " + error.message);
    });
  };

  const monthlyTotal = records.reduce((sum, rec) => sum + (Number(rec.totalPrice) || 0), 0);

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#fff' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '5px', letterSpacing: '-1.5px' }}>옷짓는 고양이</h1>
      <p style={{ color: '#888', fontSize: '14px', marginBottom: '25px' }}>{date}</p>
      
      {/* 대시보드 */}
      <div style={{ border: '3px solid #000', borderRadius: '24px', padding: '35px 20px', textAlign: 'center', marginBottom: '35px' }}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: '#555' }}>05월 납품액</div>
        <div style={{ fontSize: '42px', fontWeight: '900', margin: '15px 0' }}>
          총 {monthlyTotal.toLocaleString()}원
        </div>
        <div style={{ fontSize: '15px', color: '#888' }}>납품 건수: {records.length}건</div>
      </div>

      {/* 리스트 */}
      <div style={{ marginBottom: '100px' }}>
        <h3 style={{ borderBottom: '2px solid #000', paddingBottom: '10px', fontSize: '18px' }}>최근 납품 내역</h3>
        {records.map(rec => (
          <div key={rec.id} style={{ padding: '20px 0', borderBottom: '1px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '14px', color: '#888' }}>{rec.date}</span>
              <span style={{ fontWeight: 'bold', color: '#000' }}>{rec.totalPrice.toLocaleString()}원</span>
            </div>
            <div style={{ fontSize: '16px' }}>
              납품 {rec.deliveryCount}세트 / 재료 {rec.materialCount}세트 (단가: {rec.unitPrice.toLocaleString()}원)
            </div>
          </div>
        ))}
      </div>

      {/* 플로팅 버튼 */}
      <button onClick={() => setShowModal(true)} style={{ position: 'fixed', bottom: '40px', right: '30px', width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Plus size={35} />
      </button>

      {/* 입력 모달 */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '25px', width: '90%', maxWidth: '420px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold' }}>새 기록 추가</h2>
              <X onClick={() => setShowModal(false)} style={{ cursor: 'pointer' }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', color: '#888' }}>날짜</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', marginTop: '5px' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#888' }}>납품(세트)</label>
                <input type="number" placeholder="0" value={deliveryCount} onChange={(e) => setDeliveryCount(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#888' }}>재료(세트)</label>
                <input type="number" placeholder="0" value={materialCount} onChange={(e) => setMaterialCount(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', color: '#888' }}>단가(원)</label>
              <input type="text" value={unitPrice} onChange={handleUnitPriceChange} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', marginTop: '5px', textAlign: 'right', boxSizing: 'border-box' }} />
            </div>

            <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '12px', marginBottom: '25px', textAlign: 'right' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>합계: </span>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{calculateTotal().toLocaleString()}원</span>
            </div>

            <button onClick={handleSave} style={{ width: '100%', padding: '18px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '15px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>저장하기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
