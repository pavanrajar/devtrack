

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
      }

      teamRole?: 'owner' | 'admin' | 'member'
    }
  }
}

export {}
