/**
 * Custom hook for domain-related utilities
 * Provides reactive domain state and helper functions
 */

import { useEffect, useState } from 'react';
import { 
  getCurrentDomain, 
  isAdminDomain, 
  isMainDomain,
  getRedirectUrl,
  validateDomainAccess,
  getMainDomainUrl,
  getAdminDomainUrl
} from '@/utils/domain';

export function useDomain() {
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [onAdminDomain, setOnAdminDomain] = useState<boolean>(false);
  const [onMainDomain, setOnMainDomain] = useState<boolean>(true);

  useEffect(() => {
    // Initialize domain state
    const domain = getCurrentDomain();
    setCurrentDomain(domain);
    setOnAdminDomain(isAdminDomain());
    setOnMainDomain(isMainDomain());
  }, []);

  return {
    currentDomain,
    onAdminDomain,
    onMainDomain,
    isAdminDomain,
    isMainDomain,
    getRedirectUrl,
    validateDomainAccess,
    getMainDomainUrl,
    getAdminDomainUrl,
  };
}
