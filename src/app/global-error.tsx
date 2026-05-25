'use client';

export default function GlobalError() {
  return (
    <html lang="ko">
      <body>
        <div className="app-container">
          <div className="glass-card empty-state">
            <p className="empty-state-text">화면을 불러오지 못했습니다.</p>
          </div>
        </div>
      </body>
    </html>
  );
}
