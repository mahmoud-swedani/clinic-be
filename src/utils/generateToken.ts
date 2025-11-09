import jwt from 'jsonwebtoken'

interface TokenPayload {
  id: string
  role?: string
}

export const generateToken = (userId: string, role?: string) => {
  const payload: TokenPayload = { id: userId }
  if (role) {
    payload.role = role
  }

  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  })
}
