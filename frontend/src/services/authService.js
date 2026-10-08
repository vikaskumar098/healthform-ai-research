import api from './api';

export const authService = {
  getMe: async () => {
    const res = await api.get('/api/auth/me');
    return res.data;
  },

  updateProfile: async (profileData) => {
    const res = await api.put('/api/auth/profile', profileData);
    return res.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const res = await api.post('/api/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return res.data;
  },

  exportUserData: async () => {
    const res = await api.get('/api/auth/export-data');
    return res.data;
  },

  deleteAccount: async () => {
    const res = await api.delete('/api/auth/account');
    return res.data;
  },
};
