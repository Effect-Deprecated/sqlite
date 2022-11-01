declare global {
  export type TODO = any
}

export const objectToString = (error: any): string => {
  const stack = typeof process !== 'undefined' && process.env.CL_DEBUG ? error.stack : undefined
  const str = error.toString()
  const stackStr = stack ? `\n${stack}` : ''
  if (str !== '[object Object]') return str + stackStr

  try {
    return JSON.stringify({ ...error, stack }, null, 2)
  } catch (e: any) {
    console.log(error)

    return 'Error while printing error: ' + e
  }
}

export const errorToString = objectToString
