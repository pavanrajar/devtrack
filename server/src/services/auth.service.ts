
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../config/database'
import { env } from '../config/env'
import { LoginInput, RegisterInput } from '../validators/auth.validator'

const SALT_ROUNDS = 12

interface UserRecord {
  id: string
  full_name: string
  email: string
  password_hash: string
  created_at: Date
}

interface PublicUser {
  id: string
  fullName: string
  email: string
  createdAt: Date
}

interface AuthResult {
  user: PublicUser
  token: string
}

const toPublicUser = (user: UserRecord): PublicUser => ({
  id: user.id,
  fullName: user.full_name,
  email: user.email,
  createdAt: user.created_at,
})

const generateToken = (userId: string): string => {
  return jwt.sign(
    {},
    env.JWT_SECRET,
    {
      subject: userId,
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    },
  )
}

export const registerUser = async (
  input: RegisterInput,
): Promise<AuthResult> => {
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
    [input.email],
  )

  if (existingUser.rowCount && existingUser.rowCount > 0) {
    const error = new Error('An account with this email already exists') as Error & {
      statusCode: number
    }
    error.statusCode = 409
    throw error
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS)

  try {
    const result = await pool.query<UserRecord>(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, full_name, email, password_hash, created_at`,
      [input.fullName, input.email, passwordHash],
    )

    const user = result.rows[0]

    return {
      user: toPublicUser(user),
      token: generateToken(user.id),
    }
  } catch (error) {
    // Handle a concurrent registration for the same email.
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505'
    ) {
      const conflict = new Error(
        'An account with this email already exists',
      ) as Error & { statusCode: number }

      conflict.statusCode = 409
      throw conflict
    }

    throw error
  }
}

export const loginUser = async (
  input: LoginInput,
): Promise<AuthResult> => {
  const result = await pool.query<UserRecord>(
    `SELECT id, full_name, email, password_hash, created_at
     FROM users
     WHERE LOWER(email) = LOWER($1)`,
    [input.email],
  )

  const user = result.rows[0]

  if (!user) {
    const error = new Error('Invalid email or password') as Error & {
      statusCode: number
    }
    error.statusCode = 401
    throw error
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.password_hash,
  )

  if (!passwordMatches) {
    const error = new Error('Invalid email or password') as Error & {
      statusCode: number
    }
    error.statusCode = 401
    throw error
  }

  return {
    user: toPublicUser(user),
    token: generateToken(user.id),
  }
}

export const getUserById = async (
  userId: string,
): Promise<PublicUser | null> => {
  const result = await pool.query<UserRecord>(
    `SELECT id, full_name, email, password_hash, created_at
     FROM users
     WHERE id = $1`,
    [userId],
  )

  const user = result.rows[0]

  return user ? toPublicUser(user) : null
}
