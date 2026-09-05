function SectionTag({ index, label, trailing }) {
  return (
    <div className="section-tag-row">
      <span className="section-tag">
        {index} // {label}
      </span>
      {trailing && <span className="section-tag-trailing">{trailing}</span>}
    </div>
  );
}

export default SectionTag;
