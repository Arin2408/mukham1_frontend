/**
 * Names that tell apart things that look the same: two offices can each
 * have a "Sales" department, a "Manager" designation or a "Night
 * 20:00 - 04:00" shift. Each label adds where it belongs: department, then
 * office. The mobile app labels them the same way (src/lib/setup-labels.ts).
 */

const join = (...parts) => parts.filter(Boolean).join(" · ");

/** "Sales · HQ" */
export function departmentLabel(department, locations = []) {
  const office = locations.find((l) => l.location_id === department.location_id);
  return join(department.details, office?.location_name);
}

/** "Manager · Sales · HQ" */
export function designationLabel(designation, departments = [], locations = []) {
  const department = departments.find((d) => d.department_id === designation.department_id);
  return join(designation.details, department && departmentLabel(department, locations));
}

/** "Night 20:00 - 04:00" */
export function shiftTimes(shift) {
  const time = (t) => String(t ?? "").slice(0, 5);
  return `${shift.shift_name} ${time(shift.shift_start_time)} - ${time(shift.shift_end_time)}`;
}

/** "Night 20:00 - 04:00 · Stores · HQ" */
export function shiftLabel(shift, departments = [], locations = []) {
  const department = departments.find((d) => d.department_id === shift.department_id);
  return join(shiftTimes(shift), department && departmentLabel(department, locations));
}
