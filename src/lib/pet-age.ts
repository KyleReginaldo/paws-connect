export function getPetAgeLabel(date_of_birth?: string | null, age?: number | null): string {
  if (date_of_birth) {
    const birth = new Date(date_of_birth);
    if (!isNaN(birth.getTime())) {
      const now = new Date();
      let years = now.getFullYear() - birth.getFullYear();
      const md = now.getMonth() - birth.getMonth();
      if (md < 0 || (md === 0 && now.getDate() < birth.getDate())) years--;
      if (years >= 1) return `${years} year${years === 1 ? '' : 's'} old`;
      let months = (now.getFullYear() - birth.getFullYear()) * 12 + md;
      if (now.getDate() < birth.getDate()) months--;
      months = Math.max(0, months);
      return `${months} month${months === 1 ? '' : 's'} old`;
    }
  }
  if (typeof age === 'number') {
    return `${age} year${age === 1 ? '' : 's'} old`;
  }
  return '—';
}
