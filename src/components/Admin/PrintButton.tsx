'use client'

import React from 'react'

export const PrintButton: React.FC = () => (
  <button
    type="button"
    onClick={() => window.print()}
    className="no-print rounded-full bg-ink px-6 py-3 text-[16px] font-medium text-white hover:bg-ink/85"
  >
    Print this sheet
  </button>
)
