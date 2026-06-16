import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Users, Lightbulb, BarChart3, Globe } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <span className="text-xl font-bold text-blue-600">Compass</span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
          <Button asChild size="sm">
            <Link href="/signup">Get started free</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm text-blue-700 font-medium mb-6">
          Modeled after IDEO.org Human-Centered Design
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
          From idea to impact,<br />guided by design thinking
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Compass guides individuals, governments, and organizations through a structured human-centered design process — with AI facilitation, stakeholder feedback, and execution planning built in.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/signup">Start your project <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </section>

      {/* Process steps */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">The 8-phase HCD process</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Every project follows a proven design thinking framework. AI facilitates each phase, stakeholders co-create the solution, and you end with a concrete execution plan.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { n: 1, title: 'Frame the Challenge', desc: 'Define the problem and user personas' },
              { n: 2, title: 'Empathy & Research', desc: 'Surface deep user needs and context' },
              { n: 3, title: 'Ideation', desc: 'Generate and cluster solution ideas' },
              { n: 4, title: 'Concept Development', desc: 'Co-create a base solution model' },
              { n: 5, title: 'Feedback Collection', desc: 'Share with stakeholders via link' },
              { n: 6, title: 'Synthesis', desc: 'AI merges all feedback into one model' },
              { n: 7, title: 'Execution Plan', desc: 'Actions, owners, KPIs, timeline' },
              { n: 8, title: 'Evaluation', desc: 'Track, adapt, and improve over time' },
            ].map((phase) => (
              <div key={phase.n} className="bg-white rounded-xl border p-4">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center mb-3">
                  {phase.n}
                </div>
                <h3 className="font-semibold text-sm mb-1">{phase.title}</h3>
                <p className="text-xs text-gray-500">{phase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Built for real-world complexity</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Lightbulb, title: 'AI-Guided Facilitation', desc: 'Claude walks you through each phase with expert prompts — no design background needed.' },
            { icon: Globe, title: 'No-Account Feedback', desc: 'Share a link. Stakeholders respond without signing up. Truly inclusive participation.' },
            { icon: Users, title: 'Localized Adaptation', desc: 'Every stakeholder can remix the model for their context. AI synthesizes all versions.' },
            { icon: BarChart3, title: 'Execution + Metrics', desc: 'End with an action plan, KPIs, and a data collection framework ready to use.' },
          ].map((f) => (
            <div key={f.title} className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <f.icon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Simple pricing</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { plan: 'Starter', price: 'Free', features: ['1 project', '3 feedback respondents', 'Phases 1–4', 'Basic export'] },
              { plan: 'Pro', price: '$49/mo', features: ['10 projects', 'Unlimited respondents', 'All 8 phases', 'AI synthesis', 'Execution plans', 'PDF export'], highlight: true },
              { plan: 'Enterprise', price: 'Custom', features: ['Unlimited projects', 'White-label', 'SSO / SAML', 'API access', 'Dedicated support'] },
            ].map((tier) => (
              <div key={tier.plan} className={`rounded-xl border p-6 ${tier.highlight ? 'border-blue-600 ring-2 ring-blue-600 bg-white' : 'bg-white'}`}>
                <h3 className="font-bold text-lg">{tier.plan}</h3>
                <p className="text-3xl font-bold mt-2 mb-4">{tier.price}</p>
                <ul className="space-y-2 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="text-sm text-gray-600 flex gap-2">
                      <span className="text-emerald-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full" variant={tier.highlight ? 'default' : 'outline'}>
                  <Link href="/signup">Get started</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-gray-500">
        <p>Compass — Human-Centered Design Platform. Modeled on IDEO.org methodology.</p>
      </footer>
    </div>
  )
}
