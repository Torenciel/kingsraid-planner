// .env config
const config = {
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3002',
    assetsUrl: process.env.REACT_APP_ASSETS_URL || 'http://localhost:3002',
    timeout: 10000, // 10 seconds
  },
  
  features: {
    enableMongoDB: process.env.REACT_APP_ENABLE_MONGODB === 'true',
    enableCache: true,
  },
  
  debug: {
    logApiCalls: process.env.REACT_APP_LOG_API_CALLS === 'true',
    mockApi: process.env.REACT_APP_MOCK_API === 'true',
  }
};

export default config;