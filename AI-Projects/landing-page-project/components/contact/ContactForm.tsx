'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, Phone, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface FormData {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}

const initialValues: FormData = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: ''
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function ContactForm() {
  const [values, setValues] = useState<FormData>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<null | string>(null)
  const [failure, setFailure] = useState<null | string>(null)

  const validate = () => {
    const e: Partial<Record<keyof FormData, string>> = {}
    if (!values.name.trim()) e.name = 'Name is required'
    if (!values.email.trim()) e.email = 'Email is required'
    else if (!emailRegex.test(values.email)) e.email = 'Enter a valid email'
    if (!values.subject.trim()) e.subject = 'Subject is required'
    if (!values.message.trim() || values.message.trim().length < 10) e.message = 'Please provide at least 10 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }))
    if (errors[e.target.name as keyof FormData]) {
      setErrors((er) => ({ ...er, [e.target.name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(null)
    setFailure(null)
    if (!validate()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to send message')
      setSuccess('Thank you! Your message has been sent. Our advisors will reach out shortly.')
      setValues(initialValues)
    } catch (err: any) {
      setFailure(err?.message || 'Something went wrong. Please try again later.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-emerald-500/10 p-3 text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-5 w-5" />
          <p className="text-sm">{success}</p>
        </div>
      )}
      {failure && (
        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-red-500/10 p-3 text-red-300">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <p className="text-sm">{failure}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-zinc-300">Full Name</label>
          <input
            name="name"
            value={values.name}
            onChange={handleChange}
            placeholder="Jane Doe"
            className="w-full rounded-xl border border-white/10 bg-[#0B0F19]/60 px-4 py-3 text-sm outline-none placeholder:text-zinc-500"
          />
          {errors.name && <p className="mt-1 text-xs text-red-300">{errors.name}</p>}
        </div>
        <div>
          <label className="mb-2 block text-sm text-zinc-300">Email</label>
          <input
            name="email"
            value={values.email}
            onChange={handleChange}
            placeholder="jane@domain.com"
            type="email"
            className="w-full rounded-xl border border-white/10 bg-[#0B0F19]/60 px-4 py-3 text-sm outline-none placeholder:text-zinc-500"
          />
          {errors.email && <p className="mt-1 text-xs text-red-300">{errors.email}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-zinc-300">Phone (optional)</label>
          <input
            name="phone"
            value={values.phone}
            onChange={handleChange}
            placeholder="+1 555 000 0000"
            className="w-full rounded-xl border border-white/10 bg-[#0B0F19]/60 px-4 py-3 text-sm outline-none placeholder:text-zinc-500"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm text-zinc-300">Subject</label>
          <input
            name="subject"
            value={values.subject}
            onChange={handleChange}
            placeholder="I'd like to schedule a private tour"
            className="w-full rounded-xl border border-white/10 bg-[#0B0F19]/60 px-4 py-3 text-sm outline-none placeholder:text-zinc-500"
          />
          {errors.subject && <p className="mt-1 text-xs text-red-300">{errors.subject}</p>}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm text-zinc-300">Message</label>
        <textarea
          name="message"
          value={values.message}
          onChange={handleChange}
          rows={6}
          placeholder="Share a few details about your requirements..."
          className="w-full rounded-xl border border-white/10 bg-[#0B0F19]/60 px-4 py-3 text-sm outline-none placeholder:text-zinc-500"
        />
        {errors.message && <p className="mt-1 text-xs text-red-300">{errors.message}</p>}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-[#E5C970]" /> +1 (555) 123-4567</span>
          <span className="hidden h-4 w-px bg-white/10 sm:block" />
          <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-[#E5C970]" /> info@antaliaproperties.com</span>
        </div>
        <Button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F1E6B8] px-6 py-3 text-[#0B0F19]"
        >
          {submitting ? (
            <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Sending...</span>
          ) : (
            'Send Message'
          )}
        </Button>
      </div>
    </form>
  )
}

export default ContactForm
