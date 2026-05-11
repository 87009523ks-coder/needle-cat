import React, { useState, useEffect } from 'react';
import { db } from './firebase'; 
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
        // 날짜 기준 내림차순 정렬 (최신순)
        setRecords(list.sort((a, b) => b.date.localeCompare(a.date)));
      } else {
        setRecords([]); // 데이터가 없을 때 빈 배열 처리
      }
    });
  }, []);

  // 연도별 합계 계산 및 필터링 데이터 준비
  const filteredRecords = records.filter(r => r.date && r.date.includes(selectedYear));

  useEffect(() => {
    const totals = filteredRecords.reduce((acc, cur) => ({
      totalMaterials: acc.totalMaterials + (Number(cur.materials) || 0),
      totalDeliveries: acc.totalDeliveries + (Number(cur.deliveries) || 0),
      totalAmount: acc.totalAmount + (Number(cur.amount) || 0)
    }), { totalMaterials: 0, totalDeliveries: 0, totalAmount: 0 });
    
    setSummary(totals);
  }, [records, selectedYear]);

  // 삭제 기능
  const handleDelete = (id) => {
    if (window.confirm("정말 이 기록을 삭제하시겠습니까?")) {
      remove(ref(db, `records/${id}`))
        .then(() => alert("삭제되었습니다."))
        .catch((err) => alert("오류 발생: " + err.message));
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Human Myeongjo, serif' }}>
      <h1 style={{ textAlign: 'center', fontSize: '22px' }}>옷짓는 고양이</h1>
      
      {/* 5월 납품액 표시 (기존 스타일) */}
      <div style={{ border: '2px solid black', borderRadius: '20px', padding: '20px', textAlign: 'center', margin: '20px 0' }}>
        <p style={{ fontSize: '14px', color: '#666' }}>5월 납품액</p>
        <h2 style={{ fontSize: '28px' }}>{summary.totalAmount.toLocaleString()}원</h2>
      </div>

      {/* 연도 선택 및 합계 요약 */}
      <div style={{ marginBottom: '10px' }}>
        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ fontSize: '18px', fontWeight: 'bold', border: 'none' }}>
          <option value="2026">2026년</option>
          <option value="2025">2025년</option>
        </select>
        
        <div style={{ display: 'flex', justifyContent: 'space-around', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '10px', marginTop: '10px', fontSize: '13px' }}>
          <span>재료 합계: <strong>{summary.totalMaterials}개</strong></span>
          <span>납품 합계: <strong>{summary.totalDeliveries}개</strong></span>
          <span>금액 합계: <strong>{summary.totalAmount.toLocaleString()}원</strong></span>
        </div>
      </div>

      {/* 기록 목록 - 이 부분이 비어있었는지 확인해 보세요! */}
      <div style={{ marginTop: '20px' }}>
        {filteredRecords.length > 0 ? (
          filteredRecords.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #eee' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#999' }}>{item.date}</div>
                <div style={{ fontSize: '14px' }}>재료 {item.materials}개 | 납품 <strong>{item.deliveries}개</strong></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{Number(item.amount).toLocaleString()}원</div>
                <button onClick={() => handleDelete(item.id)} style={{ color: '#ff4d4f', border: 'none', background: 'none', fontSize: '12px', cursor: 'pointer' }}>삭제</button>
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', color: '#999', marginTop: '30px' }}>해당 연도의 기록이 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
