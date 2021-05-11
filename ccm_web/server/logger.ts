import path from 'path'
import winston, { format } from 'winston'

const logFormat = format.printf(
  ({ level, message, timestamp, filePath }) => {
    const moduleName = path.basename(filePath)
    return `${String(timestamp)} - ${moduleName} - ${level} - ${message}`
  }
)

const baseLogger = winston.createLogger({
  transports: [new winston.transports.Console()],
  format: format.combine(
    format.timestamp(),
    format.colorize(),
    logFormat
  ),
  exitOnError: false
})

export default baseLogger
