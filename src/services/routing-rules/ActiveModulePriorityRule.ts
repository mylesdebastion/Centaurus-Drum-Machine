/**
 * Active Module Priority Rule
 * Story 18.4: Context-Aware Routing Rules
 *
 * Ensures the active module gets the highest-priority device assignment
 */

import type { RoutingRule } from '@/types/routing-rules';

export const ActiveModulePriorityRule: RoutingRule = {
  name: 'ActiveModulePriority',
  description: 'Active module gets highest-priority device assignment',
  priority: 100,

  condition: (context) => {
    return context.activeModule !== null;
  },

  action: (_context, currentAssignments) => {
    // This rule is already handled by the compatibility scoring algorithm
    // (active module gets 20% score boost)
    // No additional modifications needed
    return currentAssignments;
  },
};
