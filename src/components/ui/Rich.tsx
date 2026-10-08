/** Renders copy segments where `b` marks the bold words. */
export function Rich({ parts }: { parts: ReadonlyArray<{ t: string; b?: boolean }> }) {
  return (
    <>
      {parts.map((p, i) => (p.b ? <b key={i}>{p.t}</b> : <span key={i}>{p.t}</span>))}
    </>
  );
}
