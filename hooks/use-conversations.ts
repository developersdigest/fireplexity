'use client'

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: Array<{
    id: string
    content: string
    role: string
    sources?: any
    followUpQuestions?: any
    ticker?: string
  }>
}

export function useConversations() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchConversations = async () => {
    if (!session) return
    
    try {
      setLoading(true)
      const response = await fetch("/api/conversations")
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error("Error fetching conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchConversation = async (id: string) => {
    if (!session) return null
    
    try {
      const response = await fetch(`/api/conversations/${id}`)
      if (response.ok) {
        const conversation = await response.json()
        setCurrentConversation(conversation)
        return conversation
      }
    } catch (error) {
      console.error("Error fetching conversation:", error)
    }
    return null
  }

  const createConversation = async (title: string = "New Conversation") => {
    if (!session) return null
    
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      })
      
      if (response.ok) {
        const newConversation = await response.json()
        setConversations(prev => [newConversation, ...prev])
        return newConversation
      }
    } catch (error) {
      console.error("Error creating conversation:", error)
    }
    return null
  }

  const updateConversation = async (id: string, title: string) => {
    if (!session) return false
    
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
      })
      
      if (response.ok) {
        setConversations(prev => 
          prev.map(c => c.id === id ? { ...c, title } : c)
        )
        if (currentConversation?.id === id) {
          setCurrentConversation(prev => prev ? { ...prev, title } : null)
        }
        return true
      }
    } catch (error) {
      console.error("Error updating conversation:", error)
    }
    return false
  }

  const deleteConversation = async (id: string) => {
    if (!session) return false
    
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== id))
        if (currentConversation?.id === id) {
          setCurrentConversation(null)
        }
        return true
      }
    } catch (error) {
      console.error("Error deleting conversation:", error)
    }
    return false
  }

  useEffect(() => {
    if (session) {
      fetchConversations()
    }
  }, [session])

  return {
    conversations,
    currentConversation,
    loading,
    fetchConversations,
    fetchConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    setCurrentConversation
  }
}
