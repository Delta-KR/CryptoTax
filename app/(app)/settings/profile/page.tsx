'use client';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/app-chrome/PageHeader';
import { Card } from '@/components/ui/Card';
import { hasEmailIdentity } from '@/lib/auth';
import { useUserContext } from '@/components/app-chrome/UserContextProvider';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { DisplayNameForm } from './_components/DisplayNameForm';
import { PasswordChangeForm } from './_components/PasswordChangeForm';
import { DangerZoneCard } from './_components/DangerZoneCard';

export default function ProfilePage() {
  const { user, loading } = useUserContext();
  const [oauthOnly, setOauthOnly] = useState(false);
  // 회원탈퇴 모달 안 외부 권한 해제 안내용. Naver/Google 별 link 분기.
  // [[project_naver_auto_relogin_followup]] — 우리 측 user 삭제 후도 Naver 권한
  // 연결은 살아있어 NID_AUT cookie 가 있으면 자동 재로그인됨. 사용자 직접
  // 외부 권한 해제 권장.
  const [oauthProvider, setOauthProvider] = useState<'naver' | 'google' | null>(
    null,
  );

  // OAuth-only 여부 + provider 식별은 클라이언트에서 supabase.auth.getUser() 로 확인.
  // useCurrentUser 는 profiles 정보만 노출하므로 별도 호출.
  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return;
      setOauthOnly(!hasEmailIdentity(data.user));
      // provider 식별 — user_metadata.provider 와 app_metadata.provider 둘 다
      // 확인. 우리 callback (admin.generateLink) 이 user_metadata 에 박는데
      // Supabase verify 가 app_metadata 를 reset 하는 케이스
      // [[reference_naver_oauth_state_cookie]].
      const userMeta = data.user.user_metadata ?? {};
      const appMeta = data.user.app_metadata ?? {};
      const p = userMeta.provider ?? appMeta.provider;
      if (p === 'naver' || p === 'google') setOauthProvider(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !user) {
    return null;
  }

  return (
    <>
      <PageHeader title="프로필 관리" description="개인 정보와 비밀번호를 관리해요." />

      <div className="flex flex-col gap-5">
        <DisplayNameForm initialName={user.name} email={user.email} />

        {!oauthOnly && <PasswordChangeForm />}

        {oauthOnly && (
          <Card padding="lg">
            <h2 className="mb-2 text-[16px] font-bold text-ink">비밀번호</h2>
            <p className="text-[13px] text-muted">
              소셜 로그인으로 가입한 계정이에요. 비밀번호 관리는 연결된 소셜 제공자(예: Google,
              Kakao)에서 진행해 주세요.
            </p>
          </Card>
        )}

        <DangerZoneCard oauthProvider={oauthProvider} />
      </div>
    </>
  );
}
