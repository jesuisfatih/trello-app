"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Plus, MoreVertical, User, Calendar, Edit, Trash2 } from "lucide-react"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ boardId: string }>
}

interface DragData {
  cardId: string
  fromListId: string
}

const FALLBACK_TRELLO_API_KEY = "700a7218afc6cb86683668584a52645b"

export default function BoardDetailPage({ params }: PageProps) {
  const [boardId, setBoardId] = useState<string>("")
  const [board, setBoard] = useState<any>(null)
  const [lists, setLists] = useState<any[]>([])
  const [cards, setCards] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trelloToken, setTrelloToken] = useState<string | null>(null)
  const [newCardTitles, setNewCardTitles] = useState<Record<string, string>>({})
  const dragDataRef = useRef<DragData | null>(null)
  const trelloApiKey = process.env.NEXT_PUBLIC_TRELLO_API_KEY || FALLBACK_TRELLO_API_KEY

  useEffect(() => {
    params.then((p) => {
      setBoardId(p.boardId)
      loadBoardData(p.boardId)
    })
  }, [params])

  async function getToken(): Promise<string | null> {
    if (trelloToken) {
      return trelloToken
    }

    try {
      const response = await fetch("/api/trello/status")
      const data = await response.json()

      if (data.connected && data.connection?.token) {
        setTrelloToken(data.connection.token)
        return data.connection.token
      }

      setError("Trello connection not found. Please reconnect from the integrations page.")
      return null
    } catch (err: any) {
      console.error("Failed to retrieve Trello token:", err)
      setError("Unable to retrieve Trello session. Please refresh and try again.")
      return null
    }
  }

  async function loadBoardData(id: string) {
    try {
      const statusResponse = await fetch("/api/trello/status")
      const statusData = await statusResponse.json()

      if (!statusData.connected || !statusData.connection) {
        setConnected(false)
        setLoading(false)
        return
      }

      setConnected(true)
      setTrelloToken(statusData.connection.token)

      const token = statusData.connection.token
      const boardUrl = `https://api.trello.com/1/boards/${id}?key=${trelloApiKey}&token=${token}&fields=name,desc,prefs,url`
      const boardResponse = await fetch(boardUrl)

      if (!boardResponse.ok) {
        throw new Error("Failed to fetch Trello board details")
      }

      const boardData = await boardResponse.json()
      setBoard(boardData)

      const listsUrl = `https://api.trello.com/1/boards/${id}/lists?key=${trelloApiKey}&token=${token}&cards=open`
      const listsResponse = await fetch(listsUrl)

      if (!listsResponse.ok) {
        throw new Error("Failed to fetch Trello lists")
      }

      const listsData = await listsResponse.json()
      setLists(listsData)

      const cardsData: Record<string, any[]> = {}
      for (const list of listsData) {
        const cardsUrl = `https://api.trello.com/1/lists/${list.id}/cards?key=${trelloApiKey}&token=${token}&members=true&labels=all&checklists=all`
        const cardsResponse = await fetch(cardsUrl)
        if (cardsResponse.ok) {
          cardsData[list.id] = await cardsResponse.json()
        }
      }
      setCards(cardsData)

      setLoading(false)
    } catch (err: any) {
      console.error("Failed to load board data:", err)
      setError(err.message || "Failed to load board")
      setLoading(false)
    }
  }

  async function refreshList(listId: string, token: string) {
    const cardsUrl = `https://api.trello.com/1/lists/${listId}/cards?key=${trelloApiKey}&token=${token}&members=true&labels=all&checklists=all`
    const cardsResponse = await fetch(cardsUrl)
    if (cardsResponse.ok) {
      const listCards = await cardsResponse.json()
      setCards((prev) => ({
        ...prev,
        [listId]: listCards,
      }))
    }
  }

  async function handleCreateCard(listId: string) {
    const title = (newCardTitles[listId] || "").trim()
    if (!title) {
      return
    }

    const token = await getToken()
    if (!token) {
      return
    }

    try {
      setError(null)
      const params = new URLSearchParams({
        idList: listId,
        name: title,
        pos: "bottom",
        key: trelloApiKey,
        token,
      })

      const response = await fetch(`https://api.trello.com/1/cards?${params.toString()}`, {
        method: "POST",
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || "Failed to create Trello card")
      }

      const card = await response.json()
      setCards((prev) => ({
        ...prev,
        [listId]: [...(prev[listId] || []), card],
      }))

      setNewCardTitles((prev) => ({ ...prev, [listId]: "" }))
    } catch (err: any) {
      console.error("Create card error:", err)
      setError(err.message || "Failed to create card")
      await loadBoardData(boardId)
    }
  }

  async function handleDeleteCard(listId: string, cardId: string) {
    if (!window.confirm("Delete this card?")) {
      return
    }

    const token = await getToken()
    if (!token) {
      return
    }

    try {
      setError(null)
      const params = new URLSearchParams({ key: trelloApiKey, token })
      const response = await fetch(`https://api.trello.com/1/cards/${cardId}?${params.toString()}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || "Failed to delete Trello card")
      }

      setCards((prev) => ({
        ...prev,
        [listId]: (prev[listId] || []).filter((card) => card.id !== cardId),
      }))
    } catch (err: any) {
      console.error("Delete card error:", err)
      setError(err.message || "Failed to delete card")
      await loadBoardData(boardId)
    }
  }

  async function handleEditCard(listId: string, card: any) {
    const newName = window.prompt("Update card name", card.name)
    if (newName === null) {
      return
    }

    const trimmed = newName.trim()
    if (!trimmed || trimmed === card.name) {
      return
    }

    const token = await getToken()
    if (!token) {
      return
    }

    try {
      setError(null)
      const params = new URLSearchParams({
        name: trimmed,
        key: trelloApiKey,
        token,
      })

      const response = await fetch(`https://api.trello.com/1/cards/${card.id}?${params.toString()}`, {
        method: "PUT",
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || "Failed to rename card")
      }

      setCards((prev) => ({
        ...prev,
        [listId]: (prev[listId] || []).map((current) =>
          current.id === card.id ? { ...current, name: trimmed } : current
        ),
      }))
    } catch (err: any) {
      console.error("Rename card error:", err)
      setError(err.message || "Failed to rename card")
      await refreshList(listId, token)
    }
  }

  async function handleListDrop(
    event: React.DragEvent<HTMLDivElement>,
    targetListId: string
  ) {
    event.preventDefault()

    const dragData = dragDataRef.current
    dragDataRef.current = null

    const transferredCardId = event.dataTransfer.getData("text/plain")
    const cardId = transferredCardId || dragData?.cardId

    if (!dragData || !cardId) {
      return
    }

    const token = await getToken()
    if (!token) {
      return
    }

    try {
      setError(null)
      const params = new URLSearchParams({
        idList: targetListId,
        pos: "bottom",
        key: trelloApiKey,
        token,
      })

      const response = await fetch(
        `https://api.trello.com/1/cards/${cardId}?${params.toString()}`,
        {
          method: "PUT",
        }
      )

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || "Failed to move Trello card")
      }

      const movedCard = await response.json()
      setCards((prev) => {
        const updated = { ...prev }
        updated[dragData.fromListId] = (updated[dragData.fromListId] || []).filter(
          (card) => card.id !== cardId
        )
        updated[targetListId] = [...(updated[targetListId] || []), movedCard]
        return updated
      })
    } catch (err: any) {
      console.error("Move card error:", err)
      setError(err.message || "Failed to move card")
      await loadBoardData(boardId)
    }
  }

  function handleDragStart(
    event: React.DragEvent<HTMLDivElement>,
    cardId: string,
    fromListId: string
  ) {
    dragDataRef.current = { cardId, fromListId }
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", cardId)
  }

  async function handleCreateList() {
    const name = window.prompt("New list name")
    if (!name) {
      return
    }

    const trimmed = name.trim()
    if (!trimmed) {
      return
    }

    const token = await getToken()
    if (!token) {
      return
    }

    try {
      setError(null)
      const params = new URLSearchParams({
        name: trimmed,
        pos: "bottom",
        idBoard: boardId,
        key: trelloApiKey,
        token,
      })

      const response = await fetch(`https://api.trello.com/1/lists?${params.toString()}`, {
        method: "POST",
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || "Failed to create Trello list")
      }

      const list = await response.json()
      setLists((prev) => [...prev, list])
      setCards((prev) => ({ ...prev, [list.id]: [] }))
    } catch (err: any) {
      console.error("Create list error:", err)
      setError(err.message || "Failed to create list")
      await loadBoardData(boardId)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">Trello Not Connected</h2>
          <p className="text-yellow-700 mb-4">Please connect your Trello account first</p>
          <Link href="/app/integrations/trello">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Connect Trello
            </button>
          </Link>
        </div>
      </div>
    )
  }

  if (error || !board) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Error</h2>
          <p className="text-red-700 mb-4">{error || 'Board not found'}</p>
          <Link href="/app/boards">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Back to Boards
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/app/boards">
              <button className="p-2 rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{board.name}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Trello board ID: <span className="font-mono text-xs text-gray-400">{board.id}</span>
              </p>
            </div>
          </div>
          <a
            href={board.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Open in Trello
          </a>
        </div>
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="overflow-x-auto pb-6">
        <div className="flex min-w-max gap-4">
          {lists.map((list) => (
            <div key={list.id} className="flex w-80 flex-shrink-0 flex-col">
              <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between rounded-t-xl border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <h3 className="font-semibold text-gray-900">{list.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">
                      {cards[list.id]?.length || 0}
                    </span>
                    <button className="rounded p-1 hover:bg-gray-100" type="button">
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div
                  className="flex-1 space-y-3 overflow-y-auto px-3 pb-3"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleListDrop(event, list.id)}
                >
                  {cards[list.id]?.map((card: any) => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(event) => handleDragStart(event, card.id, list.id)}
                      className="group relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md"
                    >
                      {card.labels && card.labels.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1">
                          {card.labels.map((label: any) => (
                            <span
                              key={label.id}
                              className="rounded px-2 py-0.5 text-xs font-medium text-white"
                              style={{ backgroundColor: label.color || "#64748b" }}
                            >
                              {label.name || label.color}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="mb-3 text-sm font-medium text-gray-900 transition-colors group-hover:text-blue-600">
                        {card.name}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        {card.due && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(card.due).toLocaleDateString()}
                          </span>
                        )}
                        {card.idMembers && card.idMembers.length > 0 && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {card.idMembers.length}
                          </span>
                        )}
                        {card.badges?.checkItems > 0 && (
                          <span>
                            {card.badges.checkItemsChecked}/{card.badges.checkItems}
                          </span>
                        )}
                        {card.badges?.comments > 0 && <span>💬 {card.badges.comments}</span>}
                      </div>

                      <div className="mt-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => handleEditCard(list.id, card)}
                          className="rounded bg-gray-100 p-1 text-gray-500 hover:bg-gray-200 hover:text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCard(list.id, card.id)}
                          className="rounded bg-gray-100 p-1 text-gray-500 hover:bg-gray-200 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {(!cards[list.id] || cards[list.id].length === 0) && (
                    <div className="rounded border border-dashed border-gray-200 py-6 text-center text-sm text-gray-400">
                      No cards
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 px-3 py-3">
                  <form
                    className="space-y-2"
                    onSubmit={(event) => {
                      event.preventDefault()
                      handleCreateCard(list.id)
                    }}
                  >
                    <input
                      type="text"
                      value={newCardTitles[list.id] || ""}
                      onChange={(event) =>
                        setNewCardTitles((prev) => ({ ...prev, [list.id]: event.target.value }))
                      }
                      placeholder="New card title"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add Card
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}

          <div className="flex w-80 flex-shrink-0 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white">
            <button
              type="button"
              onClick={handleCreateList}
              className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600 transition-colors hover:text-blue-600"
            >
              <Plus className="h-5 w-5" /> Add another list
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
