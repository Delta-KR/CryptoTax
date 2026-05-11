// Global atmosphere layer — 10 scroll-anchored color blobs + dot grid + diagonal
// hairlines. All visual styling lives in app/globals.css under `.atmosphere`.
export function Atmosphere() {
  return (
    <div className="atmosphere" aria-hidden="true">
      <span className="blob b1" />
      <span className="blob b2" />
      <span className="blob b3" />
      <span className="blob b4" />
      <span className="blob b5" />
      <span className="blob b6" />
      <span className="blob b7" />
      <span className="blob b8" />
      <span className="blob b9" />
      <span className="blob b10" />
    </div>
  );
}
