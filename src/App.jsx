import React, { useState, useEffect } from 'react';
import { db } from './firebase'; // 업로드하신 firebase.js 설정 참조
import { ref, onValue, remove } from 'firebase/database';

const Dashboard = () => {
  const [records, setRecords] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [summary, setSummary] = useState({ totalMaterials: 0, totalDeliveries: 0, totalAmount: 0 });

  useEffect(() => {
    const recordsRef = ref(db, 'records');
    onValue(recordsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setRecords(list.reverse()); // 최신순 정렬
      }
    });
  }, []);

  // 연도 선택 시 요약 정보 계산
  useEffect(() => {
    const filtered = records.filter(r => r.date.startsWith(selectedYear));
    const totals = filtered.reduce((acc, cur) => ({
      totalMaterials: acc.totalMaterials + (Number(cur.materials) || 0),
      totalDeliveries: acc.totalDeliveries + (Number(cur.deliveries) || 0),
      totalAmount: acc.totalAmount + (Number(cur.amount) || 0)
    }), { totalMaterials: 0, totalDeliveries: 0, totalAmount: 0 });
    
    setSummary(totals);
  }, [records, selectedYear]);

  // 삭제 기능 (확인 팝업 포함)
  const handleDelete = (id) => {
    if (window.confirm("이 기록을 정말 삭제하시겠습니까?")) {
      remove(ref(db, `records/${id}`))
        .then(() => alert("삭제되었습니다."))
        .catch((error) => alert("삭제 실패: " + error.message));
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Human Myeongjo, serif' }}>
      <h1 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}>옷짓는 고양이</h1>
      
      {/* 월간 요약 (기존 디자인 유지) */}
      <div style={{ 
        border: '2px solid black', 
        borderRadius: '20px', 
        padding: '30px', 
        textAlign: 'center',
        margin: '20px 0' 
      }}>
        <p style={{ color: '#666' }}>5월 납품액</p>
        <h2 style={{ fontSize: '32px' }}>{summary.totalAmount.toLocaleString()}원</h2>
      </div>

      {/* 연도 선택 및 연도별 합계 요약 */}
      <div style={{ marginBottom: '20px' }}>
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(e.target.value)}
          style={{ fontSize: '18px', fontWeight: 'bold', border: 'none', background: 'none' }}
        >
          <option value="2026">2026년</option>
          <option value="2025">2025년</option>
        </select>

        {/* 요청하신 연도별 재료합, 납품합, 금액합 섹션 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '10px',
          marginTop: '10px',
          fontSize: '14px'
        }}>
          <div>재료 합계: <strong>{summary.totalMaterials}개</strong></div>
          <div>납품 합계: <strong>{summary.totalDeliveries}개</strong></div>
          <div>금액 합계: <strong>{summary.totalAmount.toLocaleString()}원</strong></div>
        </div>
      </div>

      <hr style={{ border: '0.5px solid #eee' }} />

      {/* 최근 기록 목록 및 삭제 버튼 */}
      <div>
        {records.filter(r => r.date.startsWith(selectedYear)).map((item) => (
          <div key={item.id} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '15px 0', 
            borderBottom: '1px solid #f0f0f0' 
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', color: '#999' }}>{item.date}</div>
              <div style={{ fontSize: '15px' }}>
                재료 {item.materials}개 | 납품 <strong>{item.deliveries}개</strong>
              </div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', marginRight: '15px' }}>
                {Number(item.amount).toLocaleString()}원
              </span>
              <button 
                onClick={() => handleDelete(item.id)}
                style={{ 
                  backgroundColor: '#ff4d4f', 
                  color: 'white', 
                  border: 'none', 
                  padding: '5px 10px', 
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
