export const Highlight: React.FC<{ text: string; searchTerms: string[] }> = ({
  text,
  searchTerms,
}) => {
  if (!searchTerms.length) return <>{text}</>;

  const regex = new RegExp(`(${searchTerms.join('|')})`, 'gi');
  const parts = text.split(regex);

  console.log(
    `%c parts ` + JSON.stringify(parts, null, 4),
    'color:white; background:green; font-size: 20px',
  );

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="ws-bg-yellow-200">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
};
