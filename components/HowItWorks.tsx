'use client'

import { motion } from 'framer-motion'
import { 
  MessageSquare, 
  Code, 
  Zap, 
  CheckCircle,
  ArrowRight,
  Play
} from 'lucide-react'

const steps = [
  {
    icon: MessageSquare,
    title: 'Describe Your Idea',
    description: 'Simply tell us what you want to build in plain English. No technical jargon required.',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: Code,
    title: 'AI Generates Code',
    description: 'Our AI agent analyzes your requirements and generates clean, production-ready code.',
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: Zap,
    title: 'Instant Deployment',
    description: 'Your app is automatically deployed and ready to use. Share it with the world immediately.',
    color: 'from-green-500 to-green-600'
  }
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4"
          >
            How It Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-secondary-600 max-w-3xl mx-auto"
          >
            From idea to working app in three simple steps. No coding knowledge required.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="text-center"
            >
              <div className="relative">
                <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center mx-auto mb-6`}>
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-secondary-200 transform translate-x-4">
                    <div className="w-full h-full bg-gradient-to-r from-secondary-200 to-secondary-300"></div>
                  </div>
                )}
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                {step.title}
              </h3>
              <p className="text-secondary-600">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Demo Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-8 shadow-lg"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-secondary-900 mb-4">
              See It In Action
            </h3>
            <p className="text-secondary-600 max-w-2xl mx-auto">
              Watch how Kairo transforms a simple description into a fully functional web application.
            </p>
          </div>
          
          <div className="bg-secondary-100 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-primary-600" />
            </div>
            <p className="text-secondary-600 mb-4">
              Demo video coming soon
            </p>
            <button className="btn-primary flex items-center space-x-2 mx-auto">
              <span>Watch Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

