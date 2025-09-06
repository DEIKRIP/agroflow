export interface WorkflowTransition {
  from: string[];
  to: string;
  roles?: string[];
}

// Estados del flujo de financiamiento
export const financiamientoStates = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const validTransitions: Record<string, WorkflowTransition[]> = {
  // Initial state
  draft: [
    { from: ['draft'], to: 'pending_approval', roles: ['admin', 'operador'] },
    { from: ['draft'], to: 'cancelled', roles: ['admin', 'operador'] },
  ],
  
  // Pending approval
  pending_approval: [
    { from: ['pending_approval'], to: 'approved', roles: ['admin'] },
    { from: ['pending_approval'], to: 'rejected', roles: ['admin'] },
    { from: ['pending_approval'], to: 'cancelled', roles: ['admin', 'operador'] },
  ],
  
  // Approved
  approved: [
    { from: ['approved'], to: 'in_progress', roles: ['admin', 'operador'] },
    { from: ['approved'], to: 'cancelled', roles: ['admin'] },
  ],
  
  // In progress
  in_progress: [
    { from: ['in_progress'], to: 'completed', roles: ['admin', 'operador'] },
    { from: ['in_progress'], to: 'on_hold', roles: ['admin', 'operador'] },
    { from: ['in_progress'], to: 'cancelled', roles: ['admin'] },
  ],
  
  // On hold
  on_hold: [
    { from: ['on_hold'], to: 'in_progress', roles: ['admin', 'operador'] },
    { from: ['on_hold'], to: 'cancelled', roles: ['admin'] },
  ],
  
  // Completed
  completed: [
    { from: ['completed'], to: 'in_progress', roles: ['admin'] },
  ],
  
  // Rejected and Cancelled are final states with no transitions out
  rejected: [],
  cancelled: [],
};

export function getValidTransitions(currentStatus: string, userRole?: string): string[] {
  const transitions = validTransitions[currentStatus] || [];
  
  if (!userRole) {
    return [];
  }
  
  return transitions
    .filter(transition => {
      // If no roles are specified, the transition is available to all roles
      if (!transition.roles || transition.roles.length === 0) {
        return true;
      }
      
      // Otherwise, check if the user's role is in the allowed roles
      return transition.roles.includes(userRole);
    })
    .map(transition => transition.to);
}

export function canTransition(fromStatus: string, toStatus: string, userRole?: string): boolean {
  const transitions = validTransitions[fromStatus] || [];
  
  if (!userRole) {
    return false;
  }
  
  return transitions.some(transition => {
    // Check if the transition is to the target status
    if (transition.to !== toStatus) {
      return false;
    }
    
    // If no roles are specified, the transition is available to all roles
    if (!transition.roles || transition.roles.length === 0) {
      return true;
    }
    
    // Otherwise, check if the user's role is in the allowed roles
    return transition.roles.includes(userRole);
  });
}
