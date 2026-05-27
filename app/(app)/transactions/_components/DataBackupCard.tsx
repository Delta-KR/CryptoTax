'use client';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  exportToJSON,
  importFromJSON,
  downloadAsFile,
} from '@/lib/storage/session';

// 거래 내역 JSON 백업·복원 카드. localStorage 기반이라 디바이스 간
// 이동·이전 시 사용. 가져오기 시 사용자 confirm 필수 (덮어쓰기).
export function DataBackupCard() {
  const importRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<
    { type: 'info' | 'success' | 'error'; text: string } | null
  >(null);

  function handleExport() {
    const json = exportToJSON();
    if (!json) {
      setMessage({ type: 'info', text: '내보낼 거래 데이터가 없어요.' });
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    downloadAsFile(json, `kontaxt-backup-${date}.json`);
    setMessage({ type: 'success', text: '백업 파일이 다운로드됐어요.' });
  }

  function handleImportClick() {
    importRef.current?.click();
  }

  async function handleImportChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (
      !window.confirm(
        '가져오기는 현재 거래 데이터를 덮어씁니다. 진행하시겠어요?',
      )
    ) {
      if (importRef.current) importRef.current.value = '';
      return;
    }
    try {
      const text = await file.text();
      const result = importFromJSON(text);
      if (result.ok) {
        setMessage({
          type: 'success',
          text: `${result.transactionCount ?? 0}개 거래를 가져왔어요. 페이지를 새로고침하면 반영돼요.`,
        });
      } else {
        setMessage({ type: 'error', text: result.error ?? '가져오기 실패' });
      }
    } catch {
      setMessage({ type: 'error', text: '파일 읽기 실패' });
    } finally {
      if (importRef.current) importRef.current.value = '';
    }
  }

  return (
    <div className="mt-8 rounded-lg border border-line bg-card p-5">
      <h2 className="text-[14px] font-bold text-ink">거래 내역 백업</h2>
      <p className="mt-1 text-[12.5px] leading-[1.55] text-muted">
        JSON 파일로 내보내거나 다른 디바이스에서 가져올 수 있어요. 데이터는 브라우저에만 저장되어 있어, 다른 디바이스에서 사용하려면 백업 파일이 필요해요.
      </p>
      <div className="mt-3 flex gap-2">
        <Button variant="secondary" size="sm" onClick={handleExport}>
          내보내기 (JSON)
        </Button>
        <Button variant="secondary" size="sm" onClick={handleImportClick}>
          가져오기
        </Button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImportChange}
        />
      </div>
      {message && (
        <div
          className={`mt-3 rounded-md border px-3 py-2 text-[12px] leading-[1.55] ${
            message.type === 'error'
              ? 'border-bad/40 bg-bad-soft text-bad'
              : message.type === 'success'
                ? 'border-good/40 bg-good-soft text-good'
                : 'border-line bg-bg-soft text-muted'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
