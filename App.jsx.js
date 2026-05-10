import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';

const App = () => {
  const [showModal, setShowModal] = useState(false);
  const [records, setRecords] = useState([]);
  const [amount, setAmount] = useState("");
  const [itemName, setItemName] = useState("");

  // 금액 포맷팅 (1,000 단위 콤마)
  const formatComma = (val) => {
    const num = val.replace(/[^0-9]/g, "");
    return num ? Number(num).toLocaleString() : "";
  };

  const handleAmountChange = (e) => {
    setAmount(formatComma(e.target.value));
  };

  // 저장 로직 (0 입력 허용 및 버그 수정)
  const handleSave = () => {
    // 금액이 비어있지 않다면 0을 포함하여 저장 가능하게 수정
    if (amount === "" && amount !== "0") {
      alert("금액을 입력해주세요.");
      return;
    }

    const newRecord = {
      id: Date.now(),
      name: itemName || "이름 없음",
      price: parseInt(amount.replace(/,/g, "")) || 0,
      date: new Date().toLocaleString(),
    };

    setRecords([newRecord, ...records]); // 최신순 정렬
    setAmount("");
    setItemName("");
    setShowModal(false);
  };

  const totalAmount = records.reduce((sum, rec) => sum + rec.price, 0);

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>옷짓는 고양이 프로젝트</h1>
      
      {/* 대시보드: 테두리 및 시인성 강화 */}
      <div style={{ 
        border: '2px solid #4A90E2', 
        borderRadius: '15px', 
        padding: '25px', 
        marginTop: '20px',
        backgroundColor: '#f8fbff',
        textAlign: 'center'
      }}>
        <div style={{ color: '#666', fontSize: '16px' }}>총 납품액</div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4A90E2', margin: '10px 0' }}>
          총 {totalAmount.toLocaleString()}원
        </div>
        <div style={{ fontSize: '14px', color: '#888' }}>
          월 납품 {records.length}세트 | 총 {records.length}세트
        </div>
      </div>

      {/* 최근 기록 리스트 (최신순) */}
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>최근 기록</h3>
        {records.map(rec => (
          <div key={rec.id} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            padding: '15px', 
            borderBottom: '1px solid #eee' 
          }}>
            <span>{rec.name}</span>
            <span style={{ fontWeight: 'bold' }}>{rec.price.toLocaleString()}원</span>
          </div>
        ))}
      </div>

      {/* 큰 + 버튼 */}
      <button 
        onClick={() => setShowModal(true)}
        style={{
          position: 'fixed', bottom: '30px', right: '30px',
          width: '60px', height: '60px', borderRadius: '50%',
          backgroundColor: '#4A90E2', color: 'white', border: 'none',
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)', cursor: 'pointer'
        }}
      >
        <Plus size={32} />
      </button>

      {/* 입력창 팝업: 더 크고 선명하게 */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white', padding: '30px', borderRadius: '20px',
            width: '80%', maxWidth: '400px', textAlign: 'center'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>정보 입력</h2>
              <X onClick={() => setShowModal(false)} style={{ cursor: 'pointer' }} />
            </div>
            
            <input 
              type="text" 
              placeholder="항목 명칭"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              style={{ width: '100%', padding: '15px', marginBottom: '15px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px' }}
            />
            
            <input 
              type="text" 
              placeholder="금액 입력"
              value={amount}
              onChange={handleAmountChange}
              style={{ width: '100%', padding: '15px', marginBottom: '20px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '20px', fontWeight: 'bold', textAlign: 'right' }}
            />

            <button 
              onClick={handleSave}
              style={{
                width: '100%', padding: '15px', borderRadius: '10px',
                backgroundColor: '#4A90E2', color: 'white', border: 'none',
                fontSize: '18px', fontWeight: 'bold', cursor: 'pointer'
              }}
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