
import React from 'react';
import { useViewerMode } from '../context/ViewerContext';

interface ActionGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  adminOnly?: boolean;
}

/**
 * Wraps elements that should only be visible to active players/admins.
 * In Viewer Mode, the children are not rendered.
 */
export const ActionGuard: React.FC<ActionGuardProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { isReadOnly } = useViewerMode();

  if (isReadOnly) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
