import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // ★CSSファイルの読み込み

function App() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [workHours, setWorkHours] = useState('');
  const [content, setContent] = useState('');
  const [impressions, setImpressions] = useState('');

  const API_BASE_URL = 'http://localhost:8080/api/v1/reports';

  const fetchReports = async () => {
    // setLoading(true);
    try {
      const response = await axios.get(API_BASE_URL);
      setReports(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('日報の取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    axios.get(API_BASE_URL)
        .then((response) => {
      if (isMounted) {
        setReports(Array.isArray(response.data) ? response.data : []);
      }
    })
        .catch((error) => {
          console.error('日報一覧の取得に失敗しました。',error);
        })
        .finally(() => {
          if(isMounted) {
            setLoading(false);
          }
        });
        return () => {
          isMounted = false;
        };
    },[]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newReport = {
      workDate,
      workHours: parseFloat(workHours),
      content,
      impressions,
    };

    try {
      await axios.post(API_BASE_URL, newReport);
      setWorkHours('');
      setContent('');
      setImpressions('');
      fetchReports();
      alert('日報を登録しました！');
    } catch (error) {
      console.error('日報の登録に失敗しました:', error);
      alert('日報の登録に失敗しました。');
    }
  };

  return (
      <div className="container">
        <h1>日報管理システム</h1>

        <section className="form-section">
          <h2>新規日報登録</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>日付</label>
              <input
                  type="date"
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                  required
              />
            </div>

            <div className="form-group">
              <label>作業時間 (時間)</label>
              <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  placeholder="例: 7.5"
                  value={workHours}
                  onChange={(e) => setWorkHours(e.target.value)}
                  required
              />
            </div>

            <div className="form-group">
              <label>業務内容</label>
              <textarea
                  rows="5"
                  placeholder="本日の業務内容を記入してください"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
              />
            </div>

            <div className="form-group">
              <label>所感（任意）</label>
              <textarea
                  rows="3"
                  placeholder="気づきや学んだこと、翌日の予定など"
                  value={impressions}
                  onChange={(e) => setImpressions(e.target.value)}
              />
            </div>

            <button type="submit" className="submit-btn">日報を登録する</button>
          </form>
        </section>

        <section>
          <h2>日報一覧</h2>

          {loading ? (
              <p className="message-loading">データを読み込み中です...</p>
          ) : reports.length === 0 ? (
              <p className="message-empty">日報データがまだありません。上のフォームから登録してください。</p>
          ) : (
              reports.map((report) => (
                  <div key={report.id} className="report-item">
                    <div className="report-header">
                      <p className="report-date">{report.workDate}</p>
                      <p className="report-hours">作業時間: <strong>{report.workHours}</strong> 時間</p>
                    </div>
                    <div className="report-body">
                      <div className="report-field">
                        <strong>【業務内容】</strong>
                        <p>{report.content}</p>
                      </div>
                      {report.impressions && (
                          <div className="report-field">
                            <strong>【所感】</strong>
                            <p>{report.impressions}</p>
                          </div>
                      )}
                    </div>
                  </div>
              ))
          )}
        </section>
      </div>
  );
}

export default App;