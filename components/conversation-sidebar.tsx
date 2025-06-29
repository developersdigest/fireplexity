"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

interface ConversationSidebarProps {
  user: { userId: string; email: string }
  currentConversationId: string | null
  onConversationSelect: (conversationId: string) => void
  onNewConversation: () => void
  isOpen: boolean
  onToggle: () => void
}

export function ConversationSidebar({ 
  user, 
  currentConversationId, 
  onConversationSelect, 
  onNewConversation,
  isOpen,
  onToggle 
}: ConversationSidebarProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState("")

  const conversations = useQuery(api.conversations.getUserConversations, {
    userId: user.userId as Id<"users">
  })

  const createConversation = useMutation(api.conversations.createConversation)
  const deleteConversation = useMutation(api.conversations.deleteConversation)

  const handleCreateConversation = async () => {
    if (!newTitle.trim()) {
      toast.error("Please enter a conversation title")
      return
    }

    try {
      const conversationId = await createConversation({
        userId: user.userId as Id<"users">,
        title: newTitle.trim()
      })
      
      setNewTitle("")
      setIsCreating(false)
      onConversationSelect(conversationId)
      toast.success("New conversation created!")
    } catch (error) {
      toast.error("Failed to create conversation")
      console.error("Error creating conversation:", error)
    }
  }

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      await deleteConversation({
        conversationId: conversationId as Id<"conversations">
      })
      
      if (currentConversationId === conversationId) {
        onNewConversation()
      }
      
      toast.success("Conversation deleted")
    } catch (error) {
      toast.error("Failed to delete conversation")
      console.error("Error deleting conversation:", error)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:z-auto
        w-80
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Conversations
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="lg:hidden"
              >
                ✕
              </Button>
            </div>
            
            {!isCreating ? (
              <Button
                onClick={() => setIsCreating(true)}
                variant="outline"
                className="w-full"
              >
                + New Conversation
              </Button>
            ) : (
              <div className="space-y-2">
                <Input
                  placeholder="Conversation title..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateConversation()
                    } else if (e.key === 'Escape') {
                      setIsCreating(false)
                      setNewTitle("")
                    }
                  }}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateConversation}
                    size="sm"
                    className="flex-1"
                  >
                    Create
                  </Button>
                  <Button
                    onClick={() => {
                      setIsCreating(false)
                      setNewTitle("")
                    }}
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {conversations?.map((conversation) => (
                <div
                  key={conversation._id}
                  className={`
                    group relative p-3 rounded-lg cursor-pointer transition-colors
                    ${currentConversationId === conversation._id 
                      ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  `}
                  onClick={() => onConversationSelect(conversation._id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {conversation.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatDate(conversation.updatedAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteConversation(conversation._id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 text-gray-400 hover:text-red-500"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
              ))}
              
              {conversations?.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs mt-1">Start a new conversation to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
