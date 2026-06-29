import { describe, it, expect } from 'vitest';
import { checkWorkflowEligibility, selectableWorkflows, hasPermission, APPLICATION_FIELD_SCOPES } from '../src/domain/permissions.js';
import { CollegeStatus, Role, WorkflowType } from '../src/domain/enums.js';

describe('Workflow eligibility guards', () => {
  it('new colleges can only access Workflow 1', () => {
    expect(checkWorkflowEligibility(WorkflowType.WORKFLOW_1_NEW_COLLEGE_FIRST_PG, CollegeStatus.NEW).allowed).toBe(true);
    expect(checkWorkflowEligibility(WorkflowType.WORKFLOW_2_INCREASE_BDS_MDS_SEATS, CollegeStatus.NEW).allowed).toBe(false);
    expect(selectableWorkflows(CollegeStatus.NEW)).toEqual([WorkflowType.WORKFLOW_1_NEW_COLLEGE_FIRST_PG]);
  });

  it('existing colleges cannot start Workflow 1 but can start 2–6', () => {
    expect(checkWorkflowEligibility(WorkflowType.WORKFLOW_1_NEW_COLLEGE_FIRST_PG, CollegeStatus.APPROVED).allowed).toBe(false);
    expect(checkWorkflowEligibility(WorkflowType.WORKFLOW_2_INCREASE_BDS_MDS_SEATS, CollegeStatus.APPROVED).allowed).toBe(true);
  });

  it('Workflow 7 is system-only and never user-selectable', () => {
    expect(checkWorkflowEligibility(WorkflowType.WORKFLOW_7_COMPLIANCE_VERIFICATION, CollegeStatus.APPROVED, false).allowed).toBe(false);
    expect(checkWorkflowEligibility(WorkflowType.WORKFLOW_7_COMPLIANCE_VERIFICATION, CollegeStatus.APPROVED, true).allowed).toBe(true);
    expect(selectableWorkflows(CollegeStatus.APPROVED)).not.toContain(WorkflowType.WORKFLOW_7_COMPLIANCE_VERIFICATION);
  });
});

describe('RBAC permission map & field scopes', () => {
  it('applicants cannot decide EC outcomes', () => {
    expect(hasPermission(Role.APPLICANT, 'ec:decide')).toBe(false);
    expect(hasPermission(Role.EC_MEMBER, 'ec:decide')).toBe(true);
  });

  it('officers get scoped (not full) application fields', () => {
    expect(APPLICATION_FIELD_SCOPES[Role.SCRUTINY_OFFICER]).not.toBe('*');
    expect(APPLICATION_FIELD_SCOPES[Role.APPLICANT]).toBe('*');
    // Scrutiny officer must NOT see EC-only fields like riskScore.
    const scope = APPLICATION_FIELD_SCOPES[Role.SCRUTINY_OFFICER] as string[];
    expect(scope).not.toContain('riskScore');
  });
});
