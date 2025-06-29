"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: { userId: string; email: string }) => void
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)

    try {
      if (authMode === 'register') {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Registration failed')
        }

        const user = await response.json()
        toast.success('Account created successfully!')
        onSuccess(user)
        onClose()
      } else {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Login failed')
        }

        const user = await response.json()
        toast.success('Logged in successfully!')
        onSuccess(user)
        onClose()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
  }

  const switchMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login')
    resetForm()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {authMode === 'login' ? 'Sign In' : 'Create Account'}
          </DialogTitle>
          <DialogDescription>
            {authMode === 'login' 
              ? 'Enter your email and password to access Fireplexity'
              : 'Create a new account to get started with Fireplexity'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
          
          <div className="flex flex-col gap-2">
            <Button 
              type="submit" 
              variant="orange" 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading 
                ? (authMode === 'login' ? 'Signing in...' : 'Creating account...') 
                : (authMode === 'login' ? 'Sign In' : 'Create Account')
              }
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              onClick={switchMode}
              disabled={isLoading}
              className="w-full"
            >
              {authMode === 'login' 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
