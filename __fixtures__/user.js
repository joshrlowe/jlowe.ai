/**
 * User and session fixtures for testing
 */

export const mockAdminUser = {
  id: 'admin-user-1',
  email: 'admin@example.com',
  role: 'admin',
};

export const mockSession = {
  user: mockAdminUser,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockExpiredSession = {
  user: mockAdminUser,
  expires: new Date(Date.now() - 1000).toISOString(),
};

export const nullSession = null;




