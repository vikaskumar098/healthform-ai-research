import api from './api';

export const reportService = {
  uploadReport: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/reports/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return res.data;
  },

  loadSampleReport: async (sampleId) => {
    const res = await api.post(`/api/reports/load-sample/${sampleId}`);
    return res.data;
  },

  listReports: async () => {
    const res = await api.get('/api/reports');
    return res.data;
  },

  getReport: async (reportId) => {
    const res = await api.get(`/api/reports/${reportId}`);
    return res.data;
  },

  deleteReport: async (reportId) => {
    const res = await api.delete(`/api/reports/${reportId}`);
    return res.data;
  },

  reanalyzeReport: async (reportId) => {
    const res = await api.post(`/api/reports/${reportId}/analyze`);
    return res.data;
  },

  compareReports: async (reportIds) => {
    const res = await api.post('/api/comparison', { report_ids: reportIds });
    return res.data;
  },

  getReportFileBlob: async (reportId) => {
    const res = await api.get(`/api/reports/${reportId}/file`, { responseType: 'blob' });
    return res.data;
  }
};
