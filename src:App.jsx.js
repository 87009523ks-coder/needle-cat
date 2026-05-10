import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, query, orderByChild } from 'firebase/database';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function App() {
  const [history, setHistory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("2026-01");
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sets: 0,
    material: '',
    unitPrice: 50000,
    totalPrice: 0
  });

  useEffect(() => {
    const historyRef = ref(db, 'history');
    const historyQuery = query(historyRef, orderByChild('date'));
    const unsubscribe = onValue(historyQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setHistory(list.reverse());
      } else { setHistory([]); }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setFormData(prev => ({ ...prev, totalPrice: prev.sets * prev.unitPrice }));
  }, [formData.sets, formData.unitPrice]);

  const handleSave = async () => {
    if (formData.sets <= 0) return alert("납품 세트를 입력하세요.");
    try {
      await push(ref(db, 'history'), formData);
      alert('저장되었습니다.');
      setIsModalOpen(false);
      setFormData({ date: new Date().toISOString().split('T')[0], sets: 0, material: '', unitPrice: 50000, totalPrice: 0 });
    } catch (e) { alert('저장 실패'); }
  };

  const monthlyData = history.filter(item => item.date.startsWith(selectedMonth));
  const monthlyTotal = monthlyData.reduce((acc, cur) => acc + (Number(cur.totalPrice) || 0), 0);
  const monthlySets = monthlyData.reduce((acc, cur) => acc + (Number(cur.sets) || 0), 0);
  const allTotal = history.reduce((acc, cur) => acc + (Number(cur.totalPrice) || 0), 0);
  const allSets = history.reduce((acc, cur) => acc + (Number(cur.sets) || 0), 0);

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', fontFamily: '"Nanum Myeongjo", serif', padding: '20px', color: '#444' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', margin: 0 }}>옷짓는 고양이</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#888' }}>{new Date().toLocaleDateString()}</span>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ border: 'none', background: 'none', fontWeight: 'bold', fontSize: '16px' }}>
            <option value="2026-01">2026년 1월</option>
            <option value="2026-02">2026년 2월</option>
            <option value="2026-03">2026년 3월</option>
            <option value="2026-04">2026년 4월</option>
            <option value="2026-05">2026년 5월</option>
          </select>
        </div>
      </header>

      <section style={{ backgroundColor: 'white', borderRadius: '15px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span>{selectedMonth.split('-')[1]}월 납품액</span>
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{monthlyTotal.toLocaleString()}원</span>
        </div>
        <div style={{ fontSize: '13px', color: '#888', marginBottom: '15px' }}>총 {allTotal.toLocaleString()}원</div>
        <div style={{ fontSize: '12px' }}>월 납품 {monthlySets}세트 | 총 {allSets.toLocaleString()}세트</div>
      </section>

      <section>
        {history.map(item => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee', fontSize: '14px' }}>
            <span>{item.date}</span>
            <span>{item.sets}세트</span>
            <span style={{ fontWeight: 'bold' }}>{item.totalPrice.toLocaleString()}원</span>
          </div>
        ))}
      </section>

      <button onClick={() => setIsModalOpen(true)} style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', width: '60px', height: '60px', backgroundColor: '#8b7e74', color: 'white', borderRadius: '50%', border: 'none', fontSize: '30px', cursor: 'pointer' }}>+</button>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'white', width: '90%', maxWidth: '350px', borderRadius: '15px', padding: '20px' }}>
            <h3 style={{ marginTop: 0 }}>납품 기록</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              <input type="number" placeholder="납품(세트)" onChange={e => setFormData({...formData, sets: Number(e.target.value)})} />
              <input type="text" placeholder="재료" onChange={e => setFormData({...formData, material: e.target.value})} />
              <input type="number" value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: Number(e.target.value)})} />
              <input type="number" value={formData.totalPrice} readOnly style={{ backgroundColor: '#eee' }} />
              <button onClick={handleSave} style={{ padding: '12px', backgroundColor: '#8b7e74', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>저장하기</button>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#999' }}>취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}