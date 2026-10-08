/** Centered eyebrow + headline + lead. Used for "How it works" and the custody section. */
export function Statement({ id, label, titleA, titleHl, body }: { id?: string; label: string; titleA: string; titleHl: string; body: string }) {
  return (
    <section className="howit" id={id}>
      <div className="wrap">
        <span className="ds-label">{label}</span>
        <h2>
          {titleA} <span className="hl">{titleHl}</span>
        </h2>
        <p className="howit-lead">{body}</p>
      </div>
    </section>
  );
}
