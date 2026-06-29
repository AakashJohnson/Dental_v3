/**
 * Role-scoped College serializer — strict, server-enforced field projection.
 *
 * A College record carries private trust ownership, confidential financials and
 * private contact details. These must NEVER reach roles that only need task
 * data. Each viewer is mapped to exactly one disclosure level:
 *
 *   full      → entire profile incl. trust, finance, contact
 *   statutory → name, registration, status, hospital, courses, postal address
 *               (no trust ownership, no confidential financials)
 *   identity  → id, name, status, state, city (who/where only)
 *   location  → state, city, geo (where only, for the inspection visit)
 *   none      → no college object is embedded at all
 *
 * Disclosure is decided by role AND ownership: an applicant/consultant only
 * receives the full profile for a college they own / are delegated to.
 */
import { Role } from '../domain/enums.js';
import { College, User } from '../types/index.js';

export type CollegeDisclosure = 'full' | 'statutory' | 'identity' | 'location' | 'none';

/** Role → default disclosure level (ownership can upgrade applicant/consultant). */
const COLLEGE_DISCLOSURE: Record<Role, CollegeDisclosure> = {
  [Role.APPLICANT]: 'identity', // upgraded to 'full' only for the owner
  [Role.CONSULTANT]: 'identity', // upgraded to 'full' only for delegated colleges
  [Role.DCI_ADMIN]: 'full',
  [Role.SUPER_ADMIN]: 'full',
  [Role.GOVERNMENT_AUTHORITY]: 'statutory',
  [Role.SCRUTINY_OFFICER]: 'identity',
  [Role.COMPLIANCE_OFFICER]: 'identity',
  [Role.EC_MEMBER]: 'identity',
  [Role.CASE_OFFICER]: 'location',
  [Role.ASSESSOR]: 'location',
  [Role.OBSERVER]: 'location',
  [Role.SYSTEM_ADMINISTRATOR]: 'none',
};

/** Resolve the disclosure level for a viewer against a specific college. */
export function collegeDisclosureFor(viewer: User, college: College, owns: boolean): CollegeDisclosure {
  const base = COLLEGE_DISCLOSURE[viewer.role] ?? 'none';
  if ((viewer.role === Role.APPLICANT || viewer.role === Role.CONSULTANT) && owns) {
    return 'full';
  }
  return base;
}

/** Project a College down to the fields permitted at a disclosure level. */
export function serializeCollege(
  college: College | undefined,
  level: CollegeDisclosure,
): Record<string, unknown> | undefined {
  if (!college || level === 'none') return undefined;

  switch (level) {
    case 'full':
      return { ...college };
    case 'statutory':
      return {
        id: college.id,
        name: college.name,
        status: college.status,
        state: college.state,
        city: college.city,
        registrationNo: college.registrationNo,
        hospitalAttached: college.hospitalAttached,
        courses: college.courses,
        // Postal address only — needed to address LOI/LOP letters. No phone/email,
        // no trust ownership, no confidential financials.
        address: college.contact?.address,
      };
    case 'identity':
      return {
        id: college.id,
        name: college.name,
        status: college.status,
        state: college.state,
        city: college.city,
      };
    case 'location':
      return {
        state: college.state,
        city: college.city,
        geo: college.geo,
      };
    default:
      return undefined;
  }
}
