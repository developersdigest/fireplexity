'use client'

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Plus, MessageSquare, Trash2, Edit2, Check, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: Array<{
    id: string
    content: string
    role: string
  }>
}

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  currentConversationId?: string | null
}

export function Sidebar({ isOpen, onToggle, currentConversationId }: SidebarProps) {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (session) {
      fetchConversations()
    }
  }, [session])

  const fetchConversations = async () => {
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

  const createNewConversation = async () => {
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" })
      })
      
      if (response.ok) {
        const newConversation = await response.json()
        setConversations(prev => [newConversation, ...prev])
        router.push(`/?conversation=${newConversation.id}`)
      }
    } catch (error) {
      console.error("Error creating conversation:", error)
    }
  }

  const deleteConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== id))
        if (currentConversationId === id) {
          router.push("/")
        }
      }
    } catch (error) {
      console.error("Error deleting conversation:", error)
    }
  }

  const updateConversationTitle = async (id: string, title: string) => {
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
        setEditingId(null)
      }
    } catch (error) {
      console.error("Error updating conversation:", error)
    }
  }

  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation.id)
    setEditTitle(conversation.title)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditTitle("")
  }

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      updateConversationTitle(editingId, editTitle.trim())
    }
  }

  if (!session) {
    return null
  }

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      <div className={cn(
        "fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "lg:relative lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <Button
              onClick={createNewConversation}
              className="w-full flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Conversation
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="text-center text-gray-500">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-gray-500">
                No conversations yet
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={cn(
                      "group relative p-3 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                      currentConversationId === conversation.id
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700"
                        : "border-gray-200 dark:border-gray-700"
                    )}
                    onClick={() => {
                      if (editingId !== conversation.id) {
                        router.push(`/?conversation=${conversation.id}`)
                        if (window.innerWidth < 1024) {
                          onToggle()
                        }
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      
                      {editingId === conversation.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit()
                              if (e.key === "Escape") cancelEditing()
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              saveEdit()
                            }}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              cancelEditing()
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium truncate">
                              {conversation.title}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(conversation.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditing(conversation)
                              }}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteConversation(conversation.id)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
