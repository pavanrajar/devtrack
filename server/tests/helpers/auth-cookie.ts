const cookieName = 'devtrack_session'

export const getAuthCookie = (setCookieHeaders: string[] | undefined): string => {
  const header = setCookieHeaders?.find((value) =>
    value.startsWith(`${cookieName}=`),
  )
  if (!header) throw new Error('Authentication cookie was not set.')
  return header.split(';', 1)[0]
}

export const getAuthToken = (setCookieHeaders: string[] | undefined): string =>
  getAuthCookie(setCookieHeaders).slice(cookieName.length + 1)
