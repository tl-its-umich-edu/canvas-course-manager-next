// https://pm2.keymetrics.io/docs/usage/docker-pm2-nodejs/

module.exports = {
  apps: {
    name: 'CCM - NestJS app',
    script: 'server/src/main.js',
    exec_mode: 'cluster',
    instances: 'max',
    autorestart: true,
    max_memory_restart: '1G',
    out_file: '/dev/null',
    error_file: '/dev/null',
    pid_file: '/tmp/app.pid'
  }
}
