export const formatDate = (timestamp: number | string | undefined): string => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return isNaN(date.getTime())
    ? 'N/A'
    : date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
};
