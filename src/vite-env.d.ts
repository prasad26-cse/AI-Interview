/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_HUGGINGFACE_API_KEY?: string
  readonly VITE_HUGGINGFACE_API_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
