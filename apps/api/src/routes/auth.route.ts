import bcrypt from 'bcryptjs'
import { Router } from 'express'
import jwt from 'jsonwebtoken'

import { createOrganizerSchema, loginSchema } from '@ayeye/types'

import { prisma } from '../lib/prisma'
import { validate } from '../middleware/validate'

const router = Router()

router.post('/register', validate(createOrganizerSchema), async (req, res) => {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      res.status(409).json({ success: false, error: 'Email already registered', statusCode: 409 })
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: 'ORGANIZER' },
    })

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env['JWT_SECRET'] ?? 'dev-secret',
      { expiresIn: '7d' },
    )

    res.status(201).json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
    })
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error', statusCode: 500 })
  }
})

router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string }

    const user = await prisma.user.findUnique({ where: { email } })
    const validPassword = user ? await bcrypt.compare(password, user.passwordHash) : false

    if (!user || !validPassword) {
      res.status(401).json({ success: false, error: 'Invalid email or password', statusCode: 401 })
      return
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env['JWT_SECRET'] ?? 'dev-secret',
      { expiresIn: '7d' },
    )

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
    })
  } catch {
    res.status(500).json({ success: false, error: 'Internal server error', statusCode: 500 })
  }
})

export default router
