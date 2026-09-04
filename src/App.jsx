import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // ★CSSファイルの読み込み

function App() {
  // ログイン中ユーザー情報を保持。未ログイン時はnull
  const [currentUser, setCurrentUser] = useState(null);

  // ログインフォーム用ステート
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // 日報用ステート
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [workHours, setWorkHours] = useState('');
  const [content, setContent] = useState('');
  const [impressions, setImpressions] = useState('');
  const [editingId, setEditingId] = useState(null);

  // 検索条件の為のState
  const [searchMonth, setSearchMonth] = useState('');
  const [searchUser, setSearchUser] = useState('');

  // 重複のない記録者リストを一覧データから自動生成
  const uniqueUsers = Array.from(
      new Set(reports.map((report) => report.userName || '朝倉シン').filter(Boolean))
  );

  const filteredReports = reports.filter((report) => {
        const matchMonth = !searchMonth || (report.workDate && report.workDate.startsWith(searchMonth));
        const reportUser = report.userName || '朝倉シン';
        const matchUser = !searchUser || reportUser === searchUser;

        return matchMonth && matchUser;
    });

  const API_BASE_URL = 'http://localhost:8080/api/v1/reports';
  const AUTH_BASE_URL = "http://localhost:8080/api/v1/auth";

  // ログイン処理
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await axios.post(`${AUTH_BASE_URL}/login`, {
        email: loginEmail,
        password: loginPassword,
      });
      setCurrentUser(response.data);
      await fetchReports();
    } catch {
      setLoginError('メールアドレスまたはパスワードが違います');
    }
  };

  // ログアウト処理
  const handleLogout = () => {
    setCurrentUser(null);
    setLoginEmail('');
    setLoginPassword('');
  };

  // 日報取得関数
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
          console.error('日報一覧の取得に失敗しました。', error);
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });
    return () => {
      isMounted = false;
    };
  }, []);

  // フォームリセット用共通関数
  const resetForm = () => {
    setEditingId(null);
    setWorkDate(new Date().toISOString().split('T')[0]);
    setWorkHours('');
    setContent('');
    setImpressions('');
  };

  // 編集ボタンを押したときの処理
  const handleEdit = (report) => {
    setEditingId(report.id);
    setWorkDate(report.workDate);
    setWorkHours(report.workHours);
    setContent(report.content);
    setImpressions(report.impressions || '');
    // 画面上部のフォームへスムーズにクロール
    window.scrollTo({top: 0, behavior: 'smooth'})
  };

  // 削除ボタンを押したときの処理
  const handleDelete = async (id) => {
    if (!window.confirm('この日報を削除してもよろしいですか？')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/${id}`);
      alert('日報を削除しました。');
      await fetchReports();
    } catch (error) {
      console.error('日報の削除に失敗しました:', error);
      alert('日報の削除に失敗しました。');
    }
  };

  // 送信処理（新規作成POST／更新PUT）
  const handleSubmit = async (e) => {
    e.preventDefault();

    const reportData = {
      workDate,
      workHours: parseFloat(workHours),
      content,
      impressions,
        userName: currentUser?.name || currentUser?.username,
    };

    try {
      if (editingId) {
        await axios.put(`${API_BASE_URL}/${editingId}`, reportData);
        alert('日報を更新しました！');
      } else {
        await axios.post(API_BASE_URL, reportData);
        alert('日報を登録しました！');
      }
      resetForm();
      await fetchReports();
    } catch (error) {
      console.error('保存処理に失敗しました:', error);
      alert('保存処理に失敗しました。');
    }
  };

  const handleSearch = (e) => {
      e.preventDefault();
  };

  const handleResetSearch = () => {
      setSearchMonth('');
      setSearchUser('');
  };

  if (!currentUser) {
    return (
        <div className="container" style={{maxWidth: '400px', marginTop: '50px'}}>
          <h1>日報管理システム</h1>
          <h2>ログイン</h2>
          {loginError && <p style={{color: 'red'}}>{loginError}</p>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>メールアドレス</label>
              <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="メールアドレスを入力"
                  required
              />
            </div>
            <div className="from-group">
              <label>パスワード</label>
              <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  repuired
              />
            </div>
            <button type="submit" className="submit-btn">ログイン</button>
          </form>
        </div>
    );
  }

  // --- ログイン済みの画面 ---
  return (
      <div className="container">
        {/* ヘッダーエリア：ユーザー名とログアウトボタン */}
        <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
          <h1>日報管理システム</h1>
          <div>
            <span style={{marginRight: '15px'}}>
              ようこそ、<strong>{currentUser.name}</strong> 様 ({currentUser.role === 'ADMIN' ? '管理者' : '一般'})
            </span>
            <button onClick={handleLogout} className="cancel-btn">ログアウト</button>
          </div>
        </header>

        <section className="form-section">
          {/* モードによって見出しを切り替え */}
          <h2>{editingId ? '日報の編集' : '新規日報登録'}</h2>
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

            {/* ボタンの表示切り替え（編集中の場合はキャンセルボタンも表示） */}
            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {editingId ? '日報を更新する' : '日報を登録する'}
              </button>
              {editingId && (
                  <button type="button" className="cansel-btn" onClick={resetForm}>
                    編集をキャンセル
                  </button>
              )}
            </div>
          </form>
        </section>

        <div className="search-section">
            <h3>日報検索</h3>
            <form onSubmit={handleSearch} className="search-form">
                <div className="search-group">
                    <label htmlFor="search-month">対象月</label>
                    <input
                        type="month"
                        id="search-month"
                        value={searchMonth}
                        onChange={(e) => setSearchMonth(e.target.value)}
                        />
                </div>

                <div className="search-group">
                    <label htmlFor="search-user">記録者</label>
                    <select
                        id="search-user"
                        value={searchUser}
                        onChange={(e) => setSearchUser(e.target.value)}
                    >
                        <option value="">全員</option>
                        {uniqueUsers.map((user, index) => (
                            <option key={index} value={user}>
                                {user}
                            </option>
                            ))}
                    </select>
                </div>

                <div className="search-buttons">
                    <button type="submit" className="btn-search">検索</button>
                    <button type="button" onClick={handleResetSearch} className="btn-reset">リセット</button>
                </div>
            </form>
        </div>

        <div className="report-list-section">
          <h2>日報一覧</h2>

            {loading ? (
                <p className="message-loading">データを読み込み中です...</p>
            ) : filteredReports.length === 0 ? (
                <p className="message-empty">該当する日報が見つかりません。</p>
            ) : (

              <table className="report-table">
                <thead>
                <tr>
                  <th className="col-date">作業日</th>
                  <th className="col-hours">作業時間</th>
                  <th>業務内容</th>
                  <th>所感</th>
                  <th className="col-user">記録者</th>
                  <th className="col-actions">操作</th>
                </tr>
                </thead>
                <tbody>
                {filteredReports.map((report) => (
                    <tr key={report.id}>
                      <td className="col-date">{report.workDate}</td>
                      <td className="col-hours">{report.workHours} 時間</td>
                      <td className="col-content">{report.content}</td>
                      <td className="col-impressions">{report.impressions || '-'}</td>
                      <td className="col-user">{report.userName || '朝倉シン'}</td>
                      <td className="col-actions">
                        <button className="edit-btn" onClick={() => handleEdit(report)}>
                          編集
                        </button>
                        {currentUser.role === 'ADMIN' && (
                        <button className="delete-btn" onClick={() => handleDelete(report.id)}>
                          削除
                        </button>
                        )}
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
          )}
        </div>
      </div>
  );
}

export default App;

          {/*<section>*/}
          {/*  <h2>日報一覧</h2>*/}

          {/*{loading ? (*/}
          {/*    <p className="message-loading">データを読み込み中です...</p>*/}
          {/*) : reports.length === 0 ? (*/}
          {/*    <p className="message-empty">日報データがまだありません。上のフォームから登録してください。</p>*/}
          {/*) : (*/}
          {/*    reports.map((report) => (*/}
          {/*        <div key={report.id} className="report-item">*/}
          {/*          <div className="report-header">*/}
          {/*            <p className="report-date">{report.workDate}</p>*/}
          {/*            <p className="report-hours">作業時間: <strong>{report.workHours}</strong> 時間</p>*/}
          {/*          </div>*/}
          {/*          <div className="report-body">*/}
          {/*            <div className="report-field">*/}
          {/*              <strong>【業務内容】</strong>*/}
          {/*              <p>{report.content}</p>*/}
          {/*            </div>*/}
          {/*            {report.impressions && (*/}
          {/*                <div className="report-field">*/}
          {/*                  <strong>【所感】</strong>*/}
          {/*                  <p>{report.impressions}</p>*/}
          {/*                </div>*/}
          {/*            )}*/}
          {/*          </div>*/}

          {/*        /!* 編集・削除ボタンエリア *!/*/}
          {/*          <div className="report-actions">*/}
          {/*            <button className="edit-btn" onClick={() => handleEdit(report)}>*/}
          {/*              編集*/}
          {/*            </button>*/}
          {/*            /!* 管理者ADMINの場合のみ削除ボタンを表示 *!/*/}
          {/*            {currentUser.role === 'ADMIN' && (*/}
          {/*            <button className="delete-btn" onClick={() => handleDelete(report.id)}>*/}
          {/*              削除*/}
          {/*            </button>*/}
          {/*            )}*/}
          {/*          </div>*/}
          {/*        </div>*/}
          {/*    ))*/}
          {/*)}*/}
      {/*  </section>*/}
      {/*</div>*/}
