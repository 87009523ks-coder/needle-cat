import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { db } from './firebase'; 
import { ref, push, onValue, serverTimestamp } from 'firebase/database';

const App = () => {
  const [showModal, setShowModal] = useState(false);
  const [records, setRecords] = useState([]);
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryCount, setDeliveryCount] = useState(""); 
  const [materialCount, setMaterialCount] = useState(""); 
  const [unitPrice, setUnitPrice] = useState("50,000"); 

  useEffect(() => {
    if (!db) return;
    const recordsRef = ref(db, 'inventory');
    // 실시간 데이터 수신
    const unsubscribe = onValue(recordsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, value]) => ({ id, ...value }));
        setRecords(list.sort((a, b) => new Date(b.date) - new Date(a.date) || b.timestamp - a.timestamp));
      } else {
        setRecords([]);
      }
    }, (error) => {
      console.error("Firebase 수신 에러:", error);
    });
    return () => unsubscribe();
  }, []);

  const calculateTotal = () => {
    const delivery = parseInt(deliveryCount) || 0;
    const price = parseInt(unitPrice.replace(/,/g, "")) || 0;
    return delivery * price;
  };

  const handleSave = async () => {
    if (!db) {
      alert("데이터베이스 설정 파일(firebase.js)을 확인해주세요.");
      return;
    }

    try {
      const totalPrice = calculateTotal();
      const recordsRef = ref(db, 'inventory');
      
      // 데이터 전송 객체
      const newData = {
        date,
        deliveryCount: parseInt(deliveryCount) || 0,
        materialCount: parseInt(materialCount) || 0,
        unitPrice: parseInt(unitPrice.replace(/,/g, "")) || 0,
        totalPrice: totalPrice,
        timestamp: Date.now()
      };

      await push(recordsRef, newData);

      alert("저장되었습니다."); 
      setDeliveryCount("");
      setMaterialCount("");
      setUnitPrice("50,000");
      setShowModal(false);
    } catch (error) {
      console.error("상세 에러 로그:", error);
      alert("저장 실패: " + error.message);
    }
  };

  const monthlyTotal = records.reduce((sum, rec) => sum + (Number(rec.totalPrice) || 0), 0);

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '25px' }}>옷짓는 고양이</h1>
      
      <div style={{ border: '3px solid #000', borderRadius: '24px', padding: '35px 20px', textAlign: 'center', marginBottom: '35px' }}>
        <div style={{ fontSize: '18px', color: '#555' }}>05월 납품액</div>
        <div style={{ fontSize: '42px', fontWeight: '900', margin: '15px 0' }}>
          총 {monthlyTotal.toLocaleString()}원
        </div>
      </div>

      <div style={{ marginBottom: '100px' }}>
        <h3 style={{ borderBottom: '2px solid #000', paddingBottom: '10px' }}>최근 납품 내역</h3>
        {records.length === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#aaa' }}>기록이 없습니다.</div>
        ) : (
          records.map(rec => (
            <div key={rec.id} style={{ padding: '15px 0', borderBottom: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#888' }}>{rec.date}</span>
                <span style={{ fontWeight: 'bold' }}>{(rec.totalPrice || 0).toLocaleString()}원</span>
              </div>
              <div style={{ fontSize: '15px', marginTop: '5px' }}>
                납품 {rec.deliveryCount} / 재료 {rec.materialCount} (단가: {(rec.unitPrice || 0).toLocaleString()})
              </div>
            </div>
          ))
        )}
      </div>

      <button onClick={() => setShowModal(true)} style={{ position: 'fixed', bottom: '40px', right: '30px', width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Plus size={35} />
      </button>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '25px', width: '90%', maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>새 기록 추가</h2>
              <X onClick={() => setShowModal(false)} style={{ cursor: 'pointer' }} />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px' }}>날짜</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '10px' }} />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px' }}>납품(세트)</label>
                <input type="number" value={deliveryCount} onChange={(e) => setDeliveryCount(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '10px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px' }}>재료(세트)</label>
                <input type="number" value={materialCount} onChange={(e) => setMaterialCount(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '10px' }} />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px' }}>단가(원)</label>
              <input type="text" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value.replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ","))} style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '10px', textAlign: 'right' }} />
            </div>

            <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '12px', marginBottom: '20px', textAlign: 'right' }}>
              <span>합계: </span>
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
