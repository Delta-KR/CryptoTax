import { cn } from '@/lib/utils';

interface MarkProps {
  className?: string;
  /**
   * 화면 낭독기용 라벨. 워드마크와 함께 노출되는 장식 마크인 경우 비워 두기.
   */
  title?: string;
}

/**
 * Kontaxt 브랜드 마크 (인라인 SVG).
 *
 * 원본 `public/mark.svg` 는 1500x1500 viewBox 안에 마크가 작게 들어 있어
 * h-8 적용 시 실제 시각 마크는 약 12px (nav.tsx 주석 참고). 인라인화로
 * 네트워크 요청 1건 제거 + `currentColor` 기반으로 색 컨트롤 가능
 * (호출부에서 `text-brand` 등 지정).
 *
 * Path 데이터는 원본 mark.svg 를 svgo --multipass -p 1 로 압축한 결과를
 * 그대로 TSX 로 옮긴 것. fill 만 hard-coded `#1b17ff` → `currentColor`.
 */
export function Mark({ className, title }: MarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1500 1500"
      className={cn('shrink-0', className)}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <clipPath id="kx-mark-a">
          <path d="M0 0h582v769H0z" />
        </clipPath>
        <clipPath id="kx-mark-b">
          <path d="M.7.3h262.8V768H.7Zm0 0" />
        </clipPath>
        <clipPath id="kx-mark-c">
          <path d="M132.1.3a131.4 131.4 0 0 1 131.4 131.4v504.6a131.4 131.4 0 1 1-262.8 0V131.7A131.4 131.4 0 0 1 132.1.3m0 0" />
        </clipPath>
        <clipPath id="kx-mark-d">
          <path d="M0 0h264v768H0z" />
        </clipPath>
        <clipPath id="kx-mark-e">
          <path d="M.7.3h262.8v767.5H.7Zm0 0" />
        </clipPath>
        <clipPath id="kx-mark-f">
          <path d="M132.1.3a131.4 131.4 0 0 1 131.4 131.4v504.6a131.4 131.4 0 1 1-262.8 0V131.7A131.4 131.4 0 0 1 132.1.3m0 0" />
        </clipPath>
        <clipPath id="kx-mark-g">
          <path d="M310.6.3h270.7V271H310.6Zm0 0" />
        </clipPath>
        <clipPath id="kx-mark-h">
          <path d="M446 .3a135.4 135.4 0 1 0 0 270.7A135.4 135.4 0 0 0 446 .3m0 0" />
        </clipPath>
        <clipPath id="kx-mark-i">
          <path d="M0 0h272v271H0z" />
        </clipPath>
        <clipPath id="kx-mark-j">
          <path d="M.6.3h270.7V271H.6Zm0 0" />
        </clipPath>
        <clipPath id="kx-mark-k">
          <path d="M136 .3a135.4 135.4 0 1 0 0 270.7A135.4 135.4 0 0 0 136 .3m0 0" />
        </clipPath>
        <clipPath id="kx-mark-l">
          <path d="M314.5 315h262.8v453H314.5Zm0 0" />
        </clipPath>
        <clipPath id="kx-mark-m">
          <path d="M389.5 315h112.8a75 75 0 0 1 75 75v302.7a75 75 0 0 1-75 75H389.5a75 75 0 0 1-75-75V390a75 75 0 0 1 75-75m0 0" />
        </clipPath>
        <clipPath id="kx-mark-n">
          <path d="M0 0h264v454H0z" />
        </clipPath>
        <clipPath id="kx-mark-o">
          <path d="M.5 1h262.8v452.8H.5Zm0 0" />
        </clipPath>
        <clipPath id="kx-mark-p">
          <path d="M75.5 1h112.8a75 75 0 0 1 75 75v302.7a75 75 0 0 1-75 75H75.5a75 75 0 0 1-75-75V76a75 75 0 0 1 75-75m0 0" />
        </clipPath>
      </defs>
      <g clipPath="url(#kx-mark-a)" transform="translate(459 366)">
        <g clipPath="url(#kx-mark-b)">
          <g clipPath="url(#kx-mark-c)">
            <g clipPath="url(#kx-mark-d)">
              <g clipPath="url(#kx-mark-e)">
                <g clipPath="url(#kx-mark-f)">
                  <path fill="currentColor" d="M.7.3h262.8V768H.7Zm0 0" />
                </g>
              </g>
            </g>
          </g>
        </g>
        <g clipPath="url(#kx-mark-g)">
          <g clipPath="url(#kx-mark-h)">
            <g clipPath="url(#kx-mark-i)" transform="translate(310 0)">
              <g clipPath="url(#kx-mark-j)">
                <g clipPath="url(#kx-mark-k)">
                  <path fill="currentColor" d="M.6.3h270.7V271H.6Zm0 0" />
                </g>
              </g>
            </g>
          </g>
        </g>
        <g clipPath="url(#kx-mark-l)">
          <g clipPath="url(#kx-mark-m)">
            <g clipPath="url(#kx-mark-n)" transform="translate(314 314)">
              <g clipPath="url(#kx-mark-o)">
                <g clipPath="url(#kx-mark-p)">
                  <path fill="currentColor" d="M.5 1h262.8v452.6H.5Zm0 0" />
                </g>
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
