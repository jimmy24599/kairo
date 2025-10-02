'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'

const faqs = [
  {
    question: 'What can I build with Kairo?',
    answer: 'You can build full-stack web apps, landing pages, internal tools, and MVPs — all powered by AI. Whether you\'re a solo founder or a team, Kairo helps you go from idea to production in minutes.'
  },
  {
    question: 'Do I need to know how to code?',
    answer: 'Not necessarily. Kairo is built for makers of all backgrounds. You can describe your project in plain English, and the AI will generate the code. If you\'re a developer, you can dive in and customize anything.'
  },
  {
    question: 'Is the code exportable?',
    answer: 'Yes — you have full access to the generated code. You can export it, self-host it, or continue working locally using your preferred tools and frameworks.'
  },
  {
    question: 'Can I collaborate with others?',
    answer: 'Absolutely. You can invite collaborators to your projects, share progress, and even hand off to developers or clients — all in one place.'
  },
  {
    question: 'How is Kairo different from other AI tools?',
    answer: 'Kairo doesn\'t just generate UI components — it builds full, working apps with clean architecture, auth, APIs, and real business logic. It\'s like having a full-stack dev on autopilot.'
  },
  {
    question: 'What tech stack does the web app use?',
    answer: 'Kairo generates modern apps using Next.js, Tailwind CSS, TypeScript, and REST or tRPC for APIs — ready for deployment on platforms like Vercel or AWS.'
  }
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4"
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-secondary-600"
          >
            Everything you need to know about Kairo
          </motion.p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="border border-secondary-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-secondary-50 transition-colors"
              >
                <span className="font-medium text-secondary-900">
                  {faq.question}
                </span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-secondary-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-secondary-500" />
                )}
              </button>
              
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-4"
                  >
                    <p className="text-secondary-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

