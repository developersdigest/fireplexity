'use client'

import { useChat } from 'ai/react'
import { SearchComponent } from './search'
import { ChatInterface } from './chat-interface'
import { SearchResult } from './types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { toast } from "sonner"
import { ErrorDisplay } from '@/components/error-display'
import { useSession } from "next-auth/react"
import { AuthButton } from "@/components/auth-button"
import { Sidebar } from "@/components/sidebar"
import { useConversations } from "@/hooks/use-conversations"
import { useSearchParams, useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"

interface MessageData {
  sources: SearchResult[]
  followUpQuestions: string[]
  ticker?: string
}

export default function FireplexityPage() {
  const { data: session, status } = useSession()
  const [sources, setSources] = useState<SearchResult[]>([])
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([])
  const [searchStatus, setSearchStatus] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const lastDataLength = useRef(0)
  const [messageData, setMessageData] = useState<Map<number, MessageData>>(new Map())
  const currentMessageIndex = useRef(0)
  const [currentTicker, setCurrentTicker] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const { currentConversation, fetchConversation, createConversation } = useConversations()
  const searchParams = useSearchParams()
  const router = useRouter()

  const { messages, input, handleInputChange, handleSubmit, isLoading, data, setMessages } = useChat({
    api: '/api/fireplexity/search',
    body: {
      conversationId: currentConversationId
    },
    onResponse: () => {
      // Clear status when response starts
      setSearchStatus('')
      // Clear current data for new response
      setSources([])
      setFollowUpQuestions([])
      setCurrentTicker(null)
      // Track the current message index (assistant messages only)
      const assistantMessages = messages.filter(m => m.role === 'assistant')
      currentMessageIndex.current = assistantMessages.length
    },
    onError: (error) => {
      console.error('Chat error:', error)
      setSearchStatus('')
    },
    onFinish: () => {
      setSearchStatus('')
      // Reset data length tracker
      lastDataLength.current = 0
    }
  })

  // Handle custom data from stream - only process new items
  useEffect(() => {
    if (data && Array.isArray(data)) {
      // Only process new items that haven't been processed before
      const newItems = data.slice(lastDataLength.current)
      
      newItems.forEach((item) => {
        if (!item || typeof item !== 'object' || !('type' in item)) return
        
        const typedItem = item as unknown as { 
          type: string; 
          message?: string; 
          sources?: SearchResult[]; 
          questions?: string[]; 
          symbol?: string;
          conversationId?: string;
        }
        if (typedItem.type === 'status') {
          setSearchStatus(typedItem.message || '')
        }
        if (typedItem.type === 'ticker' && typedItem.symbol) {
          setCurrentTicker(typedItem.symbol)
          const newMap = new Map(messageData)
          const existingData = newMap.get(currentMessageIndex.current) || { sources: [], followUpQuestions: [] }
          newMap.set(currentMessageIndex.current, { ...existingData, ticker: typedItem.symbol })
          setMessageData(newMap)
        }
        if (typedItem.type === 'sources' && typedItem.sources) {
          setSources(typedItem.sources)
          const newMap = new Map(messageData)
          const existingData = newMap.get(currentMessageIndex.current) || { sources: [], followUpQuestions: [] }
          newMap.set(currentMessageIndex.current, { ...existingData, sources: typedItem.sources })
          setMessageData(newMap)
        }
        if (typedItem.type === 'follow_up_questions' && typedItem.questions) {
          setFollowUpQuestions(typedItem.questions)
          const newMap = new Map(messageData)
          const existingData = newMap.get(currentMessageIndex.current) || { sources: [], followUpQuestions: [] }
          newMap.set(currentMessageIndex.current, { ...existingData, followUpQuestions: typedItem.questions })
          setMessageData(newMap)
        }
        if (typedItem.type === 'conversation_id' && typedItem.conversationId) {
          if (!currentConversationId) {
            setCurrentConversationId(typedItem.conversationId)
            router.push(`/?conversation=${typedItem.conversationId}`)
          }
        }
      })
      
      // Update the last processed length
      lastDataLength.current = data.length
    }
  }, [data, messageData])


  // Handle conversation loading from URL
  useEffect(() => {
    const conversationId = searchParams.get('conversation')
    if (conversationId && conversationId !== currentConversationId) {
      setCurrentConversationId(conversationId)
      loadConversation(conversationId)
    } else if (!conversationId && currentConversationId) {
      setCurrentConversationId(null)
      setMessages([])
      setSources([])
      setFollowUpQuestions([])
      setCurrentTicker(null)
      setMessageData(new Map())
      setHasSearched(false)
    }
  }, [searchParams, currentConversationId])

  const loadConversation = async (conversationId: string) => {
    try {
      const conversation = await fetchConversation(conversationId)
      if (conversation) {
        const chatMessages = conversation.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: new Date(msg.createdAt)
        }))
        setMessages(chatMessages)
        setHasSearched(chatMessages.length > 0)
        
        const newMessageData = new Map()
        conversation.messages.forEach((msg: any, index: number) => {
          if (msg.role === 'assistant') {
            const assistantIndex = Math.floor(index / 2)
            newMessageData.set(assistantIndex, {
              sources: msg.sources || [],
              followUpQuestions: msg.followUpQuestions || [],
              ticker: msg.ticker || null
            })
          }
        })
        setMessageData(newMessageData)
        
        const lastAssistantMessage = conversation.messages
          .filter((msg: any) => msg.role === 'assistant')
          .pop()
        
        if (lastAssistantMessage) {
          setSources(lastAssistantMessage.sources || [])
          setFollowUpQuestions(lastAssistantMessage.followUpQuestions || [])
          setCurrentTicker(lastAssistantMessage.ticker || null)
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error)
      toast.error('Failed to load conversation')
    }
  }


  const handleSearch = (query: string) => {
    if (status !== "authenticated") {
      toast.error("Please sign in to search")
      return
    }
    
    setHasSearched(true)
    setSources([])
    setFollowUpQuestions([])
    setCurrentTicker(null)
    currentMessageIndex.current = Math.floor(messages.length / 2)
    
    handleInputChange({ target: { value: query } } as any)
    handleSubmit({ preventDefault: () => {} } as any)
  }

  const handleChatSubmit = (e: React.FormEvent) => {
    if (status !== "authenticated") {
      e.preventDefault()
      toast.error("Please sign in to continue the conversation")
      return
    }
    
    if (!hasSearched) {
      setHasSearched(true)
    }
    
    setSources([])
    setFollowUpQuestions([])
    setCurrentTicker(null)
    currentMessageIndex.current = Math.floor(messages.length / 2)
    
    handleSubmit(e)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex">
      {session && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          currentConversationId={currentConversationId}
        />
      )}
      
      <div className={`flex-1 transition-all duration-300 ${session ? 'lg:ml-0' : ''}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-between mb-4">
                {session && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                )}
                
                <div className="flex items-center justify-center gap-3 flex-1">
                  <Image
                    src="/logo.png"
                    alt="Fireplexity Logo"
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Fireplexity
                  </h1>
                </div>
                
                <AuthButton />
              </div>
              <p className="text-gray-600 text-lg">
                AI-powered search with real-time insights
              </p>
            </div>

            {!session ? (
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold mb-4">Welcome to Fireplexity</h2>
                <p className="text-gray-600 mb-6">Sign in to start searching and save your conversations</p>
                <AuthButton />
              </div>
            ) : !hasSearched ? (
              <SearchComponent 
                handleSubmit={(e) => {
                  e.preventDefault()
                  handleSearch(input)
                }}
                input={input}
                handleInputChange={handleInputChange}
                isLoading={isLoading}
              />
            ) : (
              <ChatInterface
                messages={messages}
                input={input}
                handleInputChange={handleInputChange}
                handleSubmit={handleChatSubmit}
                isLoading={isLoading}
                sources={sources}
                followUpQuestions={followUpQuestions}
                searchStatus={searchStatus}
                messageData={messageData}
                currentTicker={currentTicker}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
