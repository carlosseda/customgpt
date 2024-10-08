import { createSlice } from '@reduxjs/toolkit'

export const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    user: null,
    assistant: null,
    threadId: null,
    prompt: null,
    historyPrompts: [],
    responseState: false,
    images: null
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload
    },
    setAssistant: (state, action) => {
      state.assistant = action.payload
    },
    setThread: (state, action) => {
      state.threadId = action.payload
    },
    newPrompt: (state, action) => {
      state.prompt = action.payload
    },
    setResponseState: (state, action) => {
      state.responseState = action.payload
    },
    setImages: (state, action) => {
      state.images = action.payload
    },
    setHistoryPrompts: (state, action) => {
      state.historyPrompts = action.payload
    }
  }
})

export const { 
  setUser, 
  setAssistant, 
  newPrompt, 
  setResponseState, 
  setThread, 
  setImages, 
  setHistoryPrompts 
} = chatSlice.actions

export default chatSlice.reducer
