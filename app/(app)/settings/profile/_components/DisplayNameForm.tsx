'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { updateDisplayName } from '@/app/actions/account';

// 이름 변경 form. self-contained own state (name / savingName).
// 저장 성공 시 refreshSession 으로 UserContext TOKEN_REFRESHED 트리거 →
// UserMenu 즉시 갱신.
export function DisplayNameForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const toast = useToast();
  const [name, setName] = useState(initialName);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    setSavingName(true);
    const result = await updateDisplayName(name);
    if (result.ok) {
      try {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.refreshSession();
      } catch {
        // refresh 실패해도 server-side 저장은 성공 — 다음 페이지 로드 시 반영.
      }
      toast.show('이름이 저장됐어요.', 'success');
    } else {
      toast.show(result.error ?? '저장 실패', 'error');
    }
    setSavingName(false);
  }

  return (
    <Card padding="lg">
      <h2 className="mb-5 text-[16px] font-bold text-ink">기본 정보</h2>
      <form onSubmit={handleProfileSave} className="flex flex-col gap-4" noValidate>
        <Input
          label="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={savingName}
        />
        <Input
          label="이메일"
          type="email"
          value={email}
          readOnly
          helper="이메일 변경은 지원팀에 문의해주세요."
        />
        <div className="flex justify-end pt-1">
          <Button type="submit" disabled={savingName || name === initialName}>
            {savingName ? '저장 중…' : '저장'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
