export const partHandler = (message: any) => {
  const parts = message?.message?.content?.parts;
  return Array.isArray(parts) ? parts.filter(String).join('\n') : undefined;
};
