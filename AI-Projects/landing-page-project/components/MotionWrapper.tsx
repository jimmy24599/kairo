'use client'

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

const MotionDiv = dynamic(() => import('framer-motion').then(mod => ({ default: mod.motion.div })), {
  ssr: false,
  loading: () => <div />
})

interface MotionWrapperProps {
  children: ReactNode
  className?: string
  initial?: any
  animate?: any
  transition?: any
  whileInView?: any
  whileHover?: any
  whileTap?: any
  variants?: any
  viewport?: any
}

export const MotionDivWrapper = ({ children, className, ...props }: MotionWrapperProps) => {
  return (
    <MotionDiv className={className} {...props}>
      {children}
    </MotionDiv>
  )
}