'use client'

import { motion } from 'framer-motion'
import { 
  Brain, 
  Code, 
  Zap, 
  Shield, 
  Users, 
  Globe,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'True Agentic Coding',
    description: 'AI agents that understand context and make intelligent decisions across your entire codebase',
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: Code,
    title: 'Multi-File Refactoring',
    description: 'Seamlessly refactor across multiple files with full dependency tracking',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: Shield,
    title: 'Less Errors',
    description: '90% fewer errors and more reliable code with intelligent error prevention',
    color: 'from-green-500 to-green-600'
  },
  {
    icon: Zap,
    title: 'Auto Bug Fixes',
    description: 'Fix errors and bugs automatically without manual intervention',
    color: 'from-yellow-500 to-yellow-600'
  },
  {
    icon: Users,
    title: 'Advanced Context Awareness',
    description: 'Deep understanding of your project structure, patterns, and conventions',
    color: 'from-pink-500 to-pink-600'
  },
  {
    icon: Globe,
    title: 'Seamless Integration',
    description: 'Works seamlessly with other tools and workflows',
    color: 'from-indigo-500 to-indigo-600'
  }
]

export default function Features() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4"
          >
            Meet Agent Mode
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-secondary-600 max-w-3xl mx-auto"
          >
            Agent Mode can build apps of any complexity—it reasons through problems, 
            understands global context, executes commands, and fixes bugs automatically.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="card hover:shadow-lg transition-shadow duration-300"
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-secondary-600">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* What's New Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-16 p-8 bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl"
        >
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-secondary-900 mb-2">
              Here's what's new:
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-secondary-900 mb-1">Smarter Code Edits</h4>
                <p className="text-secondary-600">Agent mode has a global understanding of your codebase.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-secondary-900 mb-1">90% Fewer Errors</h4>
                <p className="text-secondary-600">With Agent mode, the code is 90% less likely to break.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

