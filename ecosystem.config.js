module.exports = {
  apps: [
    {
      name: 'legal-marketplace-api',
      script: 'src/server.js',
      instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        LOG_LEVEL: 'info'
      },
      error_file: 'logs/error.log',
      out_file: 'logs/combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      instance_var: 'INSTANCE_ID',
      merge_logs: true,
      source_map_support: true,
      disable_source_map_support: false
    },
    {
      name: 'legal-marketplace-worker',
      script: 'src/workers/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      error_file: 'logs/worker-error.log',
      out_file: 'logs/worker-out.log',
      time: true,
      autorestart: true,
      max_restarts: 5,
      wait_ready: false
    }
  ]
};