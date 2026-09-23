import api from './api';

export const researchService = {
  getMetrics: async () => {
    const res = await api.get('/api/research/metrics');
    return res.data;
  },

  runBenchmark: async () => {
    const res = await api.post('/api/research/run-benchmark');
    return res.data;
  },

  getHealth: async () => {
    const res = await api.get('/api/health');
    return res.data;
  }
};
