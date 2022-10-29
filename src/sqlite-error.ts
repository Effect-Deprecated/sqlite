// NOTE This file was auto-generated by "scripts/generate-sqlite-error-types.ts"
/* eslint-disable prettier/prettier */

export namespace SqliteError {
  // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
  export function isSqliteError(error: any): error is SqliteError {
    return error.code && error.code.startsWith('SQLITE_')
  }

  export type SqliteError =
    | SQLITE_OK
    | SQLITE_ERROR
    | SQLITE_INTERNAL
    | SQLITE_PERM
    | SQLITE_ABORT
    | SQLITE_BUSY
    | SQLITE_LOCKED
    | SQLITE_NOMEM
    | SQLITE_READONLY
    | SQLITE_INTERRUPT
    | SQLITE_IOERR
    | SQLITE_CORRUPT
    | SQLITE_NOTFOUND
    | SQLITE_FULL
    | SQLITE_CANTOPEN
    | SQLITE_PROTOCOL
    | SQLITE_EMPTY
    | SQLITE_SCHEMA
    | SQLITE_TOOBIG
    | SQLITE_CONSTRAINT
    | SQLITE_MISMATCH
    | SQLITE_MISUSE
    | SQLITE_NOLFS
    | SQLITE_AUTH
    | SQLITE_FORMAT
    | SQLITE_RANGE
    | SQLITE_NOTADB
    | SQLITE_NOTICE
    | SQLITE_WARNING
    | SQLITE_ROW
    | SQLITE_DONE

  /** Successful result */
  export interface SQLITE_OK extends Error {
    code: 'SQLITE_OK'
    errno: 0
    message: string
  }

  /** Generic error */
  export interface SQLITE_ERROR extends Error {
    code: 'SQLITE_ERROR'
    errno: 1
    message: string
  }

  /** Internal logic error in SQLite */
  export interface SQLITE_INTERNAL extends Error {
    code: 'SQLITE_INTERNAL'
    errno: 2
    message: string
  }

  /** Access permission denied */
  export interface SQLITE_PERM extends Error {
    code: 'SQLITE_PERM'
    errno: 3
    message: string
  }

  /** Callback routine requested an abort */
  export interface SQLITE_ABORT extends Error {
    code: 'SQLITE_ABORT'
    errno: 4
    message: string
  }

  /** The database file is locked */
  export interface SQLITE_BUSY extends Error {
    code: 'SQLITE_BUSY'
    errno: 5
    message: string
  }

  /** A table in the database is locked */
  export interface SQLITE_LOCKED extends Error {
    code: 'SQLITE_LOCKED'
    errno: 6
    message: string
  }

  /** A malloc() failed */
  export interface SQLITE_NOMEM extends Error {
    code: 'SQLITE_NOMEM'
    errno: 7
    message: string
  }

  /** Attempt to write a readonly database */
  export interface SQLITE_READONLY extends Error {
    code: 'SQLITE_READONLY'
    errno: 8
    message: string
  }

  /** Operation terminated by sqlite3_interrupt() */
  export interface SQLITE_INTERRUPT extends Error {
    code: 'SQLITE_INTERRUPT'
    errno: 9
    message: string
  }

  /** Some kind of disk I/O error occurred */
  export interface SQLITE_IOERR extends Error {
    code: 'SQLITE_IOERR'
    errno: 10
    message: string
  }

  /** The database disk image is malformed */
  export interface SQLITE_CORRUPT extends Error {
    code: 'SQLITE_CORRUPT'
    errno: 11
    message: string
  }

  /** Unknown opcode in sqlite3_file_control() */
  export interface SQLITE_NOTFOUND extends Error {
    code: 'SQLITE_NOTFOUND'
    errno: 12
    message: string
  }

  /** Insertion failed because database is full */
  export interface SQLITE_FULL extends Error {
    code: 'SQLITE_FULL'
    errno: 13
    message: string
  }

  /** Unable to open the database file */
  export interface SQLITE_CANTOPEN extends Error {
    code: 'SQLITE_CANTOPEN'
    errno: 14
    message: string
  }

  /** Database lock protocol error */
  export interface SQLITE_PROTOCOL extends Error {
    code: 'SQLITE_PROTOCOL'
    errno: 15
    message: string
  }

  /** Internal use only */
  export interface SQLITE_EMPTY extends Error {
    code: 'SQLITE_EMPTY'
    errno: 16
    message: string
  }

  /** The database schema changed */
  export interface SQLITE_SCHEMA extends Error {
    code: 'SQLITE_SCHEMA'
    errno: 17
    message: string
  }

  /** String or BLOB exceeds size limit */
  export interface SQLITE_TOOBIG extends Error {
    code: 'SQLITE_TOOBIG'
    errno: 18
    message: string
  }

  /** Abort due to constraint violation */
  export interface SQLITE_CONSTRAINT extends Error {
    code: 'SQLITE_CONSTRAINT'
    errno: 19
    message: string
  }

  /** Data type mismatch */
  export interface SQLITE_MISMATCH extends Error {
    code: 'SQLITE_MISMATCH'
    errno: 20
    message: string
  }

  /** Library used incorrectly */
  export interface SQLITE_MISUSE extends Error {
    code: 'SQLITE_MISUSE'
    errno: 21
    message: string
  }

  /** Uses OS features not supported on host */
  export interface SQLITE_NOLFS extends Error {
    code: 'SQLITE_NOLFS'
    errno: 22
    message: string
  }

  /** Authorization denied */
  export interface SQLITE_AUTH extends Error {
    code: 'SQLITE_AUTH'
    errno: 23
    message: string
  }

  /** Not used */
  export interface SQLITE_FORMAT extends Error {
    code: 'SQLITE_FORMAT'
    errno: 24
    message: string
  }

  /** 2nd parameter to sqlite3_bind out of range */
  export interface SQLITE_RANGE extends Error {
    code: 'SQLITE_RANGE'
    errno: 25
    message: string
  }

  /** File opened that is not a database file */
  export interface SQLITE_NOTADB extends Error {
    code: 'SQLITE_NOTADB'
    errno: 26
    message: string
  }

  /** Notifications from sqlite3_log() */
  export interface SQLITE_NOTICE extends Error {
    code: 'SQLITE_NOTICE'
    errno: 27
    message: string
  }

  /** Warnings from sqlite3_log() */
  export interface SQLITE_WARNING extends Error {
    code: 'SQLITE_WARNING'
    errno: 28
    message: string
  }

  /** sqlite3_step() has another row ready */
  export interface SQLITE_ROW extends Error {
    code: 'SQLITE_ROW'
    errno: 100
    message: string
  }

  /** sqlite3_step() has finished executing */
  export interface SQLITE_DONE extends Error {
    code: 'SQLITE_DONE'
    errno: 101
    message: string
  }

}

