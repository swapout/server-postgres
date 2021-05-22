const { createLogger, format, transports } = require('winston');
const { pool } = require('../config/db')

const Transport = require('winston-transport');

//
// Inherit from `winston-transport` so you can take advantage
// of the base functionality and `.exceptions.handle()`.
//
class SQLTransport extends Transport {
  constructor(opts) {
    super(opts);
    //
    // Consume any custom options here. e.g.:
    // - Connection information for databases
    // - Authentication information for APIs (e.g. loggly, papertrail,
    //   logentries, etc.).
    //
  }

  log(info, callback) {
    setImmediate(async () => {
      this.emit('logged', info);
      const payload = {
        service: info.service,
        method: info.method,
        path: info.path,
        http_status: info.status,
        file: info.file,
        level: info.level,
        message: info.message,
        user_id: info.user_id,
        value: info.value,
        created_at: info.timestamp,
      }
      console.log(payload)
      await pool.query(
        `
          insert into logs (user_id, method, path, status, file, level, message)
          values ($1, $2, $3, $4, $5, $6, $7);
        `,
        [payload.user_id, payload.method, payload.path, payload.http_status, payload.file, payload.level, payload.message]
      )

    });

    // Perform the writing to the remote service
    callback();
  }
}

exports.logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
    format.prettyPrint()
  ),
  defaultMeta: { service: 'PZ-back-end' },
  transports: [
    //
    // - Write to all logs with level `info` and below to `quick-start-combined.log`.
    // - Write all logs error (and below) to `quick-start-error.log`.
    //
    new SQLTransport(),
    new transports.File({ filename: 'quick-start-error.log', level: 'error' }),
    new transports.File({ filename: 'quick-start-combined.log' })
  ]
});


