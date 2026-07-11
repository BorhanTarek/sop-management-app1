export function getRoleLabel(role) {
  if (!role) return 'Viewer';
  const r = role.toLowerCase().trim();
  if (r === 'admin') return 'Admin';
  if (r === 'transport_manager') return 'Transport Management';
  if (r === 'station_manager') return 'Stations Management';
  if (r === 'station_master') return 'Station Master';
  if (r === 'driver') return 'Driver';
  if (r === 'occ') return 'OCC';
  return role.replace(/_/g, ' ');
}
