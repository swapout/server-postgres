const { createLogger, format } = require('winston');
const { pool } = require('../config/db')

const Transport = require('winston-transport');

class SQLTransport extends Transport {
  constructor(opts) {
    super(opts);
  }

  log(info, callback) {
    setImmediate(async () => {
      this.emit('logged', info);
      const payload = {
        method: info.method,
        url: info.url,
        status: info.status,
        level: info.level,
        message: info.message,
        user_id: info.user_id || null,
        project_id: info.project_id || null,
        position_id: info.position_id || null,
        application_id: info.application_id || null,
        type: info.type || null,
        stack: info.stack || null,
        created_at: info.timestamp,
      }
      await pool.query(
        `
          insert into logs (user_id, project_id, position_id, application_id, method, url, status, level, message, stack, type)
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
        `,
        [payload.user_id, payload.project_id, payload.position_id, payload.application_id, payload.method, payload.url, payload.status, payload.level, payload.message, payload.stack, payload.type]
      )

    });

    // Perform the writing to the remote service
    callback();
  }
}

exports.logger = createLogger({
  format: format.combine(
    format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
    format.prettyPrint()
  ),
  defaultMeta: { },
  transports: [
    new SQLTransport(),
    // new transports.File({ filename: 'quick-start-error.log', level: 'error' }),
    // new transports.File({ filename: 'quick-start-combined.log' })
  ]
});


