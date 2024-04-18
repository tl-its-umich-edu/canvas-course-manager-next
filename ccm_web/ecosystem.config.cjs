/*
https://pm2.keymetrics.io/docs/usage/application-declaration/
https://pm2.keymetrics.io/docs/usage/docker-pm2-nodejs/
*/

module.exports = {
  apps: [{
    name: 'CCM - NestJS app',
    script: 'server/src/main.js',
    exec_mode: 'cluster',
    instances: process.env.PM2_INSTANCES || 'max',
    autorestart: true,
    max_memory_restart: process.env.PM2_MEM_LIMIT || '1G',
    out_file: '/dev/null',
    error_file: '/dev/null'
  }]
}
